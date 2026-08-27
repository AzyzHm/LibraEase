import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registerRoutes } from './routes';
import { apiLimiter } from './middlewares/RateLimit';
import { verifyCsrf } from './middlewares/Csrf';
import { config } from './config';

export function createApp(): Express {
  const app: Express = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(apiLimiter);
  app.use(verifyCsrf);

  registerRoutes(app);

  return app;
}
