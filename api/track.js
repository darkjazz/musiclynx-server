const express = require('express');
const track = require('./modules/track');

const router = express.Router();

router.get('/search/:term', async (req, res) => {
  try {
    const results = await track.searchTracks(req.params.term);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/get_track/:mbid', async (req, res) => {
  try {
    const result = await track.getTrack(req.params.mbid);
    if (!result) return res.status(404).json({ error: 'not found' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/get_graph/:mbid/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 47;
    const result = await track.getTrackGraph(req.params.mbid, limit);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/by_artist/:mbid', async (req, res) => {
  try {
    const result = await track.getTracksByArtist(req.params.mbid);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
