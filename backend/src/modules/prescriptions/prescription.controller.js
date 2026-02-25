import { asyncHandler } from '../../utils/asyncHandler.js';
import { createPrescription, listPrescriptions } from './prescription.service.js';

export const createPrescriptionController = asyncHandler(async (req, res) => {
  const data = await createPrescription(req.body, req.user._id);
  res.status(201).json(data);
});

export const listPrescriptionController = asyncHandler(async (req, res) => {
  const data = await listPrescriptions(req.query);
  res.json(data);
});
