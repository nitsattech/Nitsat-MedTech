import { asyncHandler } from '../../utils/asyncHandler.js';
import { createAdmission, dischargeAdmission, listAdmissions } from './ipd.service.js';

export const createAdmissionController = asyncHandler(async (req, res) => {
  const admission = await createAdmission(req.body, req.user._id);
  res.status(201).json(admission);
});

export const listAdmissionsController = asyncHandler(async (req, res) => {
  const admissions = await listAdmissions(req.query);
  res.json(admissions);
});

export const dischargeAdmissionController = asyncHandler(async (req, res) => {
  const result = await dischargeAdmission(req.params.id);
  res.json(result);
});
