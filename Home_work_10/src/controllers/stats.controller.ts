import type { Request, Response } from 'express';
import type { StatsService } from '../services/stats.service.js';

export const createStatsController = (statsService: StatsService) => ({
  getStats: async (_req: Request, res: Response): Promise<void> => {
    res.json(await statsService.getStats());
  },
});

export type StatsController = ReturnType<typeof createStatsController>;
