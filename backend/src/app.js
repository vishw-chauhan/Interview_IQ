import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

if (!env.isProduction) {
  app.use(morgan('dev'));
}

app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRoutes);

// These two must stay last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;