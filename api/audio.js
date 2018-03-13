var express = require('express');
var au = require('./modules/audio');
var module_au = express.Router();

/*
Module: Audio
*/
module_au.get('/', function(req, res) {
  console.log('Audio module root')
});

/*
Get Deezer ID: /get_deezer_id/:term
Example: http://musiclynx-api.herokuapp.com/audio/get_deezer_id/Santigold
*/
module_au.get('/get_deezer_id/:term', function(req, res, next) {
  var term = req.params.term;
  au.get_artist_id(term, function(id) {
    res.send(id);
  })
});

/*
Get Deezer Playlist: /get_deezer_playlist/:term
Example: http://musiclynx-api.herokuapp.com/audio/get_deezer_playlist/Merzbow
*/
module_au.get('/get_deezer_playlist/:term', function(req, res, next) {
  var term = req.params.term;
  au.get_deezer_playlist(term, function(playlist) {
    res.send(playlist);
  })
});

module.exports = module_au;
