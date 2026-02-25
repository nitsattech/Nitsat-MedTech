import { LabOrder } from './labOrder.model.js';
import { addBillingItem } from '../billing/billing.service.js';
import { HMS_EVENTS, hmsEventBus } from '../../utils/eventBus.js';
import { toReferenceTypeFromVisitType, validateClinicalReference } from '../workflow/reference.service.js';

export async function createLabOrder(payload, userId) {
  const referenceType = toReferenceTypeFromVisitType(payload.visitType);
  await validateClinicalReference(referenceType, payload.referenceId, payload.patientId);

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
        referenceType,
        referenceId: payload.referenceId,
        department: payload.department === 'radiology' ? 'radiology' : payload.department === 'pathology' ? 'pathology' : 'lab',
        itemType: 'lab',
        description: payload.testName,
        quantity: 1,
        unitPrice: payload.chargeAmount,
        amount: payload.chargeAmount,
      },
      userId
    );
  }

  hmsEventBus.emit(HMS_EVENTS.LAB_ORDER_CREATED, {
    labOrderId: order._id,
    patientId: order.patientId,
    referenceType,
    referenceId: order.referenceId,
    department: order.department,
    testName: order.testName,
  });

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
