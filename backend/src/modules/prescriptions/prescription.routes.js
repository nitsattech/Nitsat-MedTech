import { Router } from 'express';
import { createPrescriptionController, listPrescriptionController } from './prescription.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/', authorizeRoles('doctor', 'pharmacist', 'nurse'), listPrescriptionController);
router.post('/', authorizeRoles('doctor'), createPrescriptionController);

export default router;
