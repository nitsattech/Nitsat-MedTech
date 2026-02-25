import { Router } from 'express';
import { addBillingItemController, getLedgerController } from './billing.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/', authorizeRoles('receptionist', 'doctor', 'nurse', 'accountant', 'pharmacist'), getLedgerController);
router.post('/', authorizeRoles('accountant'), addBillingItemController);

export default router;
