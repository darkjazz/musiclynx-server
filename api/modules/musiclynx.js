var jsonfile = require('jsonfile');
var uris = require('./uris').uris
var sa = require('./sameas');

var data = {}

jsonfile.readFile(uris.static_db_dir + uris.linked_static_db + '.json', function(err, obj) {
  if (err) console.log(err);
  data = obj;
  console.log("Linked artists static data loaded!");
});

module.exports.find_dbpedia_link = function(mbid, name, cb) {
  if (mbid in data) {
    cb(data[mbid]);
  }
  else {
    // temporary solution
    sa.find_dbpedia_link(mbid, name, function(dbp_uri) {
      cb(dbp_uri)
    })
  }
}

module.exports.find_musicbrainz_id = function(artist_uri, name, cb) {
  if (artist_uri in data) {
    cb({'id': data[artist_uri]})
  }
  else {
    sa.find_musicbrainz_id(artist_uri, name, function(artist) {
      cb(artist)
    })
  }
}
