import express, { type Router } from 'express';
import type { EntriesController } from '../controllers/entries.controller.js';
import { asyncHandler } from '../http/async-handler.js';

export const createEntriesRouter = (controller: EntriesController): Router => {
  const router = express.Router();
  router
    .route('/')
    .get(asyncHandler(controller.list))
    .post(asyncHandler(controller.create));
  router
    .route('/:id')
    .get(asyncHandler(controller.get))
    .patch(asyncHandler(controller.update))
    .delete(asyncHandler(controller.remove));
  return router;
};
