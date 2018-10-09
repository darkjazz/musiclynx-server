var express = require('express');
var sameas = require('./modules/sameas');

var module_sa = express.Router();

/*
Module: Sameas
*/

module_sa.get('/', function(req, res) {
  console.log('Sameas module root')
});

/*
Find Dbpedia URI By MusicBrainz ID and Name: <span>/find_dbpedia_link/:mbid/:name</span>
Example: http://musiclynx-api.herokuapp.com/sameas/find_dbpedia_link/97b20fe3-0924-4a5f-9955-d0b5c5f9587f/Santigold
*/
module_sa.get('/find_dbpedia_link/:mbid/:name', function(req, res) {
  var artist_name = req.params.name;
  var mbid = req.params.mbid;
  sameas.find_dbpedia_link(mbid, artist_name, function(match) {
    res.send(match);
  });
});

/*
Find MusicBrainz ID by Dbpedia URI and Name: <span>/find_dbpedia_link/:artist_uri/:name</span>
Example: http://musiclynx-api.herokuapp.com/sameas/find_musicbrainz_id/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL1NpZ3VyX1LDs3M=/Sigur%20R%C3%B3s
*/
module_sa.get('/find_musicbrainz_id/:artist_uri/:name', function(req, res) {
  var b = Buffer.from(req.params.artist_uri, 'base64');
  var artist_uri = b.toString();
  var name = req.params.name;
  sameas.find_musicbrainz_id(artist_uri, name, function(artist) {
    res.send(artist);
  })
});

module.exports = module_sa;
