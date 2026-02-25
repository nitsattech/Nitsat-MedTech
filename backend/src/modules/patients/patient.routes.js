import { Router } from 'express';
import { createPatientController, listPatientsController } from './patient.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorizeRoles('admin', 'receptionist', 'doctor', 'nurse', 'accountant'), listPatientsController);
router.post('/', authorizeRoles('admin', 'receptionist'), createPatientController);

export default router;
