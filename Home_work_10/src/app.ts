import express, {
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from 'express';
import { errorMiddleware } from './http/error-middleware.js';
import { NotFoundError } from './http/errors.js';

export const createApp = (routers: { entries: Router; stats: Router }) => {
  const app = express();
  app.use(express.json());
  app.use('/entries', routers.entries);
  app.use('/stats', routers.stats);
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError());
  });
  app.use(errorMiddleware);
  return app;
};
