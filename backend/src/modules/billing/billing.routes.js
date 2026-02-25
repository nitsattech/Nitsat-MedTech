import { Router } from 'express';
import { addBillingItemController, getLedgerController } from './billing.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorizeRoles('admin', 'receptionist', 'doctor', 'nurse', 'accountant'), getLedgerController);
router.post('/', authorizeRoles('admin', 'receptionist', 'doctor', 'nurse', 'lab_technician', 'pharmacist'), addBillingItemController);

export default router;
