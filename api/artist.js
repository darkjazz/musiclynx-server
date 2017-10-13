var express = require('express');
var b64 = require('base-64');
var db = require('./modules/dbpedia');
var mb = require('./modules/musicbrainz');
var sa = require('./modules/sameas');
var ab = require('./modules/acousticbrainz');
var mp = require('./modules/moodplay');

var module_mls = express.Router();

var featured = [
  { id: "2ff63f00-0954-4b14-9007-e19b822fc8b2", name: "Ellen Allien" },
  { id: "97b20fe3-0924-4a5f-9955-d0b5c5f9587f", name: "Santigold" },
  { id: "1dcc8968-f2cd-441c-beda-6270f70f2863", name: "Hole" },
  { id: "6514cffa-fbe0-4965-ad88-e998ead8a82a", name: "Fela Kuti" },
  { id: "e795e03d-b5d5-4a5f-834d-162cfb308a2c", name: "PJ Harvey" },
  { id: "ae0b2424-d4c5-4c54-82ac-fe3be5453270", name: "Arvo Pärt" },
  { id: "b6b2bb8d-54a9-491f-9607-7b546023b433", name: "Pixies" },
  { id: "ca405011-906d-4090-992f-f230739278b1", name: "Dum Dum Girls" },
  { id: "f6f2326f-6b25-4170-b89d-e235b25508e8", name: "Sigur Ros" },
  { id: "52d9bff7-1776-46ae-8e1b-7a76afc73358", name: "Pan Sonic" },
  { id: "11714cac-2329-4983-9627-c83b0d5475b4", name: "Giacinto Scelsi" },
  { id: "6f5064bb-7dbb-4a44-bac5-04c467394817", name: "Fatoumata Diawara" },
  { id: "96003ca6-5c03-4771-8b94-dbdc74949125", name: "Angel Haze" }
];

module_mls.get('/get_featured_artists', function(req, res) {
  res.send(featured);
});

module_mls.get('/get_mb_artist/:mbid/:name', function(req, res) {
  var mbid = req.params.mbid;
  var name = req.params.name;
  sa.find_dbpedia_link(mbid, name, function(dbp_uri) {
    db.construct_artist(dbp_uri, function(artist) {
      artist.id = mbid;
      artist.name = decodeURIComponent(name);
      artist.dbpedia_uri = dbp_uri;
      res.send(artist);
    })
  });
});

module_mls.get('/get_dbp_artist/:dbpedia_uri/:name', function(req, res) {
  var dbp_uri = b64.decode(req.params.dbpedia_uri);
  var name = req.params.name;
  sa.find_musicbrainz_id(dbp_uri, name, function(mbid) {
    db.construct_artist(dbp_uri, function(artist) {
      artist.id = mbid.id;
      artist.name = decodeURIComponent(name);
      artist.dbpedia_uri = dbp_uri;
      res.send(artist);
    });
  })
});

module_mls.get('/get_acousticbrainz_artists/:mbid', function(req, res) {
  var mbid = req.params.mbid;
  ab.get_static_similar_artists(mbid, function(data) {
    res.send(data);
  })
});

module_mls.get('/get_moodplay_artists/:mbid', function(req, res) {
  var mbid = req.params.mbid;
  mp.get_static_similar_artists(mbid, function(data) {
    res.send(data);
  })
});

module.exports = module_mls;
