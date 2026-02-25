import { Payment } from './payment.model.js';
import { getLedger } from '../billing/billing.service.js';

export async function collectPayment(payload, userId) {
  const payment = await Payment.create({
    patientId: payload.patientId,
    referenceType: payload.referenceType,
    referenceId: payload.referenceId,
    amount: Number(payload.amount),
    paymentMode: payload.paymentMode,
    paymentStatus: payload.paymentStatus || 'success',
    transactionRef: payload.transactionRef,
    notes: payload.notes,
    receivedBy: userId,
    createdBy: userId,
  });

  const ledger = await getLedger(payload.referenceType, payload.referenceId);
  return { payment, ledger };
}

export async function listPayments(filters) {
  const query = {};
  if (filters.referenceType) query.referenceType = filters.referenceType;
  if (filters.referenceId) query.referenceId = filters.referenceId;
  if (filters.patientId) query.patientId = filters.patientId;
  return Payment.find(query).sort({ createdAt: -1 });
}
