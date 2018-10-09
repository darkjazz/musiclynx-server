var express = require('express');
var mp = require('./modules/moodplay');
var module_mp = express.Router();

module_mp.get('/get_similar_artists/:name/:limit', function(req, res) {
  var name = decodeURIComponent(req.params.name);
  mp.get_similar_artists(name, req.params.limit, function(artists) {
    res.send(artists);
  })
});

module_mp.get('/get_nearest_track/:valence/:arousal', function(req, res) {
  mp.get_nearest_track(req.params.valence, req.params.arousal, function(track) {
    res.send(track);
  })
});

module.exports = module_mp;
