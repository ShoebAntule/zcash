import pg from 'pg';
export const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
    })
  : null;
// Never log connection strings or SQL parameters.
pool?.on('error', () => console.error('DATABASE_CONNECTION_ERROR'));
