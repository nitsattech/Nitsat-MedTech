import { Router } from 'express';
import { getConsultationController, upsertConsultationController } from './consultation.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorizeRoles('admin', 'doctor', 'nurse'), getConsultationController);
router.post('/', authorizeRoles('admin', 'doctor'), upsertConsultationController);

export default router;
