var express = require('express');
var au = require('./modules/audio');
var module_au = express.Router();

module_au.get('/', function(req, res) {
  console.log('Audio module root')
});

module_au.get('/get_deezer_playlist/:term', function(req, res, next) {
  var term = req.params.term;
  au.get_deezer_playlist(term, function(playlist) {
    res.send(playlist);
  })
});

module.exports = module_au;
