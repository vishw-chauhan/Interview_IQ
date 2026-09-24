import app from './app.js';
import { env } from './config/env.js';
import { pool, testConnection } from './config/db.js';
import { formatError } from './utils/formatError.js';

async function start() {
  try {
    await testConnection();
    console.log(`PostgreSQL connected (${env.db.name} on ${env.db.host}:${env.db.port})`);
  } catch (error) {
    console.error(`Could not connect to PostgreSQL: ${formatError(error)}`);
    console.error('Check the DB_* values in backend/.env and make sure the PostgreSQL service is running.');
    await pool.end();
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`InterviewIQ API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use. Change PORT in backend/.env or stop the other process.`);
    } else {
      console.error('Server error:', formatError(error));
    }
    process.exit(1);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();