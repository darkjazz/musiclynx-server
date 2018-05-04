var express = require('express');
var ab = require('./acousticbrainz');
var mp = require('./moodplay');
var dbp = require('./dbpedia');
var fi = require('./filter');

const MAP = {
  'rhythm': 0,
  'tonality': 1,
  'timbre': 2
}

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
      categories[category.label] = { degree: category.artists.length, artists: category.artists.map(artist => { return { name: artist.name, id: artist.id } }) };
    });
  }
  return categories;
}

var linkAcousticBrainzArtists = function(artist, category, artists, graph) {
  var ab_categories;
  ab.get_static_similar_artists(artist.id, c => ab_categories = c);
  ab_categories[MAP[category.split(" ").pop().toLowerCase()]].artists.forEach(artistB => {
    if (artistB.name != artists[0].name && artists.find(artistA => artistA.name==artistB.name)) {
      graph["links"].push({ "source": artistB.name, "target": artist.name, "value": 1 });
    }
  });
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
      categories[mp_category.label] = { degree: mp_category.artists.length, artists: mp_category.artists.map(artist => { return {name: artist.name, id: artist.id } } ) };
  return categories;
}

var linkMoodplayArtists = function(artist, artists, graph) {
  var mp_category;
  mp.get_static_similar_artists(artist.id, c => mp_category = c);
  mp_category.artists.slice(0, 6).forEach(artistB => {
    if (artistB.name != artists[0].name && artists.find(artistA => artistA.name==artistB.name)) {
      graph["links"].push({ "source": artistB.name, "target": artist.name, "value": 1 });
    }
  })
}

var collectCategories = function(artists, category_degrees) {
  var categories = {};
  artists.forEach(artist => {
    artist.common_categories.forEach(function(category) {
      if (!(category.label in categories)) {
        categories[category.label] = {
          degree: category_degrees[category.uri],
          artists: [ artist ]
        };
      }
      else {
        categories[category.label].artists.push( artist );
      }
    });
  });
  return categories;
}

var groupArtists = function(artists, categories, graph) {
  var grouped_artists = {};
  var graph = { "nodes": [], "links": [] };
  Object.keys(categories).sort((a, b) => categories[a].degree - categories[b].degree).forEach(category => {
    categories[category].artists.forEach(artist => {
      if (!(artist.name in grouped_artists)) {
        var ranking;
        grouped_artists[artist.name] = category;
        if (artist.ranking) ranking = artist.ranking
        else ranking = 1;
        graph["nodes"].push({ "name": artist.name, "group": category, "ranking": ranking, "uri": artist.dbpedia_uri, "id": artist.id });
      }
    });
  });
  return graph;
}

module.exports.get_artists = function(dbpedia_uri, name, id, limit, filter, degree, lambda, cb) {
  dbp.get_all_linked_artists(dbpedia_uri, artists => {
    dbp.get_category_degrees(dbpedia_uri, category_degrees => {
      if (artists.length > 0) {
        artists = fi.apply_filter(filter, artists, category_degrees, degree, lambda, limit);
        cb(artists.map(artist => { delete artist["common_categories"]; return artist }))
      }
      else {
        cb({"error": "no linked artists found"});
      }
    })
  })
}

module.exports.get_artist_graph = function(dbpedia_uri, name, id, limit, filter, degree, cb) {
  dbp.get_artist_redirect(dbpedia_uri, redirect => {
    if (redirect.length > 0) {
      dbpedia_uri = redirect[0]["dbpedia_uri"]["value"];
    }
    dbp.get_all_linked_artists(dbpedia_uri, artists => {
      dbp.get_category_degrees(dbpedia_uri, category_degrees => {
        if (artists.length > 0) {
          artists = fi.apply_filter(filter, artists, category_degrees, degree, 1.0, limit);
          categories = collectCategories(artists, category_degrees);
        }
        else {
          artists = [];
          categories = {};
        }
        artists = addAcousticBrainzLinks(id, artists);
        categories = addAcousticBrainzCategories(id, categories);
        artists = addMoodplayLinks(id, artists);
        categories = addMoodplayCategories(id, categories);
        if (artists.length > 0) {
          graph = groupArtists(artists, categories);
          Object.keys(categories).forEach(function(category) {
            if (category !== 'undefined') {
              var artists = categories[category].artists.slice(1);
              categories[category].artists.map(function(artist) {
                if (artists.length > 0) {
                  graph["links"].push({ "source": artist.name, "target": artists[0].name, "value": 1 });
                  if (category.indexOf("AcousticBrainz") >= 0) {
                    linkAcousticBrainzArtists(artist, category, artists, graph);
                  }
                  if (category.indexOf("Moodplay") >= 0) {
                    linkMoodplayArtists(artist, artists, graph);
                  }
                  artists = artists.slice(1);
                }
              });
            }
            });
            cb(graph);
        }
        else {
          cb({"error": "no linked artists found"});
        }
      });
    });
  })
}
