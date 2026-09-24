import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { formatError } from '../utils/formatError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Tracks which migration files have already been applied
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const appliedResult = await client.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedResult.rows.map((row) => row.filename));

    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip   ${file} (already applied)`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');

      try {
        // Each migration runs in a transaction: it fully succeeds or fully rolls back
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`apply  ${file}`);
        appliedCount += 1;
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${formatError(error)}`);
      }
    }

    console.log(
      appliedCount === 0
        ? 'Database is up to date.'
        : `Done. Applied ${appliedCount} migration(s).`
    );
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await runMigrations();
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();