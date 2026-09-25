import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import rolesRoutes from './roles.routes.js';
import resumeRoutes from './resume.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/roles', rolesRoutes);
router.use('/resumes', resumeRoutes);

export default router;