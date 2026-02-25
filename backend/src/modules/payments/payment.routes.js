import { Router } from 'express';
import { collectPaymentController, listPaymentsController } from './payment.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorizeRoles('admin', 'accountant', 'receptionist'), listPaymentsController);
router.post('/', authorizeRoles('admin', 'accountant', 'receptionist'), collectPaymentController);

export default router;
