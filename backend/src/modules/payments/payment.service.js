import { Payment } from './payment.model.js';
import { refreshBillingStatuses } from '../billing/billing.service.js';
import { validateClinicalReference } from '../workflow/reference.service.js';
import { HMS_EVENTS, hmsEventBus } from '../../utils/eventBus.js';

export async function collectPayment(payload, userId) {
  await validateClinicalReference(payload.referenceType, payload.referenceId, payload.patientId);

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

  const ledger = await refreshBillingStatuses(payload.referenceType, payload.referenceId);

  hmsEventBus.emit(HMS_EVENTS.PAYMENT_COLLECTED, {
    paymentId: payment._id,
    patientId: payment.patientId,
    referenceType: payment.referenceType,
    referenceId: payment.referenceId,
    amount: payment.amount,
    paymentMode: payment.paymentMode,
    ledgerSummary: ledger.summary,
  });

  return { payment, ledger };
}

export async function listPayments(filters) {
  const query = {};
  if (filters.referenceType) query.referenceType = filters.referenceType;
  if (filters.referenceId) query.referenceId = filters.referenceId;
  if (filters.patientId) query.patientId = filters.patientId;
  return Payment.find(query).sort({ createdAt: -1 });
}
