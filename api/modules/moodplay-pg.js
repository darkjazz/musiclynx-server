/**
 * PostgreSQL-based moodplay similarity module
 * Replaces static mp_db.json with moodplay_similar table queries
 */

const db = require('./pg-client');

module.exports.get_static_similar_artists = function (id, cb) {
  db.query(
    'SELECT similar_mbid, similar_name FROM moodplay_similar WHERE artist_mbid = $1 ORDER BY rank',
    [id]
  )
    .then(result => {
      if (result.rows.length > 0) {
        cb({
          label: "Similar Artists By Mood",
          artists: result.rows.map(row => ({
            id: row.similar_mbid,
            name: row.similar_name
          }))
        });
      } else {
        cb({ status: "artist not found" });
      }
    })
    .catch(err => {
      console.error('Error getting moodplay similar artists:', err);
      cb({ status: "artist not found" });
    });
};
