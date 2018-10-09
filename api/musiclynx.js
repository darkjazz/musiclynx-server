var express = require('express');
var ml = require('./modules/musiclynx');

var module_ml = express.Router();

/*
Module: MusicLynx
*/

module_ml.get('/', function(req, res) {
  console.log('MusicLynx module root');
});

module_ml.get('/artist_search/:term', function (req, res) {
  var term = req.params.term;
  ml.search_artists(term, function(artists) {
    res.send(artists);
  });
});

module_ml.get('/artist/:id', function (req, res) {
  var id = req.params.id;
  ml.get_artist(id, function(artist) {
    res.send(artist);
  })
});

module_ml.post('/artist/:id', function (req, res) {
  var doc = req.body;
  var id = req.params.id;
  ml.save_artist(doc, id, function(response) {
    res.send(response);
  });
});

/*
Link MusicBrainz ID to Dbpedia URI: <span>/link_mb_id/:id</span>
Example: http://musiclynx-api.herokuapp.com/musiclynx/link_mb_id/96003ca6-5c03-4771-8b94-dbdc74949125/Angel%20Haze
*/
module_ml.get('/link_mb_id/:id/:name', function(req, res) {
  var mbid = req.params.mbid;
  var name = req.params.name;
  ml.find_dbpedia_link(mbid, name, function(dbp_uri) {
    res.send(dbp_uri);
  })
});

/*
Link Dbpedia URI to MusicBrainz ID: <span>/link_dbp_uri/:dbpedia_uri</span>
Example: http://musiclynx-api.herokuapp.com/musiclynx/link_dbp_uri/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL0FuZ2VsX0hhemU=/Angel%20Haze
*/
module_ml.get('/link_dbp_uri/:dbpedia_uri/:name', function(req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  var name = req.params.name;
  ml.find_musicbrainz_id(dbp_uri, name, function(mbid) {
    res.send(mbid.id);
  })
})


module.exports = module_ml;
