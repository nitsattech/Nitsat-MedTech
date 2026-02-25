import { Router } from 'express';
import { getConsultationController, upsertConsultationController } from './consultation.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/', authorizeRoles('doctor', 'nurse'), getConsultationController);
router.post('/', authorizeRoles('doctor'), upsertConsultationController);

export default router;
