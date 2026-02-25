import { asyncHandler } from '../../utils/asyncHandler.js';
import { createOrApproveDischarge, listDischarges } from './discharge.service.js';

export const createDischargeController = asyncHandler(async (req, res) => {
  const data = await createOrApproveDischarge(req.body, req.user._id, req.user.role);
  res.json(data);
});

export const listDischargeController = asyncHandler(async (req, res) => {
  const data = await listDischarges(req.query);
  res.json(data);
});
