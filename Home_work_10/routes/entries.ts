import { Router } from 'express';
import { createEntry, deleteEntry, getEntriesList, getEntry, updateEntry } from '../controllers/entriesController';

const router = Router();

router.route("/")
    .get(getEntriesList)
    .post(createEntry)

router.route('/:id')
    .get(getEntry)
    .patch(updateEntry)
    .delete(deleteEntry)

export { router };
