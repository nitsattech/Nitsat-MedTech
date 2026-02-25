import { Router } from 'express';
import { createProcedureController, listProceduresController, updateProcedureController } from './ot.controller.js';
import { authorizeRoles, protect } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/procedures', authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), listProceduresController);
router.post('/procedures', authorizeRoles('admin', 'doctor', 'receptionist'), createProcedureController);
router.patch('/procedures/:id', authorizeRoles('admin', 'doctor', 'nurse'), updateProcedureController);

export default router;
