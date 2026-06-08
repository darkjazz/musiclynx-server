const { Pool } = require('pg');

const pool = new Pool(
  process.env.AB_DB_HOST ? {
    host:     process.env.AB_DB_HOST,
    port:     parseInt(process.env.AB_DB_PORT || '5432'),
    database: process.env.AB_DB_NAME || 'acousticbrainz',
    user:     process.env.AB_DB_USERNAME,
    password: process.env.AB_DB_PASSWORD,
    ssl:      { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  } : {
    host:     '/var/run/postgresql',
    database: 'acousticbrainz',
    user:     'alo',
    max: 10,
    idleTimeoutMillis: 30000,
  }
);

pool.on('error', (err) => {
  console.error('acousticbrainz pool error:', err);
});

module.exports = {
  query:   (text, params) => pool.query(text, params),
  connect: ()             => pool.connect(),
};
