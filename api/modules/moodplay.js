var request = require('request');
var uris = require('./uris').uris;
var qb = require('./query_builder');
var asnc = require('async');
var jsonfile = require('jsonfile');

const max_static_links = 17;

var data = {}

jsonfile.readFile(uris.static_db_dir + uris.mp_static_db + '.json', function(err, obj) {
  if (err) console.log(err);
  data = obj;
  console.log("Moodplay static data loaded!");
});

var get_similar_artists = function(name, limit, cb) {
  var params = { ARTIST: name, LIMIT: limit };
  var query = qb.buildQuery("moodplay_artists", params);
  var options = { method: 'GET', uri: uris.mood_uri + "/mood?query=" + encodeURIComponent(query) + "&output=json" };
  request(options, function(err, response, body) {
    var json = JSON.parse(body);
    var artists = [];
    if (json.results.bindings.length > 1) {
      json.results.bindings.forEach(function(artist) {
        artists.push({ id: artist.mbid.value, name: artist.artist.value });
      });
    }
    cb(artists);
  });
}

module.exports.get_similar_artists = get_similar_artists;

module.exports.get_static_similar_artists = function(id, cb) {
  if (id in data) cb(data[id].links);
  else cb({ "status": "artist not found" });
}

module.exports.generate_static_content = function(cb) {
  var query = qb.buildQuery("all_moodplay_artists");
  var options = { method: 'GET', uri: uris.mood_uri + "/mood?query=" + encodeURIComponent(query) + "&output=json" };
  console.log(options);
  request(options, function(err, response, body) {
    var json = JSON.parse(body);
    var db = {};
    if (json.results.bindings.length > 1) {
      asnc.eachSeries(json.results.bindings, function(artist, callback) {
        get_similar_artists(artist.name.value, max_static_links, function(links) {
          db[artist.mbid.value] = { id: artist.mbid.value, name: artist.name.value, links: links };
          console.log(artist.mbid.value, artist.name.value);
          callback();
        })
      }, function(err) {
        var file = uris.static_db_dir + uris.mp_static_db + '.json';
        jsonfile.writeFile(file, db, function (err) {
          if (err) console.error(err);
        });
        cb();
      })
    }
  })
}
