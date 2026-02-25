import { LabOrder } from './labOrder.model.js';
import { addBillingItem } from '../billing/billing.service.js';

export async function createLabOrder(payload, userId) {
  const order = await LabOrder.create({
    visitType: payload.visitType,
    referenceId: payload.referenceId,
    patientId: payload.patientId,
    orderedBy: payload.orderedBy || userId,
    department: payload.department,
    testName: payload.testName,
    createdBy: userId,
  });

  if (payload.chargeAmount) {
    await addBillingItem(
      {
        patientId: payload.patientId,
        referenceType: payload.visitType === 'opd' ? 'opd_visit' : 'ipd_admission',
        referenceId: payload.referenceId,
        department: payload.department === 'radiology' ? 'radiology' : 'lab',
        itemType: 'lab',
        description: payload.testName,
        quantity: 1,
        unitPrice: payload.chargeAmount,
        amount: payload.chargeAmount,
      },
      userId
    );
  }

  return order;
}

export async function listLabOrders(filters) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.patientId) query.patientId = filters.patientId;
  if (filters.referenceId) query.referenceId = filters.referenceId;
  if (filters.department) query.department = filters.department;

  return LabOrder.find(query)
    .populate('patientId', 'uhid firstName lastName')
    .sort({ createdAt: -1 });
}

export async function updateLabOrder(orderId, payload) {
  return LabOrder.findByIdAndUpdate(orderId, payload, { new: true });
}
