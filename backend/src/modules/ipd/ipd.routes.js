import { Router } from 'express';
import { createAdmissionController, dischargeAdmissionController, listAdmissionsController } from './ipd.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/admissions', authorizeRoles('receptionist', 'doctor', 'nurse'), listAdmissionsController);
router.post('/admissions', authorizeRoles('receptionist'), createAdmissionController);
router.post('/admissions/:id/discharge', authorizeRoles('doctor'), dischargeAdmissionController);

export default router;
