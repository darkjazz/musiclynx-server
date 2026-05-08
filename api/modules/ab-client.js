/**
 * PostgreSQL client for the acousticbrainz database.
 * Separate pool from the musiclynx db — local only for now.
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: '/var/run/postgresql',
  database: 'acousticbrainz',
  user: 'alo',
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('acousticbrainz pool error:', err);
});

module.exports = {
  query:   (text, params) => pool.query(text, params),
  connect: ()             => pool.connect(),
};
