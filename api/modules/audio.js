var request = require('request');
var uris = require('./uris').uris;

module.exports.get_artist_id = function(term, cb) {
  var query = "?q=" + term + "&output=json";
  request({ method: 'GET', uri: uris.deezer_uri + query }, function(err, response, body)
  {
    var json = JSON.parse(body);
    if (json.data && json.data.length > 0 && json.data[0].id)
      cb({ "id": json.data[0].id });
    else
      cb({ "status": "not found" });
  })
}

module.exports.get_deezer_playlist = function(term, cb) {
  var query = "?q=" + term + "&output=json";
  request({ method: 'GET', uri: uris.deezer_uri + query }, function(err, response, body)
  {
    var json = JSON.parse(body);
    if (json.data && json.data.length > 0 && json.data[0].tracklist) {
      var playlist_uri = json.data[0].tracklist.replace("limit=50", "limit=13");
      request({ method: 'GET', uri: playlist_uri }, function(terr, tresp, tbody) {
        var tjson = JSON.parse(tbody);
        var playlist = [];
        tjson.data.forEach(function(track) {
          playlist.push({
            "title": track.title,
            "uri": track.preview,
            "cover_art_url": track.album.cover_medium,
            "album": track.album.title,
            "artist": track.artist.name
          });
        });
        cb(playlist);
      });
    }
    else
    {
      cb({ "status": "not found" });
    }
  });
}
