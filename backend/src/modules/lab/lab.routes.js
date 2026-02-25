import { Router } from 'express';
import { createLabOrderController, listLabOrdersController, updateLabOrderController } from './lab.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/orders', authorizeRoles('admin', 'doctor', 'lab_technician', 'receptionist'), listLabOrdersController);
router.post('/orders', authorizeRoles('admin', 'doctor', 'receptionist'), createLabOrderController);
router.patch('/orders/:id', authorizeRoles('admin', 'lab_technician', 'doctor'), updateLabOrderController);

export default router;
