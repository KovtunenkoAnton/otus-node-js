import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errors.js';

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, ...(err.details ? { details: [...err.details] } : {}) },
    });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
};
