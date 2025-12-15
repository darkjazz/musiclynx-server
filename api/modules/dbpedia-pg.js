/**
 * PostgreSQL-based artist data module
 * Replaces SPARQL queries with fast, reliable PostgreSQL queries
 */

const db = require('./pg-client');

/**
 * Extract artist name from DBpedia URI
 */
function getNameFromUri(uri) {
  const name = uri.split('/').pop();
  return decodeURIComponent(name).replace(/_/g, ' ');
}

/**
 * Extract category label from URI
 */
function getCategoryLabel(uri) {
  let label = uri.split('/').pop();
  label = label.replace(/^Category:/, '');
  label = decodeURIComponent(label).replace(/_/g, ' ');
  return 'Other ' + label;
}

/**
 * Get artist abstract/description by DBpedia URI
 */
async function getArtistAbstract(dbpedia_uri) {
  const query = `
    SELECT uri, name, description
    FROM artists
    WHERE uri = $1
  `;

  const result = await db.query(query, [dbpedia_uri]);

  if (result.rows.length === 0) {
    return null;
  }

  const artist = result.rows[0];
  return {
    dbpedia_uri: artist.uri,
    name: artist.name,
    abstract: artist.description,
  };
}

/**
 * Get artist's categories
 */
async function getCategories(dbpedia_uri) {
  const query = `
    SELECT c.uri, c.name
    FROM artist_categories ac
    JOIN categories c ON ac.category_uri = c.uri
    WHERE ac.artist_uri = $1
    ORDER BY c.name
  `;

  const result = await db.query(query, [dbpedia_uri]);

  return result.rows.map(row => ({
    uri: row.uri,
    label: row.name,
  }));
}

/**
 * Get all linked artists based on shared categories
 * This is the main query for graph generation
 */
async function getAllLinkedArtists(dbpedia_uri) {
  const query = `
    WITH source_artist_categories AS (
      SELECT category_uri
      FROM artist_categories
      WHERE artist_uri = $1
    ),
    category_degrees AS (
      SELECT
        ac.category_uri,
        COUNT(DISTINCT ac.artist_uri) as degree
      FROM artist_categories ac
      WHERE ac.category_uri IN (SELECT category_uri FROM source_artist_categories)
      GROUP BY ac.category_uri
    ),
    linked_artists AS (
      SELECT
        a.uri,
        a.name,
        COUNT(DISTINCT ac.category_uri) as common,
        ARRAY_AGG(DISTINCT ac.category_uri) as category_uris
      FROM artist_categories ac
      JOIN artists a ON ac.artist_uri = a.uri
      WHERE ac.category_uri IN (SELECT category_uri FROM source_artist_categories)
        AND ac.artist_uri != $1
      GROUP BY a.uri, a.name
    )
    SELECT
      la.uri,
      la.name,
      la.common as ranking,
      SUM(cd.degree) as degree,
      STRING_AGG(DISTINCT c.uri, '; ') as categories
    FROM linked_artists la
    JOIN UNNEST(la.category_uris) WITH ORDINALITY AS cat_uri(uri, ord) ON true
    JOIN category_degrees cd ON cd.category_uri = cat_uri.uri
    JOIN categories c ON c.uri = cat_uri.uri
    GROUP BY la.uri, la.name, la.common
    ORDER BY la.common DESC, SUM(cd.degree) DESC
  `;

  const result = await db.query(query, [dbpedia_uri]);

  return result.rows.map(row => ({
    dbpedia_uri: row.uri,
    name: row.name,
    ranking: parseInt(row.ranking),
    degree: parseInt(row.degree),
    common_categories: row.categories
      ? row.categories.split('; ').map(uri => ({
          uri: uri,
          label: getCategoryLabel(uri)
        }))
      : []
  }));
}

/**
 * Get category degrees for an artist
 */
async function getCategoryDegrees(dbpedia_uri) {
  const query = `
    SELECT
      c.uri,
      COUNT(DISTINCT ac2.artist_uri) as degree
    FROM artist_categories ac1
    JOIN categories c ON ac1.category_uri = c.uri
    JOIN artist_categories ac2 ON ac2.category_uri = c.uri
    WHERE ac1.artist_uri = $1
    GROUP BY c.uri
  `;

  const result = await db.query(query, [dbpedia_uri]);

  const degrees = {};
  result.rows.forEach(row => {
    degrees[row.uri] = parseInt(row.degree);
  });

  return degrees;
}

/**
 * Search artists by name
 */
async function searchArtists(searchTerm, limit = 20) {
  const query = `
    SELECT uri, name, type, description
    FROM artists
    WHERE name ILIKE $1
    ORDER BY name
    LIMIT $2
  `;

  const result = await db.query(query, [`%${searchTerm}%`, limit]);

  return result.rows.map(row => ({
    dbpedia_uri: row.uri,
    name: row.name,
    type: row.type,
    abstract: row.description,
  }));
}

/**
 * Get random artists
 */
async function getRandomArtists(limit = 10) {
  const query = `
    SELECT uri, name, type, description
    FROM artists
    ORDER BY RANDOM()
    LIMIT $1
  `;

  const result = await db.query(query, [limit]);

  return result.rows.map(row => ({
    dbpedia_uri: row.uri,
    name: row.name,
    type: row.type,
    abstract: row.description,
  }));
}

// Export with same function names as original dbpedia module for compatibility
module.exports = {
  get_artist_abstract: (dbpedia_uri, mbid, name, cb) => {
    getArtistAbstract(dbpedia_uri)
      .then(result => {
        if (result) {
          result.id = mbid;
          result.name = name || result.name;
        }
        cb(result || {});
      })
      .catch(err => {
        console.error('Error getting artist abstract:', err);
        cb({});
      });
  },

  get_artist_abstract_directly: (dbpedia_uri, cb) => {
    getArtistAbstract(dbpedia_uri)
      .then(result => cb(result || {}))
      .catch(err => {
        console.error('Error getting artist abstract:', err);
        cb({});
      });
  },

  get_categories: (dbpedia_uri, cb) => {
    getCategories(dbpedia_uri)
      .then(categories => cb(categories))
      .catch(err => {
        console.error('Error getting categories:', err);
        cb([]);
      });
  },

  get_all_linked_artists: (dbpedia_uri, cb) => {
    getAllLinkedArtists(dbpedia_uri)
      .then(artists => cb(artists))
      .catch(err => {
        console.error('Error getting linked artists:', err);
        cb([]);
      });
  },

  get_category_degrees: (dbpedia_uri, cb) => {
    getCategoryDegrees(dbpedia_uri)
      .then(degrees => cb(degrees))
      .catch(err => {
        console.error('Error getting category degrees:', err);
        cb({});
      });
  },

  get_artist_redirect: (dbpedia_uri, cb) => {
    // PostgreSQL doesn't have redirects - return empty array
    cb([]);
  },

  get_associated_artists: (dbpedia_uri, cb) => {
    // Not implemented in PostgreSQL backend - return empty array
    cb([]);
  },

  // Stub functions for compatibility
  get_category_links: (yago_uri, artist_uri, limit, cb) => {
    cb([]);
  },

  describe_artist: (dbpedia_uri, cb) => {
    getArtistAbstract(dbpedia_uri)
      .then(result => cb(result || {}))
      .catch(err => {
        console.error('Error describing artist:', err);
        cb({});
      });
  },

  construct_artist: (dbpedia_uri, cb) => {
    getArtistAbstract(dbpedia_uri)
      .then(result => cb(result || {}))
      .catch(err => {
        console.error('Error constructing artist:', err);
        cb({});
      });
  },

  // New functions
  searchArtists,
  getRandomArtists,
  getNameFromUri,
  getCategoryLabel,
};
