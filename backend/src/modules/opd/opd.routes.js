import { Router } from 'express';
import {
  closeOpdVisitController,
  createOpdVisitController,
  listOpdVisitsController,
  queueController,
  updateVisitStatusController,
} from './opd.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/visits', authorizeRoles('receptionist', 'doctor', 'nurse'), listOpdVisitsController);
router.post('/visits', authorizeRoles('receptionist'), createOpdVisitController);
router.patch('/visits/:id/status', authorizeRoles('receptionist', 'doctor'), updateVisitStatusController);
router.post('/visits/:id/close', authorizeRoles('receptionist', 'doctor'), closeOpdVisitController);
router.get('/queue', authorizeRoles('receptionist', 'doctor', 'nurse'), queueController);

export default router;
