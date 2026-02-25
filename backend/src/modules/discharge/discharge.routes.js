import { Router } from 'express';
import { createDischargeController, listDischargeController } from './discharge.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/', authorizeRoles('doctor', 'nurse', 'accountant'), listDischargeController);
router.post('/', authorizeRoles('doctor', 'accountant'), createDischargeController);

export default router;
