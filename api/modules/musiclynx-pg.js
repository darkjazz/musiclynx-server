/**
 * PostgreSQL-based artist ID linking module
 * Replaces static lx_db.json with artist_links table queries
 */

const db = require('./pg-client');

module.exports.find_dbpedia_link = function (mbid, cb) {
  db.query('SELECT dbpedia_uri FROM artist_links WHERE mbid = $1 LIMIT 1', [mbid])
    .then(result => {
      if (result.rows.length > 0) {
        cb(decodeURIComponent(result.rows[0].dbpedia_uri));
      } else {
        cb({ error: "not found" });
      }
    })
    .catch(err => {
      console.error('Error finding dbpedia link:', err);
      cb({ error: "not found" });
    });
};

module.exports.find_musicbrainz_id = function (artist_uri, cb) {
  const parts = artist_uri.split("/");
  const name = encodeURIComponent(parts.pop());
  const encoded_uri = parts.join("/") + "/" + name;

  db.query('SELECT mbid FROM artist_links WHERE dbpedia_uri = $1 LIMIT 1', [encoded_uri])
    .then(result => {
      if (result.rows.length > 0) {
        cb(result.rows[0].mbid);
      } else {
        cb({ error: "not found" });
      }
    })
    .catch(err => {
      console.error('Error finding musicbrainz id:', err);
      cb({ error: "not found" });
    });
};
