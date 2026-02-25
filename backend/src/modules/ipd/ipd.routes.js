import { Router } from 'express';
import { createAdmissionController, dischargeAdmissionController, listAdmissionsController } from './ipd.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/admissions', authorizeRoles('admin', 'receptionist', 'doctor', 'nurse'), listAdmissionsController);
router.post('/admissions', authorizeRoles('admin', 'receptionist'), createAdmissionController);
router.post('/admissions/:id/discharge', authorizeRoles('admin', 'doctor', 'receptionist'), dischargeAdmissionController);

export default router;
