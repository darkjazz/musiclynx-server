var express = require('express');
var dbp = require('./modules/dbpedia');
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
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_artist_abstract_directly(dbp_uri, function(abstract) {
    res.send(abstract);
  });
});

module_dbp.get('/get_associated_artists/:dbpedia_uri', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_associated_artists(dbp_uri, function(artists) {
    res.send(artists);
  })
});

module_dbp.get('/get_categories/:dbpedia_uri', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_categories(dbp_uri, function(categories) {
    res.send(categories);
  })
});

module_dbp.get('/get_category_links/:yago_uri/:artist_uri/:limit', function(req, res) {
  var b = new Buffer(req.params.yago_uri, 'base64')
  var yago_uri = b.toString();
  var b = new Buffer(req.params.artist_uri, 'base64')
  var artist_uri = b.toString();
  var limit = req.params.limit;
  dbp.get_category_links(yago_uri, artist_uri, limit, function(links) {
    res.send(links);
  });
});

module_dbp.get('/describe_artist/:dbpedia_uri', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.describe_artist(dbp_uri, function(artist) {
    res.send(artist);
  })
});

module_dbp.get('/construct_artist/:dbpedia_uri', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.construct_artist(dbp_uri, function(artist) {
    res.send(artist);
  })
});

module_dbp.get('/get_all_linked_artists/:dbpedia_uri', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_all_linked_artists(dbp_uri, function(artists) {
    res.send(artists);
  })
});

module_dbp.get('/get_category_degrees/:dbpedia_uri', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_category_degrees(dbp_uri, function(categories) {
    res.send(categories);
  })
});

module_dbp.get('/get_artist_redirect/:dbpedia_uri', function(req, res) {
  var b = new Buffer(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_artist_redirect(dbp_uri, function(redirect) {
    res.send(redirect);
  })
});

module.exports = module_dbp;
