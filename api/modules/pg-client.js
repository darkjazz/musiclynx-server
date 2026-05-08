/**
 * PostgreSQL client for MusicLynx
 * Replaces DBpedia/SPARQL with reliable RDS PostgreSQL
 */

const { Pool } = require('pg');

// Build pool config — supports both split env vars (ECS) and DATABASE_URL (local)
const poolConfig = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (process.env.DB_HOST) {
  // ECS: credentials injected individually from Secrets Manager
  poolConfig.host = process.env.DB_HOST;
  poolConfig.port = parseInt(process.env.DB_PORT || '5432');
  poolConfig.database = process.env.DB_NAME || 'musiclynx';
  poolConfig.user = process.env.DB_USERNAME;
  poolConfig.password = process.env.DB_PASSWORD;
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  // Local: DATABASE_URL, detect Unix socket (peer auth, no SSL)
  const dbUrl = process.env.DATABASE_URL || '';
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
    || dbUrl.startsWith('postgresql:///') || dbUrl.includes('/var/run/');

  if (isLocal) {
    const dbName = dbUrl.replace('postgresql:///', '').split('?')[0] || 'musiclynx';
    poolConfig.database = dbName;
    poolConfig.host = '/var/run/postgresql';
  } else {
    poolConfig.connectionString = dbUrl;
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

// Create connection pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a query with parameters
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Set a timeout of 5 seconds
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
}

/**
 * Close the pool
 */
async function end() {
  await pool.end();
}

module.exports = {
  query,
  getClient,
  end,
  pool,
};
