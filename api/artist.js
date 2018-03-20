  var express = require('express');
var b64 = require('base-64');
var db = require('./modules/dbpedia');
var mb = require('./modules/musicbrainz');
var sa = require('./modules/sameas');
var lx = require('./modules/musiclynx');
var ab = require('./modules/acousticbrainz');
var mp = require('./modules/moodplay');
var gr = require('./modules/graph');

var module_mls = express.Router();

var featured = [
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
  { id: "2013f3af-51a3-404d-9afc-91b3f277ea4e", name: "Oumou Sangaré" }
];

/*
Module: Artist
*/

var artistIsFeatured = function(id) {
  var isFeatured = false;
  featured.forEach(function(artist) {
    if (artist.id == id) isFeatured = true;
  })
  return isFeatured;
}

/*
Get Featured Artists: <span>/get_featured_artists</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_featured_artists
*/
module_mls.get('/get_featured_artists', function(req, res) {
  res.send(featured);
});

/*
Get Artist By MusicBrainz ID: <span>/get_mb_artist/:mbid/:name</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_mb_artist/1dcc8968-f2cd-441c-beda-6270f70f2863/Hole
*/
module_mls.get('/get_mb_artist/:mbid/:name', function(req, res) {
  var mbid = req.params.mbid;
  var name = req.params.name;
  lx.find_dbpedia_link(mbid, name, function(dbp_uri) {
    db.construct_artist(dbp_uri, function(artist) {
      artist.id = mbid;
      artist.name = decodeURIComponent(name);
      artist.dbpedia_uri = dbp_uri;
      if (artistIsFeatured(artist.id))
        artist.image = './assets/featured/' + artist.id + '.jpg';
      res.send(artist);
    })
  });
});

/*
Get Artist By Dbpedia URI (base-64 encoded): <span>/get_mb_artist/:dbpedia_uri/:name</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_dbp_artist/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL1BpeGllcw==/Pixies
*/
module_mls.get('/get_dbp_artist/:dbpedia_uri/:name', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  var name = req.params.name;
  lx.find_musicbrainz_id(dbp_uri, name, function(mbid) {
    db.construct_artist(dbp_uri, function(artist) {
      artist.id = mbid.id;
      artist.name = decodeURIComponent(name);
      artist.dbpedia_uri = dbp_uri;
      if (artistIsFeatured(artist.id))
        artist.image = './assets/featured/' + artist.id + '.jpg';
      res.send(artist);
    });
  })
});

/*
Get AcousticBrainz Similar Artists By Rhythm, Tonality and Timbre: <span>/get_acousticbrainz_artists/:mbid</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_acousticbrainz_artists/410c9baf-5469-44f6-9852-826524b80c61
*/
module_mls.get('/get_acousticbrainz_artists/:mbid', function(req, res) {
  var mbid = req.params.mbid;
  ab.get_static_similar_artists(mbid, function(data) {
    res.send(data);
  })
});

/*
Get Moodplay Similar Artists: <span>/get_moodplay_artists/:mbid</span>
Example: http://musiclynx-api.herokuapp.com/artist/get_moodplay_artists/702d2b90-eef0-4354-b2c4-6366eba92b7f
*/
module_mls.get('/get_moodplay_artists/:mbid', function(req, res) {
  var mbid = req.params.mbid;
  mp.get_static_similar_artists(mbid, function(data) {
    res.send(data);
  })
});

module_mls.get('/get_artists/:dbpedia_uri/:name/:id/:limit/:filter/:degree/:lambda', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  var name = req.params.name;
  var id = req.params.id;
  var limit = parseInt(req.params.limit);
  var filter = parseInt(req.params.filter);
  var degree = parseInt(req.params.degree);
  var lambda = parseInt(req.params.lambda);
  gr.get_artists(dbp_uri, name, id, limit, filter, degree, lambda, artists => {
    res.send(artists);
  })
});


/*
Get Similar Artist Graph: <span>/get_artist_graph/:dbpedia_uri/:name/:id/:limit/:filter/:degree</span>
where :dbpedia_uri is the base-64 encoded Dbpedia URI, :id is MusicBrainz ID,
:limit is maximum number of artists in the graph, :filter is one of jaccard (1), collaborative (2),
sorensen (3), maximum degree weighted (default, 4), heat spreading (5),
and :degree is number of categories to which the artist belongs
Example: http://musiclynx-api.herokuapp.com/artist/get_artist_graph/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL1BpeGllcw==/Pixies/b6b2bb8d-54a9-491f-9607-7b546023b433/47/4/9
*/
module_mls.get('/get_artist_graph/:dbpedia_uri/:name/:id/:limit/:filter/:degree', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  var name = req.params.name;
  var id = req.params.id;
  var limit = parseInt(req.params.limit);
  var filter = parseInt(req.params.filter);
  var degree = parseInt(req.params.degree);
  gr.get_artist_graph(dbp_uri, name, id, limit, filter, degree, graph => {
    res.send(graph);
  })
});

module.exports = module_mls;
