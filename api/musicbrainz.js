var express = require('express');
var mb = require('./modules/musicbrainz');
var log = require('./modules/logger');
var module_mb = express.Router();

/*
Module: MusicBrainz
*/

module_mb.get('/', function(req, res) {
  console.log('MusicBrainz module root')
});

/*
Search Artists: <span>/artist_search/:searchTerm</span>
Example: http://musiclynx-api.herokuapp.com/musicbrainz/artist_search/Ellen%20Allien
*/
module_mb.get('/artist_search/:searchTerm/:user_guid', function(req, res) {
  var searchTerm = req.params.searchTerm;
  mb.artist_search(searchTerm, function(artists) {
    log.log_search(req.ip, req.params.user_guid, searchTerm);
    res.send(artists);
  });
});

module.exports = module_mb;
