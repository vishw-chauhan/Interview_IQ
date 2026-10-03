import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getProgressTrend } from '../controllers/history.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/trend', asyncHandler(getProgressTrend));

export default router;