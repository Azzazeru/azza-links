import type { Request, Response } from 'express';

import {
  createShortURLService,
  deleteShortURLService,
  getAllURLsService,
  getURLStatisticsService,
  retrieveOriginalURLService,
  updateShortURLService,
} from './services';

export const createShortURL = async (_req: Request, res: Response): Promise<void> => {
  try {
    const urlInput: string = _req.body.url;
    const response = await createShortURLService(urlInput);
    if (!response) res.status(400).json({ error: 'Failed to create short url' });

    res.status(200).json(response);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
};

export const retrieveOriginalURL = async (_req: Request, res: Response): Promise<void> => {
  try {
    const shortCode: string = res.locals.shortCode;
    const originalUrl: string = await retrieveOriginalURLService(shortCode);
    res.redirect(originalUrl);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
};

export const updateShortURL = async (_req: Request, res: Response): Promise<void> => {
  try {
    const shortCode: string = res.locals.shortCode;
    const newUrl: string = _req.body.newUrl;

    const updatedUrl = await updateShortURLService(shortCode, newUrl);
    if (!updatedUrl) res.status(400).json({ error: 'Failed to update short url' });

    res.status(200).json(updatedUrl);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
};

export const deleteShortURL = async (_req: Request, res: Response): Promise<void> => {
  try {
    const shortCode: string = res.locals.shortCode;
    await deleteShortURLService(shortCode);
    res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
};

export const getURLStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const shortCode: string = res.locals.shortCode;
    const statistics = await getURLStatisticsService(shortCode);
    if (!statistics) res.status(400).json({ error: 'Failed to get url statistics' });

    res.status(200).json(statistics);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
};

export const getAllShortURLs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const urls = await getAllURLsService();
    res.status(200).json(urls);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
};
