var express = require('express');
var sameas = require('./modules/sameas');

var module_sa = express.Router();

module_sa.get('/', function(req, res) {
  console.log('Sameas module root')
});

module_sa.get('/find_dbpedia_link/:mbid/:name', function(req, res) {
  var artist_name = req.params.name;
  var mbid = req.params.mbid;
  sameas.find_dbpedia_link(mbid, artist_name, function(match) {
    res.send(match);
  });
});

module_sa.get('/find_musicbrainz_id/:artist_uri/:name', function(req, res) {
  var b = new Buffer(req.params.artist_uri, 'base64');
  var artist_uri = b.toString();
  var name = req.params.name;
  sameas.find_musicbrainz_id(artist_uri, name, function(artist) {
    res.send(artist);
  })
});

module.exports = module_sa;
