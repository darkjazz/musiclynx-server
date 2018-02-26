var express = require('express');
var ml = require('./modules/musiclynx');

var module_ml = express.Router();

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

module_ml.get('/link_mb_id/:id', function(req, res) {
  ml.find_dbpedia_link(req.params.id, function(dbp_uri) {
    res.send(dbp_uri);
  })
});

module_ml.get('/link_dbp_uri/:dbpedia_uri', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  ml.find_musicbrainz_id(dbp_uri, function(mbid) {
    res.send(mbid.id);
  })
})


module.exports = module_ml;
