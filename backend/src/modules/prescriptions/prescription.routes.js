import { Router } from 'express';
import { createPrescriptionController, listPrescriptionController } from './prescription.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorizeRoles('admin', 'doctor', 'pharmacist', 'nurse'), listPrescriptionController);
router.post('/', authorizeRoles('admin', 'doctor'), createPrescriptionController);

export default router;
