import { asyncHandler } from '../../utils/asyncHandler.js';
import { getConsultation, upsertConsultation } from './consultation.service.js';

export const upsertConsultationController = asyncHandler(async (req, res) => {
  const consultation = await upsertConsultation(req.body, req.user._id);
  res.json(consultation);
});

export const getConsultationController = asyncHandler(async (req, res) => {
  const consultation = await getConsultation(req.query.visitType, req.query.referenceId);
  res.json(consultation);
});
