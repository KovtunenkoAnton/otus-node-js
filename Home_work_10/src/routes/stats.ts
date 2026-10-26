import express, { type Router } from 'express';
import type { StatsController } from '../controllers/stats.controller.js';
import { asyncHandler } from '../http/async-handler.js';

export const createStatsRouter = (controller: StatsController): Router => {
  const router = express.Router();
  router.get('/', asyncHandler(controller.getStats));
  return router;
};
