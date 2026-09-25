import { Router } from 'express';
import { listRoles } from '../controllers/roles.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(listRoles));

export default router;