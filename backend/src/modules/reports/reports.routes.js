import { Router } from 'express';
import { getMISDashboardController } from './reports.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/mis', authorizeRoles('accountant'), getMISDashboardController);

export default router;
