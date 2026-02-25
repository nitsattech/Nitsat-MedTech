import { Router } from 'express';
import {
  closeOpdVisitController,
  createOpdVisitController,
  listOpdVisitsController,
  queueController,
  updateVisitStatusController,
} from './opd.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/visits', authorizeRoles('admin', 'receptionist', 'doctor', 'nurse'), listOpdVisitsController);
router.post('/visits', authorizeRoles('admin', 'receptionist'), createOpdVisitController);
router.patch('/visits/:id/status', authorizeRoles('admin', 'receptionist', 'doctor'), updateVisitStatusController);
router.post('/visits/:id/close', authorizeRoles('admin', 'receptionist', 'doctor'), closeOpdVisitController);
router.get('/queue', authorizeRoles('admin', 'receptionist', 'doctor', 'nurse'), queueController);

export default router;
