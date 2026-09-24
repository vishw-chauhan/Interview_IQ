import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database:', env.db.name);
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

export const query = (text, params) => pool.query(text, params);

export async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection verification successful.');
    return true;
  } catch (error) {
    console.error('Database connection verification failed:', error.message);
    throw error;
  }
}