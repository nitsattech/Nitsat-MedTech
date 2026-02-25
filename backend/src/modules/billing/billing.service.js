import mongoose from 'mongoose';
import { BillingItem } from './billingItem.model.js';
import { Payment } from '../payments/payment.model.js';

export async function addBillingItem(payload, userId) {
  const quantity = Number(payload.quantity || 1);
  const unitPrice = Number(payload.unitPrice || 0);
  const amount = Number(payload.amount ?? quantity * unitPrice);

  return BillingItem.create({
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
}

export async function getLedger(referenceType, referenceId) {
  const refObjectId = new mongoose.Types.ObjectId(referenceId);
  const items = await BillingItem.find({ referenceType, referenceId: refObjectId }).sort({ createdAt: 1 });
  const payments = await Payment.find({ referenceType, referenceId: refObjectId, paymentStatus: 'success' }).sort({ createdAt: 1 });

  const total = items.filter((i) => i.status !== 'cancelled').reduce((s, i) => s + i.amount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const due = Math.max(0, total - paid);

  return {
    items,
    payments,
    summary: {
      total,
      paid,
      due,
      status: due === 0 && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
    },
  };
}
