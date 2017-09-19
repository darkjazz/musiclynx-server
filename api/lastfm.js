var express = require('express');
var lfm = require('./modules/lastfm');
var module_lfm = express.Router();

module_lfm.get('/get_similar_artists/:mbid/:name', function(req, res) {
  lfm.get_similar_artists(req.params.mbid, req.params.name, function(artists) {
    res.send(artists);
  })
});

module_lfm.get('/get_top_tags/:mbid/:name', function(req, res) {
  lfm.get_top_tags(req.params.mbid, req.params.name, function(tags) {
    res.send(tags);
  })
});

module_lfm.get('/get_top_track_tags/:mbid/:name/:artist', function(req, res) {
  lfm.get_top_track_tags(req.params.mbid, req.params.name, req.params.artist, function(tags) {
    res.send(tags);
  })
});

module_lfm.get('/get_track_info/:name/:artist', function(req, res) {
  lfm.get_track_info(req.params.name, req.params.artist, function(tags) {
    res.send(tags);
  })
});

module.exports = module_lfm;
