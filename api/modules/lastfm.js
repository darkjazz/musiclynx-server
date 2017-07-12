var LastFM = require('last-fm');
var lastfm = new LastFM(process.env.LASTFM_API_KEY, { userAgent: process.env.LASTFM_USER_AGENT });

const MAX_ARTISTS = 30;

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
