import type { NextFunction, Request, Response } from 'express';

export const paramValidatorMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const shortCode: string = _req.params.shortCode;
    if (!shortCode) {
      res.status(400).json({ error: 'Short code is required' });
      return;
    }

    res.locals.shortCode = shortCode;

    next();
  } catch (error) {
    next(error);
  }
};
