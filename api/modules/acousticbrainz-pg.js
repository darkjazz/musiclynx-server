/**
 * PostgreSQL-based AcousticBrainz similarity module
 * Replaces static ab_db.json with ab_similar table queries
 */

const db = require('./pg-client');

// Must match MAP in graph.js: { rhythm: 0, tonality: 1, timbre: 2, timbre_and_rhythm: 3 }
const FEATURE_ORDER = ['rhythm', 'tonality', 'timbre', 'timbre_and_rhythm'];
const LABELS = {
  rhythm: 'Similar Artists By Rhythm',
  tonality: 'Similar Artists By Tonality',
  timbre: 'Similar Artists By Timbre',
  timbre_and_rhythm: 'Similar Artists By Timbre And Rhythm',
};

module.exports.get_static_similar_artists = function (id, cb) {
  db.query(
    'SELECT feature_set, similar_mbid, similar_name FROM ab_similar WHERE artist_mbid = $1 ORDER BY feature_set, rank',
    [id]
  )
    .then(result => {
      if (result.rows.length > 0) {
        const grouped = {};
        result.rows.forEach(row => {
          if (!grouped[row.feature_set]) grouped[row.feature_set] = [];
          grouped[row.feature_set].push({
            id: row.similar_mbid,
            name: row.similar_name
          });
        });

        const categories = FEATURE_ORDER.map(feature => ({
          label: LABELS[feature],
          artists: grouped[feature] || []
        }));

        cb(categories);
      } else {
        cb({ status: "artist not found!" });
      }
    })
    .catch(err => {
      console.error('Error getting AB similar artists:', err);
      cb({ status: "artist not found!" });
    });
};
