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

module.exports = module_ml;
