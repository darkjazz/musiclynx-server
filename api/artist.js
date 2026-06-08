var express = require("express");
var b64 = require("base-64");
var db = process.env.USE_POSTGRES === 'true'
  ? require("./modules/dbpedia-pg")
  : require("./modules/dbpedia");
var mb = require("./modules/musicbrainz");
var sa = require("./modules/sameas");
var lx = process.env.USE_POSTGRES === 'true'
  ? require("./modules/musiclynx-pg")
  : require("./modules/musiclynx");
var ab = process.env.USE_POSTGRES === 'true'
  ? require("./modules/acousticbrainz-pg")
  : require("./modules/acousticbrainz");
var mp = process.env.USE_POSTGRES === 'true'
  ? require("./modules/moodplay-pg")
  : require("./modules/moodplay");
var gr = require("./modules/graph");

var module_mls = express.Router();

var featured = [
  { id: "6ac275dd-eb37-42cf-9a60-6b147320c7be", name: "KNEECAP" },
  { id: "b49ec275-ac01-4807-a612-267651cc5716", name: "kurivari" },
  // { id: "d1bc5be1-f552-4e2e-95ae-da8d6a4d3c17", name: "Bob Vylan" },
  { id: "b8e3d1ae-5983-4af1-b226-aa009b294111", name: "TR/ST" },
  { id: "ba0257f5-ceb9-4962-8759-4160f3e3e469", name: "Spring Heel Jack" },
  {
    id: "99fe4613-84ec-4f48-bb4f-f036880ed2ac",
    name: "A Place to Bury Strangers",
  },
  { id: "5d39821b-83ad-4c9a-bbaa-2ae32ab0f7b8", name: "Dillinja" },
  { id: "e8d1f02e-7e77-4415-85b6-dc17e08debbf", name: "Murcof" },
  { id: "4b93ee9e-e39d-4036-9527-551b2236f5af", name: "Princess Nokia" },
  // { id: "6983949c-bea5-4231-b7e7-09c4b1ead6fc", name: "KOKOKO!" },
  { id: "2b82372f-8c85-4b47-a9fc-36fe4d4df5b4", name: "The Comet Is Coming" },
  { id: "fddb7d67-7977-4ab5-884c-f5644c78b700", name: "Kultur Shock" },
  { id: "ba54a312-7e90-4751-8284-4f32ea54a4fe", name: "Senyawa" },
  { id: "470320f0-ac2c-43bb-98f6-b03d063e9cac", name: "B-Complex" },
  { id: "91838da6-e1cc-46ff-b235-2a2b83814608", name: "Brenda Fassie" },
  { id: "eb9ad275-dc6b-4d00-9dea-e60b02313a72", name: "Protoje" },
  // { id: "72d65d46-ab84-443c-bed2-b820e11ef142", name: "Mbongwana Star" },
  { id: "2ff63f00-0954-4b14-9007-e19b822fc8b2", name: "Ellen Allien" },
  { id: "97b20fe3-0924-4a5f-9955-d0b5c5f9587f", name: "Santigold" },
  { id: "1dcc8968-f2cd-441c-beda-6270f70f2863", name: "Hole" },
  { id: "6514cffa-fbe0-4965-ad88-e998ead8a82a", name: "Fela Kuti" },
  { id: "e795e03d-b5d5-4a5f-834d-162cfb308a2c", name: "PJ Harvey" },
  { id: "ae0b2424-d4c5-4c54-82ac-fe3be5453270", name: "Arvo Pärt" },
  { id: "b6b2bb8d-54a9-491f-9607-7b546023b433", name: "Pixies" },
  { id: "f6f2326f-6b25-4170-b89d-e235b25508e8", name: "Sigur Ros" },
  { id: "52d9bff7-1776-46ae-8e1b-7a76afc73358", name: "Pan Sonic" },
  { id: "96003ca6-5c03-4771-8b94-dbdc74949125", name: "Angel Haze" },
  { id: "410c9baf-5469-44f6-9852-826524b80c61", name: "Autechre" },
  { id: "ca405011-906d-4090-992f-f230739278b1", name: "Dum Dum Girls" },
  { id: "11714cac-2329-4983-9627-c83b0d5475b4", name: "Giacinto Scelsi" },
  { id: "6f5064bb-7dbb-4a44-bac5-04c467394817", name: "Fatoumata Diawara" },
  { id: "07b6020a-c539-4d68-aeef-f159f3befc76", name: "Band of Horses" },
  { id: "62c31c9d-d2d9-4b2a-9549-4be129e9559a", name: "Pauline Oliveros" },
  { id: "2674597f-6c40-47cc-b980-67f94725f7a7", name: "Najwa Karam" },
  { id: "2841d983-f8c3-432a-af02-7407a84580a8", name: "Merzbow" },
  { id: "2013f3af-51a3-404d-9afc-91b3f277ea4e", name: "Oumou Sangaré" },
  { id: "45738c82-0e54-46ec-91b0-4a7b34506644", name: "Public Memory" },
  { id: "29b03124-87df-4ee1-8d81-d46381522ec4", name: "SHXCXCHCXSH" },
];

/*
Module: Artist
*/

var artistIsFeatured = function (id) {
  var isFeatured = false;
  featured.forEach(function (artist) {
    if (artist.id == id) isFeatured = true;
  });
  return isFeatured;
};

/*
Get Featured Artists: <span>/get_featured_artists</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_featured_artists
*/
module_mls.get("/get_featured_artists", function (req, res) {
  res.send(featured);
});

/*
Get Artist By MusicBrainz ID: <span>/get_mb_artist/:mbid/:name</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_mb_artist/1dcc8968-f2cd-441c-beda-6270f70f2863/Hole
*/
module_mls.get("/get_mb_artist/:mbid/:name/:user_guid?", function (req, res) {
  var mbid = req.params.mbid;
  var name = req.params.name;
  lx.find_dbpedia_link(mbid, function (dbp_uri) {
    if (typeof dbp_uri === "object" && "error" in dbp_uri) {
      // No DBpedia link — use synthetic URI so get_artist_graph URL stays valid
      // graph.js handles empty DBpedia results and still builds from AB data
      var artist = {
        id: mbid,
        name: decodeURIComponent(name),
        dbpedia_uri: `http://musicbrainz.org/artist/${mbid}`,
        abstract: "",
        categories: [],
        associated_artists: [],
      };
      return db.get_artist_community(mbid, function (community) {
        if (community) {
          artist.community = {
            id: community.id,
            name: community.name,
            content_type: community.content_type,
            source: community.source,
            confidence: community.confidence,
          };
          artist.genres = community.genres;
        }
        res.send(artist);
      });
    }
    db.get_artist_abstract(dbp_uri, mbid, name, function (artist) {
      artist.name = decodeURIComponent(name);
      db.get_categories(dbp_uri, function (categories) {
        artist["categories"] = categories;
        db.get_associated_artists(dbp_uri, function (associated_artists) {
          artist["associated_artists"] = associated_artists;
          db.get_artist_community(artist.id, function (community) {
            if (community) {
              artist["community"] = {
                id: community.id,
                name: community.name,
                content_type: community.content_type,
                source: community.source,
                confidence: community.confidence,
              };
              artist["genres"] = community.genres;
            }
            if (artistIsFeatured(artist.id))
              artist.image = "./assets/featured/" + artist.id + ".jpg";
            res.send(artist);
          });
        });
      });
    });
  });
});

/*
Get Artist By Dbpedia URI (base-64 encoded): <span>/get_mb_artist/:dbpedia_uri/:name</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_dbp_artist/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL1BpeGllcw==/Pixies
*/
module_mls.get("/get_dbp_artist/:dbpedia_uri/:name/:user_guid?", function (req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, "base64");
  var dbp_uri = b.toString();
  var name = req.params.name;
  lx.find_musicbrainz_id(dbp_uri, function (mbid) {
    if (typeof mbid === "object" && "error" in mbid) {
      return res.send({
        id: "",
        name: decodeURIComponent(name),
        dbpedia_uri: dbp_uri,
        abstract: "",
        categories: [],
        associated_artists: [],
      });
    }
    db.get_artist_abstract(dbp_uri, mbid, name, function (artist) {
      artist.name = decodeURIComponent(name);
      db.get_categories(dbp_uri, function (categories) {
        artist["categories"] = categories;
        db.get_associated_artists(dbp_uri, function (associated_artists) {
          artist["associated_artists"] = associated_artists;
          db.get_artist_community(artist.id, function (community) {
            if (community) {
              artist["community"] = {
                id: community.id,
                name: community.name,
                content_type: community.content_type,
                source: community.source,
                confidence: community.confidence,
              };
              artist["genres"] = community.genres;
            }
            if (artistIsFeatured(artist.id))
              artist.image = "./assets/featured/" + artist.id + ".jpg";
            res.send(artist);
          });
        });
      });
    });
  });
});

/*
Get AcousticBrainz Similar Artists By Rhythm, Tonality and Timbre: <span>/get_acousticbrainz_artists/:mbid</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_acousticbrainz_artists/410c9baf-5469-44f6-9852-826524b80c61
*/
module_mls.get("/get_acousticbrainz_artists/:mbid", function (req, res) {
  var mbid = req.params.mbid;
  ab.get_static_similar_artists(mbid, function (data) {
    res.send(data);
  });
});

/*
Get Moodplay Similar Artists: <span>/get_moodplay_artists/:mbid</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_moodplay_artists/702d2b90-eef0-4354-b2c4-6366eba92b7f
*/
module_mls.get("/get_moodplay_artists/:mbid", function (req, res) {
  var mbid = req.params.mbid;
  mp.get_static_similar_artists(mbid, function (data) {
    res.send(data);
  });
});

module_mls.get(
  "/get_artists/:dbpedia_uri/:name/:id/:limit/:filter/:degree/:lambda",
  function (req, res) {
    var b = Buffer.from(req.params.dbpedia_uri, "base64");
    var dbp_uri = b.toString();
    var name = req.params.name;
    var id = req.params.id;
    var limit = parseInt(req.params.limit);
    var filter = parseInt(req.params.filter);
    var degree = parseInt(req.params.degree);
    var lambda = parseInt(req.params.lambda);
    gr.get_artists(
      dbp_uri,
      name,
      id,
      limit,
      filter,
      degree,
      lambda,
      (artists) => {
        res.send(artists);
      },
    );
  },
);

/*
Get Similar Artist Graph: <span>/get_artist_graph/:dbpedia_uri/:name/:id/:limit/:filter/:degree</span>
where :dbpedia_uri is the base-64 encoded Dbpedia URI, :id is MusicBrainz ID,
:limit is maximum number of artists in the graph, :filter is one of jaccard (1), collaborative (2),
sorensen (3), maximum degree weighted (default, 4), heat spreading (5),
and :degree is number of categories to which the artist belongs
Example: http://musiclynx-api.herokuapp.com/artist/get_artist_graph/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL1BpeGllcw==/Pixies/b6b2bb8d-54a9-491f-9607-7b546023b433/47/4/9
*/
module_mls.get(
  "/get_artist_graph/:dbpedia_uri/:name/:id/:limit/:filter/:degree",
  function (req, res) {
    var b = Buffer.from(req.params.dbpedia_uri, "base64");
    var dbp_uri = b.toString();
    var name = req.params.name;
    var id = req.params.id;
    var limit = parseInt(req.params.limit);
    var filter = parseInt(req.params.filter);
    var degree = parseInt(req.params.degree);
    gr.get_artist_graph(dbp_uri, name, id, limit, filter, degree, (graph) => {
      res.send(graph);
    });
  },
);

module_mls.get("/log_category/:category/:guid", function (req, res) {
  res.send({ status: "ok" });
});

module_mls.get("/remove_from_cache/:mbid", function (req, res) {
  var id = req.params.mbid;
  gr.remove_from_cache(id, (re) => {
    res.send(re);
  });
});

module.exports = module_mls;
