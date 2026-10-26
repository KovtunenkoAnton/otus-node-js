import type { Router } from 'express';
import { createEntriesController } from './controllers/entries.controller.js';
import { createStatsController } from './controllers/stats.controller.js';
import { EntriesRepository } from './repositories/entries.repository.js';
import { createEntriesRouter } from './routes/entries.js';
import { createStatsRouter } from './routes/stats.js';
import { EntriesService } from './services/entries.service.js';
import { StatsService } from './services/stats.service.js';

export const createRouters = (): { entries: Router; stats: Router } => {
  const entriesRepository = new EntriesRepository();
  const entriesService = new EntriesService(entriesRepository);
  const statsService = new StatsService(entriesRepository);

  return {
    entries: createEntriesRouter(createEntriesController(entriesService)),
    stats: createStatsRouter(createStatsController(statsService)),
  };
};
