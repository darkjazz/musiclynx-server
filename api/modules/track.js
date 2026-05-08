const db = require('./ab-client');

const NEIGHBORS_PER_DIM = 13;
const GRAPH_LIMIT = 47;

// ─── Search ──────────────────────────────────────────────────────────────────

async function searchTracks(term, limit = 20) {
  const result = await db.query(`
    SELECT t.mbid, t.title, t.album_name, t.length_seconds, a.name AS artist
    FROM tracks t
    JOIN artists a ON a.mbid = t.artist_mbid
    WHERE t.title ILIKE $1 OR a.name ILIKE $1
    ORDER BY
      CASE WHEN t.title ILIKE $2 THEN 0
           WHEN a.name ILIKE $2 THEN 1
           ELSE 2 END,
      t.title
    LIMIT $3
  `, [`%${term}%`, term, limit]);

  return result.rows;
}

// ─── Track info ───────────────────────────────────────────────────────────────

async function getTrack(mbid) {
  const result = await db.query(`
    SELECT t.mbid, t.title, t.album_name, t.length_seconds,
           a.mbid AS artist_mbid, a.name AS artist
    FROM tracks t
    JOIN artists a ON a.mbid = t.artist_mbid
    WHERE t.mbid = $1
  `, [mbid]);

  if (result.rows.length === 0) return null;

  const track = result.rows[0];

  const features = await db.query(`
    SELECT bpm, key_key, key_scale
    FROM track_features WHERE mbid = $1
  `, [mbid]);

  if (features.rows.length > 0) {
    const f = features.rows[0];
    track.bpm = f.bpm ? Math.round(f.bpm) : null;
    track.key = f.key_key && f.key_scale ? `${f.key_key} ${f.key_scale}` : null;
  }

  return track;
}

// ─── Graph ───────────────────────────────────────────────────────────────────

async function getTrackGraph(mbid) {
  const seedTrack = await getTrack(mbid);
  if (!seedTrack) return { nodes: [], links: [] };

  const client = await db.connect();
  let rows;
  try {
    await client.query('SET ivfflat.probes = 20');
    const result = await client.query(`
      SELECT * FROM (
        SELECT 'timbre' AS dim, v.mbid, v.timbre <-> q.timbre AS dist
          FROM track_vectors v, (SELECT timbre FROM track_vectors WHERE mbid = $1) q
          ORDER BY v.timbre <-> q.timbre LIMIT $2
      ) t
      UNION ALL
      SELECT * FROM (
        SELECT 'rhythm' AS dim, v.mbid, v.rhythm <-> q.rhythm AS dist
          FROM track_vectors v, (SELECT rhythm FROM track_vectors WHERE mbid = $1) q
          ORDER BY v.rhythm <-> q.rhythm LIMIT $2
      ) r
      UNION ALL
      SELECT * FROM (
        SELECT 'tonal' AS dim, v.mbid, v.tonal <-> q.tonal AS dist
          FROM track_vectors v, (SELECT tonal FROM track_vectors WHERE mbid = $1) q
          ORDER BY v.tonal <-> q.tonal LIMIT $2
      ) tn
      UNION ALL
      SELECT * FROM (
        SELECT 'combined' AS dim, v.mbid, v.combined <-> q.combined AS dist
          FROM track_vectors v, (SELECT combined FROM track_vectors WHERE mbid = $1) q
          ORDER BY v.combined <-> q.combined LIMIT $2
      ) c
    `, [mbid, NEIGHBORS_PER_DIM + 1]);
    rows = result.rows;
  } finally {
    client.release();
  }

  const byMbid = new Map();
  for (const row of rows) {
    if (row.mbid === mbid) continue;
    if (!byMbid.has(row.mbid)) byMbid.set(row.mbid, []);
    byMbid.get(row.mbid).push({ dim: row.dim, dist: parseFloat(row.dist) });
  }

  if (byMbid.size === 0) return { nodes: [], links: [] };

  const trackDetails = await db.query(`
    SELECT t.mbid, t.title, t.album_name, t.length_seconds, a.name AS artist
    FROM tracks t
    JOIN artists a ON a.mbid = t.artist_mbid
    WHERE t.mbid = ANY($1)
  `, [[...byMbid.keys()]]);

  const trackMap = new Map(trackDetails.rows.map(r => [r.mbid, r]));

  const nodes = [{
    id: seedTrack.mbid,
    name: seedTrack.title,
    artist: seedTrack.artist,
    seed: true,
  }];
  const links = [];
  const linkCount = {};
  const groups = { timbre: [], rhythm: [], tonal: [], combined: [] };

  for (const [neighborMbid, dims] of byMbid) {
    const track = trackMap.get(neighborMbid);
    if (!track) continue;
    const GROUP_PRIORITY = ['combined', 'timbre', 'tonal', 'rhythm'];
    const primary = dims.sort((a, b) => GROUP_PRIORITY.indexOf(a.dim) - GROUP_PRIORITY.indexOf(b.dim))[0];
    nodes.push({
      id: track.mbid,
      name: track.title,
      artist: track.artist,
      album: track.album_name,
      duration: track.length_seconds,
      group: primary.dim,
      dims: dims.map(d => d.dim),
    });
    groups[primary.dim].push(track.mbid);
    linkCount[track.mbid] = 0;
  }

  const LINK_LIMIT = 5;
  const addLink = (source, target) => {
    if (linkCount[source] < LINK_LIMIT && linkCount[target] < LINK_LIMIT) {
      links.push({ source, target, value: 1 });
      linkCount[source]++;
      linkCount[target]++;
    }
  };

  // Chain first — guarantees every node is connected regardless of limit
  for (const members of Object.values(groups)) {
    for (let i = 1; i < members.length; i++) {
      links.push({ source: members[i - 1], target: members[i], value: 1 });
      linkCount[members[i - 1]]++;
      linkCount[members[i]]++;
    }
  }

  // Cross-links within group to fill remaining capacity
  for (const members of Object.values(groups)) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 2; j < members.length; j++) {
        addLink(members[i], members[j]);
      }
    }
  }

  // Seed connects to the closest node in each group to anchor subgraphs
  for (const members of Object.values(groups)) {
    if (members.length > 0) {
      links.push({ source: seedTrack.mbid, target: members[0], value: 0.5 });
    }
  }

  // Bridge: tracks appearing in multiple dims link into their secondary groups
  for (const node of nodes) {
    if (!node.dims || node.dims.length <= 1) continue;
    {
      for (const secondaryDim of node.dims.filter(d => d !== node.group)) {
        const target = groups[secondaryDim].find(id => id !== node.id);
        if (target) addLink(node.id, target);
      }
    }
  }

  return { nodes, links, seed: seedTrack };
}

async function getTracksByArtist(artistMbid, limit = 100) {
  const result = await db.query(`
    SELECT t.mbid, t.title, t.album_name, t.length_seconds
    FROM tracks t
    WHERE t.artist_mbid = $1
    ORDER BY t.album_name NULLS LAST, t.title
    LIMIT $2
  `, [artistMbid, limit]);
  return result.rows;
}

module.exports = { searchTracks, getTrack, getTrackGraph, getTracksByArtist };
