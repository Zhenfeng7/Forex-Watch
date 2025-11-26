import { Router } from 'express';
import { getLatestRateHandler } from '../controllers/rateController.js';

const router = Router();

// Public endpoint: returns the latest fetched rate from cache (no live provider call).
router.get('/latest', getLatestRateHandler);

export default router;
