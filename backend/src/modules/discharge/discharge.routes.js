import { Router } from 'express';
import { createDischargeController, listDischargeController } from './discharge.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorizeRoles('admin', 'doctor', 'receptionist', 'nurse', 'accountant'), listDischargeController);
router.post('/', authorizeRoles('admin', 'doctor', 'receptionist', 'accountant'), createDischargeController);

export default router;
