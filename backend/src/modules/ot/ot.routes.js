import { Router } from 'express';
import { createProcedureController, listProceduresController, updateProcedureController } from './ot.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.get('/procedures', authorizeRoles('doctor', 'nurse'), listProceduresController);
router.post('/procedures', authorizeRoles('doctor'), createProcedureController);
router.patch('/procedures/:id', authorizeRoles('doctor', 'nurse'), updateProcedureController);

export default router;
