var LastFM = require('last-fm');

LASTFM_API_KEY="4ece8b28e820a744ac48e9c42b4c4215"
LASTFM_SECRET="9332f12c770c23cae99ae46e134d70bf"
LASTFM_USER_AGENT="MusicLynx/0.1.0 (http://musiclynx.net)"

var lastfm = new LastFM(LASTFM_API_KEY, { userAgent: LASTFM_USER_AGENT });

const MAX_ARTISTS = 17;

module.exports.get_similar_artists = function(mbid, name, cb) {
  lastfm.artistSimilar({name: decodeURIComponent(name), mbid: mbid, limit: MAX_ARTISTS }, (err, data) => {
    if (err) cb({ error: err })
    else {
      var artists = [];
      if (data['artist'].length > 1) {
        data['artist'].forEach(function(artist) {
          artists.push({ id: artist.mbid, name: artist.name });
        });
      }
      cb(artists)
    }
  })
}

module.exports.get_top_tags = function(mbid, name, cb) {
  lastfm.artistTopTags({name: decodeURIComponent(name), mbid: mbid }, (err, data) => {
    if (err) cb({ error: err })
    else cb(data["tag"])
  })
}

module.exports.get_top_track_tags = function(mbid, name, artist, cb) {
  lastfm.trackTopTags({ name: decodeURIComponent(name), artistName: decodeURIComponent(artist) }, (err, data) => {
    console.log(err);
    if (err) cb({ error: err })
    else cb(data)
  })
}

module.exports.get_track_info = function(name, artist, cb) {
  lastfm.trackInfo({ name: decodeURIComponent(name), artistName: decodeURIComponent(artist) }, (err, data) => {
    console.log(err);
    if (err) cb({ error: err })
    else cb(data)
  })
}
