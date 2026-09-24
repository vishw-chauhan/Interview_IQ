import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve backend/.env path correctly from backend/src/config/env.js
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'Interview-IQ',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'vishesh123@',
  },
};