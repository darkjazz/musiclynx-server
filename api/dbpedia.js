var express = require('express');
var dbp = require('./modules/dbpedia');
var b64 = require('base-64');
var module_dbp = express.Router();

module_dbp.get('/', function(req, res) {
  console.log('Dbpedia module root')
});

module_dbp.get('/get_artist_abstract/:mbid/:name', function(req, res) {
  var mbid = req.params.mbid;
  var name = req.params.name;
  dbp.get_artist_abstract(mbid, name, function(abstract) {
    res.send(abstract);
  });
});

module_dbp.get('/get_artist_abstract_directly/:dbpedia_uri', function(req, res) {
  var dbp_uri = b64.decode(req.params.dbpedia_uri);
  dbp.get_artist_abstract_directly(dbp_uri, function(abstract) {
    res.send(abstract);
  });
});

module_dbp.get('/get_associated_artists/:dbpedia_uri', function(req, res) {
  var dbp_uri = b64.decode(req.params.dbpedia_uri);
  dbp.get_associated_artists(dbp_uri, function(artists) {
    res.send(artists);
  })
});

module_dbp.get('/get_categories/:dbpedia_uri', function(req, res) {
  var query, params;
  dbp_uri = b64.decode(req.params.dbpedia_uri);
  dbp.get_categories(dbp_uri, function(categories) {
    res.send(categories);
  })
});

module_dbp.get('/get_category_links/:yago_uri/:artist_uri/:limit', function(req, res) {
  var yago_uri = b64.decode(req.params.yago_uri);
  var artist_uri = b64.decode(req.params.artist_uri);
  var limit = req.params.limit;
  dbp.get_category_links(yago_uri, artist_uri, limit, function(links) {
    res.send(links);
  });
});

module_dbp.get('/describe_artist/:dbpedia_uri', function(req, res) {
  var dbp_uri = b64.decode(req.params.dbpedia_uri);
  dbp.describe_artist(dbp_uri, function(artist) {
    res.send(artist);
  })
});

module_dbp.get('/construct_artist/:dbpedia_uri', function(req, res) {
  var dbp_uri = b64.decode(req.params.dbpedia_uri);
  dbp.construct_artist(dbp_uri, function(artist) {
    res.send(artist);
  })
});

module_dbp.get('/get_all_linked_artists/:dbpedia_uri', function(req, res) {
  var dbp_uri = b64.decode(req.params.dbpedia_uri);
  dbp.get_all_linked_artists(dbp_uri, function(artists) {
    res.send(artists);
  })
});

module.exports = module_dbp;
