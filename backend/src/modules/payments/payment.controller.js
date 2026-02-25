import { asyncHandler } from '../../utils/asyncHandler.js';
import { collectPayment, listPayments } from './payment.service.js';

export const collectPaymentController = asyncHandler(async (req, res) => {
  const result = await collectPayment(req.body, req.user._id);
  res.status(201).json(result);
});

export const listPaymentsController = asyncHandler(async (req, res) => {
  const payments = await listPayments(req.query);
  res.json(payments);
});
