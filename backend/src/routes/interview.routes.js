import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createInterviewSchema } from '../validators/interview.validator.js';
import { submitAnswerSchema } from '../validators/answer.validator.js';
import { handleAudioUpload } from '../middleware/audioUpload.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createInterviewHandler,
  listInterviews,
  getInterview,
  generateQuestions,
} from '../controllers/interview.controller.js';
import {
  getSession,
  startInterview,
  submitAnswer,
  transcribeAudio,
} from '../controllers/interviewSession.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createInterviewSchema), asyncHandler(createInterviewHandler));
router.get('/', asyncHandler(listInterviews));
router.get('/:id', asyncHandler(getInterview));
router.post('/:id/questions', asyncHandler(generateQuestions));

router.get('/:id/session', asyncHandler(getSession));
router.post('/:id/start', asyncHandler(startInterview));
router.post('/:id/answers', validate(submitAnswerSchema), asyncHandler(submitAnswer));
router.post('/:id/transcribe', handleAudioUpload, asyncHandler(transcribeAudio));

export default router;