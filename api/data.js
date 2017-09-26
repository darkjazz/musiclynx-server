var express = require('express');
var ab = require('./modules/acousticbrainz');
var mp = require('./modules/moodplay')
var module_data = express.Router();

module_data.get('/', function(req, res) {
  console.log('Data module root')
});

module_data.get('/generate_acousticbrainz_data/', function(req, res) {
  ab.generate_static_content(function() {
    res.send({ "status": "finished" });
  })
});

module_data.get('/generate_moodplay_data/', function(req, res) {
  mp.generate_static_content(function() {
    res.send({ "status": "finished" });
  })
});

module.exports = module_data;
