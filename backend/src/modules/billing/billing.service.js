import mongoose from 'mongoose';
import { BillingItem } from './billingItem.model.js';
import { Payment } from '../payments/payment.model.js';
import { validateClinicalReference } from '../workflow/reference.service.js';
import { HMS_EVENTS, hmsEventBus } from '../../utils/eventBus.js';

export async function addBillingItem(payload, userId) {
  const quantity = Number(payload.quantity || 1);
  const unitPrice = Number(payload.unitPrice || 0);
  const amount = Number(payload.amount ?? quantity * unitPrice);

  await validateClinicalReference(payload.referenceType, payload.referenceId, payload.patientId);

  const item = await BillingItem.create({
    patientId: payload.patientId,
    referenceType: payload.referenceType,
    referenceId: payload.referenceId,
    department: payload.department,
    itemType: payload.itemType,
    description: payload.description,
    quantity,
    unitPrice,
    amount,
    status: 'unpaid',
    createdBy: userId,
  });

  hmsEventBus.emit(HMS_EVENTS.BILLING_ITEM_ADDED, {
    billingItemId: item._id,
    patientId: item.patientId,
    referenceType: item.referenceType,
    referenceId: item.referenceId,
    amount: item.amount,
    department: item.department,
  });

  return item;
}

export async function getLedger(referenceType, referenceId) {
  const refObjectId = new mongoose.Types.ObjectId(referenceId);
  const items = await BillingItem.find({ referenceType, referenceId: refObjectId }).sort({ createdAt: 1 });
  const payments = await Payment.find({ referenceType, referenceId: refObjectId, paymentStatus: 'success' }).sort({ createdAt: 1 });

  const total = items.filter((i) => i.status !== 'cancelled').reduce((s, i) => s + i.amount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const due = Math.max(0, total - paid);

  const summary = {
    total,
    paid,
    due,
    status: due === 0 && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
  };

  return {
    items,
    payments,
    summary,
  };
}

export async function refreshBillingStatuses(referenceType, referenceId) {
  const ledger = await getLedger(referenceType, referenceId);
  const nextStatus = ledger.summary.due === 0 && ledger.summary.total > 0 ? 'paid' : 'unpaid';

  await BillingItem.updateMany(
    {
      referenceType,
      referenceId: new mongoose.Types.ObjectId(referenceId),
      status: { $ne: 'cancelled' },
    },
    { $set: { status: nextStatus } }
  );

  hmsEventBus.emit(HMS_EVENTS.LEDGER_UPDATED, {
    referenceType,
    referenceId,
    summary: ledger.summary,
  });

  return ledger;
}
