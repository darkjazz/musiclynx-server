var express = require('express');
var db = require('./modules/pg-client');

var router = express.Router();

/*
GET /community/list
Returns all 32 communities with artist counts and top 5 genre labels.
*/
router.get('/list', async function (req, res) {
  try {
    const result = await db.query(`
      WITH counts AS (
        SELECT community_id, community_name, content_type, COUNT(*) AS artist_count
        FROM artist_community
        GROUP BY community_id, community_name, content_type
      ),
      genres AS (
        SELECT community_id, ARRAY_AGG(name ORDER BY rank) AS top_genres
        FROM community_top_genres
        WHERE rank <= 5
        GROUP BY community_id
      )
      SELECT
        c.community_id  AS id,
        c.community_name AS name,
        c.content_type,
        c.artist_count::int,
        COALESCE(g.top_genres, ARRAY[]::text[]) AS top_genres
      FROM counts c
      LEFT JOIN genres g ON g.community_id = c.community_id
      ORDER BY c.community_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching community list:', err);
    res.status(500).json({ error: 'Failed to load communities' });
  }
});

/*
GET /community/graph
Serves the interactive Plotly genre graph HTML.
*/
router.get('/graph', function (req, res) {
  res.sendFile('/home/alo/dev/musiclynx/musiclynx-similarity/genre_graph.html');
});

module.exports = router;
