var express = require("express");
var request = require("request");
var qb = require("./query_builder");
var dps = require("dbpedia-sparql-client").default;
var uris = require("./uris").uris;
var lx = require("./musiclynx");
var n3 = require("n3");
var p = require("./prefixes");
var wd = require("./wikidata");
var fi = require("./filter");
var gr = require("./graph");

var defaultTimeout = 8000;
// const DBP_URI = 'http://dbpedia.org/sparql';
const DBP_URI = "http://dbpedia-live.openlinksw.com/sparql";

var ur = function (tm) {
  if (tm && tm.includes(":") && !tm.includes("http")) {
    var pf, pr;
    var arr = tm.split(":");
    pf = arr[0];
    pr = arr[1];
    tm = p.prefixes.prefixes[pf] + pr;
  }
  return tm;
};

var getSingle = function (s, p, o, store) {
  return store.getTriples(ur(s), ur(p), ur(o))[0].object;
};

var getObject = function (o, map, store) {
  var object = { uri: ur(o) };
  Object.keys(map).forEach(function (predicate) {
    object[map[predicate]] = getSingle(ur(o), predicate, null, store);
  });
  return object;
};

var getCollection = function (s, p, map, store) {
  var array = [];
  store.getTriples(ur(s), ur(p), null).forEach(function (triple) {
    if (map) {
      var object = getObject(triple.object, map, store);
      if (object) array.push(object);
    } else {
      array.push(triple.object);
    }
  });
  return array;
};

var getCategoryLabel = function (uri) {
  let label = uri.split("/").pop();
  label = label.replace(/^Category:/, "");
  label = label.replace(/[_-]+/g, " ");
  return "Other " + label;
};

var extractCategories = function (categories) {
  var array = [];
  categories.forEach(function (category) {
    array.push({
      uri: category,
      label: getCategoryLabel(category),
    });
  });
  return array;
};

var getImageUri = function (dbpedia_uri, store) {
  var depiction = getSingle(dbpedia_uri, "foaf:depiction", null, store);
  var image = "";
  if (depiction) {
    image = wd.getImageUri();
  }
};

module.exports.get_artist_abstract = function (dbpedia_uri, mbid, name, cb) {
  var query, params, options;
  params = { URI: dbpedia_uri, LANG: "en" };
  query = qb.buildQuery("artist_abstract", params);
  options = {
    method: "GET",
    uri:
      uris.dbpedia_uri + "?query=" + encodeURIComponent(query) + "&format=json",
  };
  request(options, function (err, response, body) {
    var json = JSON.parse(body);
    var result = {};
    if (json.results.bindings && json.results.bindings.length == 1) {
      result["name"] = name;
      result["dbpedia_uri"] = dbpedia_uri;
      result["id"] = mbid;
      result["abstract"] = json.results.bindings[0].abstract.value;
      result["wikipedia_uri"] = json.results.bindings[0].wikipedia_uri.value;
    }
    cb(result);
  });
};

module.exports.get_artist_abstract_directly = function (dbpedia_uri, cb) {
  // console.log(dbpedia_uri);
  params = { URI: dbpedia_uri, LANG: "en" };
  query = qb.buildQuery("artist_abstract", params);
  dps
    .client()
    .query(query)
    .timeout(defaultTimeout)
    .asJson()
    .then(function (r) {
      if (
        r.results.bindings.length > 0 &&
        dbpedia_uri != r.results.bindings[0].dbpedia_uri.value
      ) {
        dbpedia_uri = r.results.bindings[0].dbpedia_uri.value;
      }
      var json = {
        about: r.results.bindings[0].about.value,
        abstract: r.results.bindings[0].abs.value,
        dbpedia_uri: dbpedia_uri,
      };
      cb(json);
    })
    .catch(function (e) {
      cb(e);
    });
};

module.exports.get_associated_artists = function (dbpedia_uri, cb) {
  var query, params;
  params = { URI: dbpedia_uri, LANG: "en" };
  query = qb.buildQuery("associated_artists", params);
  options = {
    method: "GET",
    uri:
      uris.dbpedia_uri + "?query=" + encodeURIComponent(query) + "&format=json",
  };
  request(options, function (err, response, body) {
    var r = JSON.parse(body);
    artists = [];
    if (r.results.bindings && r.results.bindings.length > 0) {
      r.results.bindings.forEach(function (row) {
        artists.push({
          dbpedia_uri: row.dbpedia_uri.value,
          name: row.name.value,
        });
      });
    }
    cb(artists);
  });
};

module.exports.get_categories = function (dbpedia_uri, cb) {
  var query, params;
  params = { URI: dbpedia_uri };
  query = qb.buildQuery("artist_categories", params);
  options = {
    method: "GET",
    uri:
      uris.dbpedia_uri + "?query=" + encodeURIComponent(query) + "&format=json",
  };
  request(options, function (err, response, body) {
    var r = JSON.parse(body);
    if (r.results.bindings && r.results.bindings.length > 0) {
      cb(r.results.bindings);
    } else {
      cb(err);
    }
  });
};

module.exports.get_category_links = function (yago_uri, artist_uri, limit, cb) {
  var query, params;
  params = { YAGO_URI: yago_uri, ARTIST_URI: artist_uri, LIMIT: limit };
  query = qb.buildQuery("wikicat_links", params);
  // console.log(query);
  dps
    .client()
    .query(query)
    .timeout(defaultTimeout)
    .asJson()
    .then(function (r) {
      // console.log(r);
      var category = {};
      var artists = [];
      r.results.bindings.forEach(function (row) {
        artists.push({ dbpedia_uri: row.uri.value, name: row.name.value });
      });
      category.uri = yago_uri;
      category.label = getCategoryLabel(yago_uri);
      category.artists = artists;
      cb(category);
    })
    .catch(function (e) {
      cb(e);
    });
};

module.exports.construct_artist = function (dbpedia_uri, cb) {
  var params = { URI: dbpedia_uri, LANG: "en" };
  var query = qb.buildQuery("construct_artist", params);
  console.log(query);
  options = {
    method: "GET",
    uri:
      uris.dbpedia_uri + "?query=" + encodeURIComponent(query) + "&format=json",
  };
  request(options, function (err, response, r) {
    console.log(err);
    console.log(r);
    artist = { dbpedia_uri: dbpedia_uri };
    if (r.results.bindings.length > 0) {
      var store = n3.Store();
      r.results.bindings.forEach(function (triple) {
        store.addTriple(triple.s.value, triple.p.value, triple.o.value);
      });
      artist["abstract"] = getSingle(dbpedia_uri, "dbpo:abstract", null, store);
      artist["wikipedia_uri"] = getSingle(
        dbpedia_uri,
        "dbpo:about",
        null,
        store,
      );
      artist["categories"] = extractCategories(
        getCollection(dbpedia_uri, "rdf:type", null, store),
      );
      artist["genres"] = getCollection(
        dbpedia_uri,
        "dbpo:genre",
        { "rdfs:label": "label" },
        store,
      );
      artist["associated_artists"] = {
        label: "Associated Artists",
        artists: getCollection(
          dbpedia_uri,
          "dbpo:associatedMusicalArtist",
          { "foaf:name": "name" },
          store,
        ),
      };
    }
    cb(artist);
  }).catch(function (e) {
    cb(e);
  });
};

module.exports.get_all_linked_artists = function (dbpedia_uri, cb) {
  var params = { URI: dbpedia_uri };
  var query = qb.buildQuery("all_linked_artists", params);
  options = {
    method: "GET",
    uri:
      uris.dbpedia_uri + "?query=" + encodeURIComponent(query) + "&format=json",
  };
  request(options, function (err, response, body) {
    var r = JSON.parse(body);
    artists = [];
    if (r.results.bindings && r.results.bindings.length > 0) {
      r.results.bindings.forEach(function (row) {
        artists.push({
          dbpedia_uri: row.uri.value,
          name: row.name.value,
          ranking: row.common.value,
          degree: row.degree.value,
          common_categories: extractCategories(
            row.categories.value.split("; "),
          ),
        });
      });
    }
    cb(artists);
  });
};

module.exports.get_category_degrees = function (dbpedia_uri, cb) {
  var param = { URI: dbpedia_uri };
  var query = qb.buildQuery("category_degrees", param);
  options = {
    method: "GET",
    uri:
      uris.dbpedia_uri + "?query=" + encodeURIComponent(query) + "&format=json",
  };
  request(options, function (err, response, body) {
    var r = JSON.parse(body);
    categories = {};
    if (r.results.bindings && r.results.bindings.length > 0) {
      r.results.bindings.forEach(function (row) {
        categories[row.category.value] = row.degree.value;
      });
    }
    cb(categories);
  });
};

module.exports.get_artist_redirect = function (dbpedia_uri, cb) {
  var param = { URI: dbpedia_uri };
  var query = qb.buildQuery("artist_redirect", param);
  options = {
    method: "GET",
    uri:
      uris.dbpedia_uri + "?query=" + encodeURIComponent(query) + "&format=json",
  };
  request(options, function (err, response, body) {
    var r = JSON.parse(body);
    cb(r.results.bindings);
  });
};
