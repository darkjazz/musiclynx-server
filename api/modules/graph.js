var express = require('express');
var ab = require('./acousticbrainz');
var mp = require('./moodplay');
var dbp = require('./dbpedia');

var addAcousticBrainzLinks = function(mbid, artists) {
  var ab_categories;
  ab.get_static_similar_artists(mbid, c => ab_categories = c);
  if (!("status" in ab_categories)) {
    ab_categories.forEach(function(category) {
      category.artists.forEach(function(ab_artist) {
        a = artists.find(artist => artist.name==ab_artist.name);
        if (a) {
          a.ranking = parseInt(a.ranking) + 1;
          a.degree = parseInt(a.degree) + 1;
          if (!(category.label in a.common_categories)) {
            a.common_categories.push(category.label);
          }
        }
        else {
          artists.push({ id: ab_artist.id, name: ab_artist.name, ranking: 1, degree: 1,
            common_categories: [ { label: category.label } ]
          })
        }
      })
    })
  }
  return artists;
}

var addAcousticBrainzCategories = function(mbid, categories) {
  var ab_categories;
  ab.get_static_similar_artists(mbid, c => ab_categories = c);
  if (!("status" in ab_categories)) {
    ab_categories.forEach(function(category) {
      categories[category.label] = category.artists.map(artist => artist.name);
      category.artists.forEach(artistA => {
        var ab_artists;
        ab.get_static_similar_artists(artist.id, a => ab_artists = a);

      });
    });
  }
  return categories;
}

var addMoodplayLinks = function(mbid, artists) {
  var mp_category;
  mp.get_static_similar_artists(mbid, c => mp_category = c);
  if (!("status" in mp_category)) {
    mp_category.artists.forEach(mp_artist => {
      a = artists.find(artist => artist.name==mp_artist.name);
      if (a) {
        a.ranking = parseInt(a.ranking) + 1;
        a.degree = parseInt(a.degree) + 1;
        if (!(mp_category.label in a.common_categories)) {
          a.common_categories.push(mp_category.label);
        }
      }
      else {
        artists.push({ id: mp_artist.id, name: mp_artist.name, ranking: 1, degree: 1,
          common_categories: [ { label: mp_category.label } ]
        })
      }
    })
  }
  return artists;
}

var addMoodplayCategories = function(mbid, categories) {
  var mp_category;
  mp.get_static_similar_artists(mbid, c => mp_category = c);
  if (!("status" in mp_category))
      categories[mp_category.label] = mp_category.artists.map(artist => artist.name);
  return categories;
}

var collectCategories = function(artists) {
  var categories = {};
  artists.forEach(artist => {
    artist.common_categories.forEach(function(category) {
      if (!(category.label in categories)) {
        categories[category.label] = [ artist.name ];
      }
      else {
        categories[category.label].push( artist.name );
      }
    });
  });
  return categories;
}

var deriveGroups = function(artists, categories) {

}

module.exports.get_artist_graph = function(dbpedia_uri, name, id, limit, filter, degree, cb) {
  dbp.get_all_linked_artists(dbpedia_uri, (artists) => {
    if (artists.length > 0) {
      switch (filter) {
        case "0":
          break;
        case "1":
          artists = fi.jaccard(artists, degree);
          break;
        case "2":
          artists = fi.collaborative(artists, degree);
          break;
        case "3":
          artists = fi.sorensen(artists, degree);
          break;
        case "4":
          artists = fi.max_degree(artists, degree);
      }
      artists = artists.slice(0, limit);
      categories = collectCategories(artists);
      // artists = addAcousticBrainzLinks(id, artists);
      // categories = addAcousticBrainzCategories(id, categories);
      // artists = addMoodplayLinks(id, artists);
      // categories = addMoodplayCategories(id, categories);
      var graph = { "nodes": [], "links": [] };
      artists.forEach(function(artist) {
        graph["nodes"].push({ "id": artist.name, "group": parseInt(artist.ranking) });
      });
      Object.keys(categories).forEach(function(category) {
        var names = categories[category].slice(1);
        categories[category].map(function(name) {
          if (names.length > 0) {
            graph["links"].push({ "source": name, "target": names[0], "value": 1 });
            names = names.slice(1);
          }
        });
      });
      cb(graph);
    }
    else {
      cb({"error": "no linked artists found"});
    }
  });
}
