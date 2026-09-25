import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { handleResumeUpload } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadResume, listResumes, getResume, deleteResume } from '../controllers/resume.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/upload', handleResumeUpload, asyncHandler(uploadResume));
router.get('/', asyncHandler(listResumes));
router.get('/:id', asyncHandler(getResume));
router.delete('/:id', asyncHandler(deleteResume));

export default router;