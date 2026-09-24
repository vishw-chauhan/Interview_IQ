import { testConnection } from '../config/db.js';
import { formatError } from '../utils/formatError.js';

export async function getHealth(req, res) {
  const serverTime = new Date().toISOString();

  try {
    await testConnection();
    return res.status(200).json({
      success: true,
      data: { api: 'ok', database: 'connected', serverTime },
    });
  } catch (error) {
    console.error('Health check: database unavailable -', formatError(error));
    return res.status(503).json({
      success: false,
      message: 'The server is running but the database is unavailable.',
      data: { api: 'ok', database: 'unavailable', serverTime },
    });
  }
}