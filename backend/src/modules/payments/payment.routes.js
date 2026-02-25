import { Router } from 'express';
import { collectPaymentController, listPaymentsController } from './payment.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/', authorizeRoles('accountant', 'receptionist'), listPaymentsController);
router.post('/', authorizeRoles('accountant', 'receptionist'), collectPaymentController);

export default router;
