import type { NextFunction, Request, Response } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
type RequestHandlerLike = (req: Request, res: Response, next: NextFunction) => void;

export const asyncHandler = (handler: AsyncRequestHandler): RequestHandlerLike => (req, res, next) => {
  handler(req, res, next).catch(next);
};
