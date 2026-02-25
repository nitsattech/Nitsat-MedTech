import { ApiError } from '../../utils/apiError.js';
import { PharmacyOrder } from './pharmacyOrder.model.js';
import { addBillingItem } from '../billing/billing.service.js';
import { Prescription } from '../prescriptions/prescription.model.js';
import { HMS_EVENTS, hmsEventBus } from '../../utils/eventBus.js';
import { toReferenceTypeFromVisitType, validateClinicalReference } from '../workflow/reference.service.js';

export async function createPharmacyOrder(payload, userId) {
  const referenceType = toReferenceTypeFromVisitType(payload.visitType);
  await validateClinicalReference(referenceType, payload.referenceId, payload.patientId);

  if (!payload.prescriptionId) {
    throw new ApiError(400, 'prescriptionId is required for pharmacy order linkage');
  }

  const prescription = await Prescription.findById(payload.prescriptionId);
  if (!prescription) throw new ApiError(404, 'Prescription not found');

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
        referenceType,
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

  hmsEventBus.emit(HMS_EVENTS.PHARMACY_ORDER_CREATED, {
    pharmacyOrderId: order._id,
    prescriptionId: order.prescriptionId,
    patientId: order.patientId,
    referenceType,
    referenceId: order.referenceId,
    items: order.items,
  });

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
