import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createInterviewSchema } from '../validators/interview.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createInterviewHandler,
  listInterviews,
  getInterview,
  generateQuestions,
} from '../controllers/interview.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createInterviewSchema), asyncHandler(createInterviewHandler));
router.get('/', asyncHandler(listInterviews));
router.get('/:id', asyncHandler(getInterview));
router.post('/:id/questions', asyncHandler(generateQuestions));

export default router;