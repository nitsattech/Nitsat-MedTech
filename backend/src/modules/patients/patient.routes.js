import { Router } from 'express';
import { createPatientController, listPatientsController } from './patient.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/', authorizeRoles('receptionist', 'doctor', 'nurse', 'accountant'), listPatientsController);
router.post('/', authorizeRoles('receptionist'), createPatientController);

export default router;
