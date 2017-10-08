var express = require('express');
var request = require('request');
var qb = require('./query_builder');
var dps = require('dbpedia-sparql-client').default;
var uris = require('./uris').uris;
var sameas = require('./sameas');
var n3 = require('n3');
var p = require('./prefixes');
// var ldf = require('ldf-client');

var defaultTimeout = 8000;
const DBP_URI = 'http://dbpedia.org/sparql';

var ur = function(tm) {
  if (tm && tm.includes(":") && !tm.includes("http") ) {
    var pf, pr; var arr = tm.split(":");
    pf = arr[0]; pr = arr[1];
    tm = p.prefixes.prefixes[pf] + pr;
  }
  return tm
}

var getSingle = function(s, p, o, store) {
  return store.getTriples(ur(s), ur(p), ur(o))[0].object;
}

var getObject = function(o, map, store) {
  var object = { "uri": ur(o) };
  Object.keys(map).forEach(function(predicate) {
    object[map[predicate]] = getSingle(ur(o), predicate, null, store);
  });
  return object
}

var getCollection = function(s, p, map, store) {
  var array = [];
  store.getTriples(ur(s), ur(p), null).forEach(function(triple) {
    if (map) {
      var object = getObject(triple.object, map, store);
      if (object) array.push(object);
    }
    else {
      array.push(triple.object)
    }
  });
  return array
}

var getCategoryLabel = function(uri) {
  return uri.replace("Wikicat", "").split("/").slice(-1)[0].replace(/([A-Z0-9]+)/g, ' $1')
}

var extractCategories = function(categories) {
  var array = [];
  categories.forEach(function(category) {
    array.push({
      "uri": category,
      "label": getCategoryLabel(category)
    });
  });
  return array;
}

module.exports.get_artist_abstract = function(mbid, name, cb) {
  sameas.find_dbpedia_link(mbid, name, function(body) {
    var query, params;
    var dbpedia_uri = body;
    console.log(dbpedia_uri);
    params = { URI: dbpedia_uri, LANG: "en" };
    query = qb.buildQuery("artist_abstract", params);
    dps.client()
      .query(query)
      .timeout(defaultTimeout)
      .asJson()
      .then(function(r) {
        if (r.results.bindings.length > 0 && dbpedia_uri != r.results.bindings[0].dbpedia_uri.value ) {
          dbpedia_uri = r.results.bindings[0].dbpedia_uri.value;
        }
        var json = {
          about: r.results.bindings[0].about.value,
          abstract: r.results.bindings[0].abs.value,
          dbpedia_uri: dbpedia_uri };
        cb(json);
      })
      .catch(function(e) { cb(e) });
  })
}


module.exports.get_artist_abstract_directly = function(dbpedia_uri, cb) {
  console.log(dbpedia_uri);
  params = { URI: dbpedia_uri, LANG: "en" };
  query = qb.buildQuery("artist_abstract", params);
  dps.client()
    .query(query)
    .timeout(defaultTimeout)
    .asJson()
    .then(function(r) {
      if (r.results.bindings.length > 0 && dbpedia_uri != r.results.bindings[0].dbpedia_uri.value ) {
        dbpedia_uri = r.results.bindings[0].dbpedia_uri.value;
      }
      var json = {
        about: r.results.bindings[0].about.value,
        abstract: r.results.bindings[0].abs.value,
        dbpedia_uri: dbpedia_uri };
      cb(json);
    })
    .catch(function(e) { cb(e) });
}

module.exports.get_associated_artists = function(dbpedia_uri, cb) {
  var query, params;
  params = { URI: dbpedia_uri, LANG: "en" };
  query = qb.buildQuery("associated_artists", params);
  dps.client()
    .query(query)
    .timeout(defaultTimeout)
    .asJson()
    .then(function(r) {
      var artists = [];
      if (r.results.bindings.length > 0) {
        r.results.bindings.forEach(function(artist) {
          artists.push({ dbpedia_uri: artist.dbpedia_uri.value, name: artist.name.value  })
        });
      }
      cb(artists);
    })
    .catch(function(e) { cb(e) });
}

module.exports.get_categories = function(dbpedia_uri, cb) {
  var query, params;
  params = { URI: dbpedia_uri };
  query = qb.buildQuery("artist_categories", params);
  console.log(query);
  dps.client()
    .query(query)
    .timeout(defaultTimeout)
    .asJson()
    .then(function(r) {
      cb(r.results.bindings)
    })
    .catch(function(e) { cb(e) });
}

module.exports.get_category_links = function(yago_uri, artist_uri, limit, cb) {
  var query, params;
  params = { YAGO_URI: yago_uri, ARTIST_URI: artist_uri, LIMIT: limit };
  query = qb.buildQuery("wikicat_links", params);
  console.log(query);
  dps.client()
    .query(query)
    .timeout(defaultTimeout)
    .asJson()
    .then(function(r) {
      console.log(r);
      var category = {};
      var artists = [];
      r.results.bindings.forEach(function(row) {
        artists.push({ dbpedia_uri: row.uri.value, name: row.name.value });
      });
      category.uri = yago_uri;
      category.label = getCategoryLabel(yago_uri);
      category.artists = artists;
      cb(category)
    })
    .catch(function(e) { cb(e) });
}

module.exports.construct_artist = function(dbpedia_uri, cb) {
  var params = { URI: dbpedia_uri, LANG: "en" };
  var query = qb.buildQuery("construct_artist", params);
  dps.client()
    .query(query)
    .timeout(defaultTimeout)
    .asJson()
    .then(function(r) {
      artist = { "dbpedia_uri": dbpedia_uri };
      if (r.results.bindings.length > 0) {
        var store = n3.Store();
        r.results.bindings.forEach(function(triple) {
            store.addTriple(triple.s.value, triple.p.value, triple.o.value);
        });
        artist["abstract"] = getSingle(dbpedia_uri, 'dbpo:abstract', null, store);
        artist["name"] = getSingle(dbpedia_uri, 'foaf:name', null, store);
        artist["wikipedia_uri"] = getSingle(dbpedia_uri, 'dbpo:about', null, store);
        artist["categories"] = extractCategories(getCollection(dbpedia_uri, 'rdf:type', null, store));
        artist["genres"] = getCollection(dbpedia_uri, 'dbpo:genre', { "rdfs:label": "label" }, store);
        artist["associated_artists"] = { "label": "Associated Artists", "artists": getCollection(dbpedia_uri, 'dbpo:associatedMusicalArtist', { "foaf:name": "name" }, store) };
      }
      cb(artist);
    })
    .catch(function(e) { cb(e) });
}

/*
module.exports.describe_artist = function(dbpedia_uri, cb) {
  var query, params;
  params = { URI: dbpedia_uri };
  query = qb.buildQuery("describe_artist", params);
  dps.client()
    .query(query)
    .timeout(defaultTimeout)
    .asJson()
    .then(function(r) {
      console.log("Creating a store");
      var store = n3.Store();
      r.results.bindings.forEach(function(triple) {
        if (triple.s.value == dbpedia_uri && (!triple.o.lang || triple.o.lang == "en")) {
          store.addTriple(triple.s.value, triple.p.value, triple.o.value);
        }
      });
      artist = { "dbpedia_uri": dbpedia_uri };
      store.getTriples(dbpedia_uri, 'http://dbpedia.org/ontology/abstract', null).forEach(function(trpl) {
        artist["abstract"] = trpl.object
      });
      artist.genre = {};
      store.getTriples(dbpedia_uri, 'http://dbpedia.org/ontology/genre', null).forEach(function(trpl) {
        artist["genre"].push(trpl.object);
      });
      artist.categories = [];
      cb(artist);
    })
    .catch(function(e) { cb(e) })
}
*/

// var qs = { query: query, timeout: defaultTimeout, format: "text" };
// var frag_uri = DBP_URI+'?'+Object.keys(qs).map(key => `${key}=${encodeURIComponent(qs[key])}`).join('&');
// var fragmentsClient = new ldf.FragmentsClient(frag_uri);
// query = 'SELECT ?abs WHERE { <%URI> <http://dbpedia.org/ontology/abstract> ?abs . }'.replace("%URI", dbpedia_uri);
// console.log("QUERY: " + query);
// var results = new ldf.SparqlIterator(query, { fragmentsClient: fragmentsClient });
//results.on('data', function (result) { console.log(result); });
