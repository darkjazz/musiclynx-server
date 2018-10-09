var request = require('request');
var uris = require('./uris').uris;

const API_KEY = '10b9ce3cd457df92d308369aef75ae82';
const BASE_PARAMS = 'format=json&callback=callback';

var get_artist_id = function(id, name, cb) {
  var query = "?" + BASE_PARAMS + "&q_artist=" + name + "&apikey=" + API_KEY;
  request({ method: 'GET', uri: uris.musixmatch_uri + "artist.search" + query }, function(err, res, body)
  {
    if (err) cb(err);
    var json = JSON.parse(body);
    if (json.message.body.artist_list.length > 0) {
      var artists = json.message.body.artist_list;
      var found = artists.find(function(artist) {
        return artist.artist.artist_mbid == id
      });
      if (found) cb(found.artist.artist_id);
      else cb(0);
    }
  })
}

module.exports.get_similar_artists = function(id, name, cb) {
  get_artist_id(id, name, function(musixmatch_id) {
    var query = "?" + BASE_PARAMS + "&artist_id=" + musixmatch_id + "&apikey=" + API_KEY;
    request({ method: 'GET', uri: uris.musixmatch_uri + "artist.related.get" + query }, function(err, res, body)
    {
      if (err) cb(err);
      var json = JSON.parse(body);
      if (json.message.header.status_code == 200 && json.message.body.artist_list.length > 0) {
        var artists = []
        var category = {}
        category.label = "Similar Artists By Lyrics";
        json.message.body.artist_list.forEach(function(msx) {
          var artist = {}
          artist["id"] = msx.artist.artist_mbid;
          artist["name"] = msx.artist.artist_name;
          artists.push(artist);
        });
        category.artists = artists;
        cb(category)
      }
    })
  })
}
