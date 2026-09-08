import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
import { toZatoshi } from './money.js';
if (!pool) throw new Error('Set DATABASE_URL in backend/.env');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(791028)');
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const version = '001_initial';
  const prior = await client.query('SELECT version FROM schema_migrations WHERE version=$1', [
    version,
  ]);
  if (!prior.rowCount) {
    await client.query(
      await readFile(new URL('../../database/001_initial.sql', import.meta.url), 'utf8'),
    );
    await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [version]);
  }
  const zsaVersion = '002_zsa';
  const zsaPrior = await client.query('SELECT version FROM schema_migrations WHERE version=$1', [
    zsaVersion,
  ]);
  if (!zsaPrior.rowCount) {
    await client.query(
      await readFile(new URL('../../database/002_zsa.sql', import.meta.url), 'utf8'),
    );
    await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [zsaVersion]);
  }
  if (process.argv.includes('--seed')) {
    // Small, explicitly test-only collection. Never overwrite a configured collection.
    await client.query(
      `INSERT INTO collections(id,name,max_supply,price_zatoshi,max_per_tx)
      VALUES('chomp-test','CHOMP Test Collection',20,$1,5) ON CONFLICT DO NOTHING`,
      [toZatoshi('0.001').toString()],
    );
    await client.query(`INSERT INTO assets(collection_id,serial,name)
      SELECT 'chomp-test',s,'CHOMP Test #' || s FROM generate_series(1,20) s ON CONFLICT DO NOTHING`);
  }
  await client.query('COMMIT');
  console.log(
    'Database migration complete' +
      (process.argv.includes('--seed') ? '; test collection seeded (20 items, PAUSED)' : ''),
  );
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
