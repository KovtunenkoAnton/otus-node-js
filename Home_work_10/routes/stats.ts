import { Router } from 'express';
import { getStats } from '../controllers/statsController';

const router = Router();

router.route("/").get(getStats);

export { router };
