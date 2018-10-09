var express = require('express');
var dbp = require('./modules/dbpedia');
var module_dbp = express.Router();

/*
Module: Dbpedia
*/

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
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_artist_abstract_directly(dbp_uri, function(abstract) {
    res.send(abstract);
  });
});

/*
Get Associated Artists By Dbpedia URI (base-64 encoded): <span>/get_associated_artists/:dbpedia_uri</span>
Example: http://musiclynx-api.herokuapp.com/dbpedia/get_associated_artists/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL0ZlbGFfS3V0aQ==
*/
module_dbp.get('/get_associated_artists/:dbpedia_uri', function(req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_associated_artists(dbp_uri, function(artists) {
    res.send(artists);
  })
});

/*
Get Categories By Dbpedia URI (base-64 encoded): <span>/get_categories/:dbpedia_uri</span>
Example: http://musiclynx-api.herokuapp.com/dbpedia/get_categories/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL01pcmlhbV9NYWtlYmE=
*/
module_dbp.get('/get_categories/:dbpedia_uri', function(req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_categories(dbp_uri, function(categories) {
    res.send(categories);
  })
});

module_dbp.get('/get_category_links/:yago_uri/:artist_uri/:limit', function(req, res) {
  var b = Buffer.from(req.params.yago_uri, 'base64')
  var yago_uri = b.toString();
  var b = Buffer.from(req.params.artist_uri, 'base64')
  var artist_uri = b.toString();
  var limit = req.params.limit;
  dbp.get_category_links(yago_uri, artist_uri, limit, function(links) {
    res.send(links);
  });
});

module_dbp.get('/describe_artist/:dbpedia_uri', function(req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.describe_artist(dbp_uri, function(artist) {
    res.send(artist);
  })
});

/*
Construct Artist By Dbpedia URI (base-64 encoded): <span>/construct_artist/:dbpedia_uri</span>
Example: http://musiclynx-api.herokuapp.com/dbpedia/construct_artist/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL0ZhdG91bWF0YV9EaWF3YXJh
*/
module_dbp.get('/construct_artist/:dbpedia_uri', function(req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.construct_artist(dbp_uri, function(artist) {
    res.send(artist);
  })
});

/*
Get All Linked Artists By Dbpedia URI (base-64 encoded): <span>/get_all_linked_artists/:dbpedia_uri</span>
Example: http://musiclynx-api.herokuapp.com/dbpedia/get_all_linked_artists/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL0ZlbGFfS3V0aQ==
*/
module_dbp.get('/get_all_linked_artists/:dbpedia_uri', function(req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_all_linked_artists(dbp_uri, function(artists) {
    res.send(artists);
  })
});

/*
Get Category Degrees By Dbpedia URI (base-64 encoded): <span>/get_category_degrees/:dbpedia_uri</span>
Example: http://musiclynx-api.herokuapp.com/dbpedia/get_category_degrees/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL1BKX0hhcnZleQ==
*/
module_dbp.get('/get_category_degrees/:dbpedia_uri', function(req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_category_degrees(dbp_uri, function(categories) {
    res.send(categories);
  })
});

/*
Get Artist Redirect By Dbpedia URI (base-64 encoded): <span>/get_artist_redirect/:dbpedia_uri</span>
Example: http://musiclynx-api.herokuapp.com/dbpedia/get_artist_redirect/aHR0cDovL2RicGVkaWEub3JnL3Jlc291cmNlL1cuQS5fTW96YXJ0
*/
module_dbp.get('/get_artist_redirect/:dbpedia_uri', function(req, res) {
  var b = Buffer.from(req.params.dbpedia_uri, 'base64')
  var dbp_uri = b.toString();
  dbp.get_artist_redirect(dbp_uri, function(redirect) {
    res.send(redirect);
  })
});

module.exports = module_dbp;
