import { Router } from 'express';

import { paramValidatorMiddleware } from './middlewares';

import {
  createShortURL,
  deleteShortURL,
  getAllShortURLs,
  getURLStatistics,
  retrieveOriginalURL,
  updateShortURL,
} from './controllers';
import { limiters } from './rateLimiter';

const router = Router();

router.get('/', getAllShortURLs);
router.post('/', limiters.createLink, createShortURL);

router.get('/:shortCode', limiters.getLink, paramValidatorMiddleware, retrieveOriginalURL);
router.get('/:shortCode/stats', limiters.getStats, paramValidatorMiddleware, getURLStatistics);

router.put('/:shortCode', limiters.modify, paramValidatorMiddleware, updateShortURL);

router.delete('/:shortCode', limiters.modify, paramValidatorMiddleware, deleteShortURL);

export default router;
