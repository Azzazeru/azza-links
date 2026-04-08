import type { Application, Request, Response } from 'express';
import cors from 'cors';
import express from 'express';

import urlRoutes from './routes';

interface RateLimitError extends Error {
  status: number;
  retryAfter: number;
}

const app: Application = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));

app.use(express.json());

app.use('/shorten', urlRoutes);

app.use((err: RateLimitError, _req: Request, res: Response, _next: any) => {
  if (err.status === 429) {
    return res.status(429).json({
      error: err.message,
      retryAfter: err.retryAfter
    })
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World');
});

export default app;
