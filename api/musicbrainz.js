var express = require('express');
var mb = require('./modules/musicbrainz');
var module_mb = express.Router();

/*
Module: MusicBrainz
*/

module_mb.get('/', function(req, res) {
  console.log('MusicBrainz module root')
});

/*
Search Artists: /artist_search/:searchTerm
Example: http://musiclynx-api.herokuapp.com/musicbrainz/artist_search/Ellen%20Allien
*/
module_mb.get('/artist_search/:searchTerm', function(req, res) {
  var searchTerm = req.params.searchTerm;
  mb.artist_search(searchTerm, function(artists) {
    res.send(artists);
  });
});

module.exports = module_mb;
