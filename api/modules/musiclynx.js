var jsonfile = require('jsonfile');
var uris = require('./uris').uris

var data = {}

jsonfile.readFile(uris.static_db_dir + uris.linked_static_db + '.json', function(err, obj) {
  if (err) console.log(err);
  data = obj;
  console.log("Linked artists static data loaded!");
});

module.exports.find_dbpedia_link = function(mbid, cb) {
  if (mbid in data) {
    cb(data[mbid]);
  }
  else cb({ "status": "artist not found!" });
}

module.exports.find_musicbrainz_id = function(artist_uri, cb) {
  if (artist_uri in data) {
    cb({'id': data[artist_uri]})
  }
  else cb({ "status": "artist not found!" })
}
