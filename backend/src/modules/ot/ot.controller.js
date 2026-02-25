import { asyncHandler } from '../../utils/asyncHandler.js';
import { createProcedure, listProcedures, updateProcedure } from './ot.service.js';

export const createProcedureController = asyncHandler(async (req, res) => {
  const procedure = await createProcedure(req.body, req.user._id);
  res.status(201).json(procedure);
});

export const listProceduresController = asyncHandler(async (req, res) => {
  const procedures = await listProcedures(req.query);
  res.json(procedures);
});

export const updateProcedureController = asyncHandler(async (req, res) => {
  const procedure = await updateProcedure(req.params.id, req.body, req.user._id);
  res.json(procedure);
});
