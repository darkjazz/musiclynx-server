var express = require('express');
var mp = require('./modules/moodplay');
var module_mp = express.Router();

module_mp.get('/get_similar_artists/:name/:limit', function(req, res) {
  var name = decodeURIComponent(req.params.name);
  mp.get_similar_artists(name, req.params.limit, function(artists) {
    res.send(artists);
  })
});

module.exports = module_mp;
