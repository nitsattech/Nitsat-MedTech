import { OTProcedure } from './otProcedure.model.js';
import { addBillingItem } from '../billing/billing.service.js';

export async function createProcedure(payload, userId) {
  const procedure = await OTProcedure.create({
    visitType: payload.visitType,
    referenceId: payload.referenceId,
    patientId: payload.patientId,
    surgeonId: payload.surgeonId,
    anesthetistId: payload.anesthetistId,
    procedureName: payload.procedureName,
    otRoom: payload.otRoom,
    scheduledAt: payload.scheduledAt,
    notes: payload.notes,
    createdBy: userId,
  });

  if (payload.chargeAmount) {
    const chargeAmount = Number(payload.chargeAmount);
    await addBillingItem(
      {
        patientId: payload.patientId,
        referenceType: payload.visitType === 'opd' ? 'opd_visit' : 'ipd_admission',
        referenceId: payload.referenceId,
        department: 'ot',
        itemType: 'ot',
        description: payload.procedureName,
        quantity: 1,
        unitPrice: chargeAmount,
        amount: chargeAmount,
      },
      userId
    );
  }

  return procedure;
}

export async function listProcedures(filters) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.patientId) query.patientId = filters.patientId;
  if (filters.referenceId) query.referenceId = filters.referenceId;

  return OTProcedure.find(query)
    .populate('patientId', 'uhid firstName lastName')
    .populate('surgeonId', 'name role')
    .sort({ scheduledAt: -1 });
}

export async function updateProcedure(procedureId, payload, userId) {
  return OTProcedure.findByIdAndUpdate(
    procedureId,
    {
      ...payload,
      updatedBy: userId,
    },
    { new: true }
  );
}
