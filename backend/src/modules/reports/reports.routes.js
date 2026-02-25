import { Router } from 'express';
import { getMISDashboardController } from './reports.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/mis', authorizeRoles('admin', 'accountant', 'receptionist'), getMISDashboardController);

export default router;
