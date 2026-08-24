import express, { Express } from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';
import { apiLimiter } from './middlewares/RateLimit';

export function createApp(): Express {
  const app: Express = express();
  app.use(express.json());
  app.use(cors());
  app.use(apiLimiter);

  registerRoutes(app);

  return app;
}
