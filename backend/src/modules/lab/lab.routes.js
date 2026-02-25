import { Router } from 'express';
import { createLabOrderController, listLabOrdersController, updateLabOrderController } from './lab.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/orders', authorizeRoles('doctor', 'lab_technician'), listLabOrdersController);
router.post('/orders', authorizeRoles('doctor'), createLabOrderController);
router.patch('/orders/:id', authorizeRoles('doctor', 'lab_technician'), updateLabOrderController);

export default router;
