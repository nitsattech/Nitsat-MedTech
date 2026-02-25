import { PharmacyOrder } from './pharmacyOrder.model.js';
import { addBillingItem } from '../billing/billing.service.js';

export async function createPharmacyOrder(payload, userId) {
  const items = (payload.items || []).map((item) => ({
    medicineId: item.medicineId,
    medicineName: item.medicineName,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    amount: Number(item.quantity) * Number(item.unitPrice),
  }));

  const order = await PharmacyOrder.create({
    visitType: payload.visitType,
    referenceId: payload.referenceId,
    patientId: payload.patientId,
    prescriptionId: payload.prescriptionId,
    items,
    createdBy: userId,
  });

  for (const item of items) {
    await addBillingItem(
      {
        patientId: payload.patientId,
        referenceType: payload.visitType === 'opd' ? 'opd_visit' : 'ipd_admission',
        referenceId: payload.referenceId,
        department: 'pharmacy',
        itemType: 'medicine',
        description: item.medicineName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      },
      userId
    );
  }

  return order;
}

export async function issuePharmacyOrder(orderId, userId) {
  return PharmacyOrder.findByIdAndUpdate(
    orderId,
    { status: 'issued', issuedBy: userId },
    { new: true }
  );
}

export async function listPharmacyOrders(filters) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.patientId) query.patientId = filters.patientId;
  return PharmacyOrder.find(query)
    .populate('patientId', 'uhid firstName lastName')
    .sort({ createdAt: -1 });
}
