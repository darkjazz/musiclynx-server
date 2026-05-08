var express = require("express");
var ab = process.env.USE_POSTGRES === 'true'
  ? require("./acousticbrainz-pg")
  : require("./acousticbrainz");
var mp = process.env.USE_POSTGRES === 'true'
  ? require("./moodplay-pg")
  : require("./moodplay");
// Use PostgreSQL backend instead of SPARQL/DBpedia
var dbp = process.env.USE_POSTGRES === 'true' ? require("./dbpedia-pg") : require("./dbpedia");
var msx = require("./musixmatch");
var fi = require("./filter");
var jsonfile = require("jsonfile");
var uris = require("./uris").uris;

const MAP = {
  rhythm: 0,
  tonality: 1,
  timbre: 2,
};

// Promise wrappers for callback-based modules
function abGetSimilar(mbid) {
  return new Promise((resolve) => {
    ab.get_static_similar_artists(mbid, (result) => resolve(result));
  });
}

function mpGetSimilar(mbid) {
  return new Promise((resolve) => {
    mp.get_static_similar_artists(mbid, (result) => resolve(result));
  });
}

function dbpGetRedirect(uri) {
  return new Promise((resolve) => {
    dbp.get_artist_redirect(uri, (result) => resolve(result));
  });
}

function dbpGetLinked(uri) {
  return new Promise((resolve) => {
    dbp.get_all_linked_artists(uri, (result) => resolve(result));
  });
}

function dbpGetAssociated(uri) {
  return new Promise((resolve) => {
    dbp.get_associated_artists(uri, (result) => resolve(result));
  });
}

function dbpGetDegrees(uri) {
  return new Promise((resolve) => {
    dbp.get_category_degrees(uri, (result) => resolve(result));
  });
}

var addCategoryLinks = function (category, artists) {
  category.artists.forEach(function (artist) {
    a = artists.find((find_artist) => artist.name == find_artist.name);
    if (a) {
      a.ranking = parseInt(a.ranking) + 1;
      a.degree = parseInt(a.degree) + 1;
      if (!(category.label in a.common_categories)) {
        a.common_categories.push(category.label);
      }
    } else {
      artists.push({
        id: artist.id,
        name: artist.name,
        ranking: 1,
        degree: 1,
        common_categories: [{ label: category.label }],
      });
    }
  });
  return artists;
};

var addCategory = function (category, categories) {
  categories[category.label] = {
    degree: category.artists.length,
    artists: category.artists.map((artist) => {
      return {
        name: artist.name,
        id: artist.id,
        dbpedia_uri: artist.dbpedia_uri,
      };
    }),
  };
  return categories;
};

var addAcousticBrainzLinksFromData = function (ab_categories, artists) {
  if (!("status" in ab_categories)) {
    ab_categories.forEach(function (category) {
      artists = addCategoryLinks(category, artists);
    });
  }
  return artists;
};

var addAcousticBrainzCategoriesFromData = function (ab_categories, categories) {
  if (!("status" in ab_categories)) {
    ab_categories.forEach(function (category) {
      categories = addCategory(category, categories);
    });
  }
  return categories;
};

var linkAcousticBrainzArtistsFromData = function (ab_categories, artist, category, artists, graph) {
  var featureKey = category.split(" ").pop().toLowerCase();
  if (!(featureKey in MAP)) return;
  var featureIdx = MAP[featureKey];
  if (!ab_categories[featureIdx]) return;
  ab_categories[featureIdx].artists.forEach(
    (artistB) => {
      if (
        artistB.name != artists[0].name &&
        artists.find((artistA) => artistA.name == artistB.name)
      ) {
        graph["links"].push({
          source: artistB.name,
          target: artist.name,
          value: 1,
        });
      }
    },
  );
};

var addMoodplayLinksFromData = function (mp_category, artists) {
  if (!("status" in mp_category)) {
    artists = addCategoryLinks(mp_category, artists);
  }
  return artists;
};

var addMoodplayCategoriesFromData = function (mp_category, categories) {
  if (!("status" in mp_category))
    categories = addCategory(mp_category, categories);
  return categories;
};

var linkMoodplayArtistsFromData = function (mp_category, artist, artists, graph) {
  if ("status" in mp_category) return;
  mp_category.artists.slice(0, 6).forEach((artistB) => {
    if (
      artistB.name != artists[0].name &&
      artists.find((artistA) => artistA.name == artistB.name)
    ) {
      graph["links"].push({
        source: artistB.name,
        target: artist.name,
        value: 1,
      });
    }
  });
};

var storeArtistGraph = function (mbid, graph) {
  var filepath = uris.static_db_dir + "/" + uris.graph_static_db + ".json";
  jsonfile.readFile(filepath, (readErr, data) => {
    if (readErr && readErr.code !== "ENOENT") {
      console.error("Error reading graph store:", readErr);
      return;
    }

    const store = data || {};
    store[mbid] = graph;

    jsonfile.writeFile(filepath, store, { spaces: 2 }, (writeErr) => {
      if (writeErr) {
        console.error("Error writing graph store:", writeErr);
      } else {
        console.log(`Graph for ${mbid} saved.`);
      }
    });
  });
};

var getLocalArtistGraph = function (mbid, cb) {
  var filepath = uris.static_db_dir + "/" + uris.graph_static_db + ".json";
  jsonfile.readFile(filepath, (readErr, data) => {
    if (readErr && readErr.code !== "ENOENT") {
      console.error("Error reading graph store:", readErr);
      cb(undefined);
      return;
    }

    const store = data || {};
    cb(store[mbid] || undefined);
  });
};

var collectCategories = function (artists, category_degrees) {
  var categories = {};
  artists.forEach((artist) => {
    artist.common_categories.forEach(function (category) {
      if (!(category.label in categories)) {
        categories[category.label] = {
          degree: category_degrees[category.uri],
          artists: [artist],
        };
      } else {
        categories[category.label].artists.push(artist);
      }
    });
  });
  return categories;
};

var groupArtists = function (artists, categories, graph) {
  var grouped_artists = {};
  var graph = { nodes: [], links: [] };
  Object.keys(categories)
    .sort((a, b) => categories[a].degree - categories[b].degree)
    .forEach((category) => {
      categories[category].artists.forEach((artist) => {
        if (!(artist.name in grouped_artists)) {
          var ranking;
          grouped_artists[artist.name] = category;
          if (artist.ranking) ranking = artist.ranking;
          else ranking = 1;
          graph["nodes"].push({
            name: artist.name,
            group: category,
            ranking: ranking,
            uri: artist.dbpedia_uri,
            id: artist.id,
          });
        }
      });
    });
  return graph;
};

function isValidUUID(uuid) {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

module.exports.remove_from_cache = function (mbid, cb) {
  var filepath = uris.static_db_dir + "/" + uris.graph_static_db + ".json";

  jsonfile.readFile(filepath, (readErr, data) => {
    if (readErr && readErr.code !== "ENOENT") {
      console.error("Error reading graph store:", readErr);
      if (cb) cb(readErr);
      return;
    }

    const store = data || {};
    delete store[mbid];

    jsonfile.writeFile(filepath, store, { spaces: 2 }, (writeErr) => {
      if (writeErr) {
        console.error("Error writing graph store:", writeErr);
        if (cb) cb(writeErr);
      } else {
        console.log(`Graph for ${mbid} removed from cache.`);
        if (cb) cb(mbid);
      }
    });
  });
};

module.exports.get_artists = function (
  dbpedia_uri,
  name,
  id,
  limit,
  filter,
  degree,
  lambda,
  cb,
) {
  dbp.get_all_linked_artists(dbpedia_uri, (artists) => {
    dbp.get_category_degrees(dbpedia_uri, (category_degrees) => {
      if (artists.length > 0) {
        artists = fi.apply_filter(
          filter,
          artists,
          category_degrees,
          degree,
          lambda,
          limit,
        );
        cb(
          artists.map((artist) => {
            delete artist["common_categories"];
            return artist;
          }),
        );
      } else {
        cb({ error: "no linked artists found" });
      }
    });
  });
};

module.exports.get_artist_graph = function (
  dbpedia_uri,
  name,
  id,
  limit,
  filter,
  degree,
  cb,
) {
  // Skip cache when using PostgreSQL backend (it's fast enough)
  const useCache = process.env.USE_POSTGRES !== 'true';

  if (useCache) {
    getLocalArtistGraph(id, function (local_graph) {
      if (local_graph) {
        console.log(`Found local graph for ${id}`);
        cb(local_graph);
        return;
      }
      generateGraph();
    });
  } else {
    generateGraph();
  }

  async function generateGraph() {
    try {
      var redirect = await dbpGetRedirect(dbpedia_uri);
      if (redirect.length > 0) {
        dbpedia_uri = redirect[0]["dbpedia_uri"]["value"];
      }

      var [artists, associated_artists, category_degrees] = await Promise.all([
        dbpGetLinked(dbpedia_uri),
        dbpGetAssociated(dbpedia_uri),
        dbpGetDegrees(dbpedia_uri),
      ]);

      var categories;
      if (artists.length > 0) {
        artists = fi.apply_filter(
          filter,
          artists,
          category_degrees,
          degree,
          1.0,
          limit,
        );
        categories = collectCategories(artists, category_degrees);
      } else {
        artists = [];
        categories = {};
      }

      if (associated_artists.length > 0) {
        var associated_artist_category = {
          label: "Associated Artists",
          artists: associated_artists,
        };
        artists = addCategoryLinks(associated_artist_category, artists);
        categories = addCategory(associated_artist_category, categories);
      }

      // Fetch AB and moodplay data once each, use for both links and categories
      var [abData, mpData] = await Promise.all([
        abGetSimilar(id),
        mpGetSimilar(id),
      ]);

      artists = addAcousticBrainzLinksFromData(abData, artists);
      categories = addAcousticBrainzCategoriesFromData(abData, categories);
      artists = addMoodplayLinksFromData(mpData, artists);
      categories = addMoodplayCategoriesFromData(mpData, categories);

      if (artists.length > 0) {
        graph = groupArtists(artists, categories);

        // Collect async link operations for AB/moodplay cross-linking
        var linkPromises = [];

        Object.keys(categories).forEach(function (category) {
          if (category !== "undefined") {
            var catArtists = categories[category].artists.slice(1);
            categories[category].artists.map(function (artist) {
              if (catArtists.length > 0) {
                graph["links"].push({
                  source: artist.name,
                  target: catArtists[0].name,
                  value: 1,
                });
                if (category.indexOf("AcousticBrainz") >= 0) {
                  // Fetch per-artist AB data for cross-linking
                  linkPromises.push(
                    abGetSimilar(artist.id).then((artistAbData) => {
                      linkAcousticBrainzArtistsFromData(
                        artistAbData, artist, category, catArtists, graph
                      );
                    })
                  );
                }
                if (category.indexOf("Moodplay") >= 0) {
                  linkPromises.push(
                    mpGetSimilar(artist.id).then((artistMpData) => {
                      linkMoodplayArtistsFromData(
                        artistMpData, artist, catArtists, graph
                      );
                    })
                  );
                }
                catArtists = catArtists.slice(1);
              }
            });
          }
        });

        await Promise.all(linkPromises);

        // Only store to cache if not using PostgreSQL
        if (useCache && isValidUUID(id)) {
          storeArtistGraph(id, graph);
        }
        cb(graph);
      } else {
        cb({ error: "no linked artists found" });
      }
    } catch (err) {
      console.error('Error generating graph:', err);
      cb({ error: "graph generation failed" });
    }
  }
};
