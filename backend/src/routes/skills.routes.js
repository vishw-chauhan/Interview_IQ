import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getSkillAnalysis, generateSkillAnalysis } from '../controllers/skills.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(getSkillAnalysis));
router.post('/analyze', asyncHandler(generateSkillAnalysis));

export default router;