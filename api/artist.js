var express = require('express');
var b64 = require('base-64');
var db = require('./modules/dbpedia');
var mb = require('./modules/musicbrainz');
var sa = require('./modules/sameas');
var ab = require('./modules/acousticbrainz');
var mp = require('./modules/moodplay');

var module_mls = express.Router();

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
      artist.id = mbid;
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
