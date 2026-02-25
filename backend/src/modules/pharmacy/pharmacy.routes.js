import { Router } from 'express';
import { createPharmacyOrderController, issuePharmacyOrderController, listPharmacyOrdersController } from './pharmacy.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/orders', authorizeRoles('doctor', 'pharmacist'), listPharmacyOrdersController);
router.post('/orders', authorizeRoles('doctor', 'pharmacist'), createPharmacyOrderController);
router.post('/orders/:id/issue', authorizeRoles('pharmacist'), issuePharmacyOrderController);

export default router;
