import { Router } from 'express';
import { createPharmacyOrderController, issuePharmacyOrderController, listPharmacyOrdersController } from './pharmacy.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/orders', authorizeRoles('admin', 'doctor', 'pharmacist', 'receptionist'), listPharmacyOrdersController);
router.post('/orders', authorizeRoles('admin', 'doctor', 'receptionist', 'pharmacist'), createPharmacyOrderController);
router.post('/orders/:id/issue', authorizeRoles('admin', 'pharmacist'), issuePharmacyOrderController);

export default router;
