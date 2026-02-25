import { ApiError } from '../../utils/apiError.js';
import { DischargeSummary } from './dischargeSummary.model.js';
import { IPDAdmission } from '../ipd/ipdAdmission.model.js';
import { getLedger } from '../billing/billing.service.js';

export async function createOrApproveDischarge(payload, userId) {
  const admission = await IPDAdmission.findById(payload.admissionId);
  if (!admission) throw new ApiError(404, 'Admission not found');

  const ledger = await getLedger('ipd_admission', payload.admissionId);
  const billingClearance = ledger.summary.due === 0;

  const doc = await DischargeSummary.findOneAndUpdate(
    { admissionId: payload.admissionId },
    {
      patientId: admission.patientId,
      doctorId: payload.doctorId,
      finalDiagnosis: payload.finalDiagnosis,
      treatmentSummary: payload.treatmentSummary,
      dischargeAdvice: payload.dischargeAdvice,
      pharmacyClearance: Boolean(payload.pharmacyClearance),
      doctorApproval: Boolean(payload.doctorApproval),
      billingClearance,
      dischargeDate: payload.dischargeDate,
      createdBy: userId,
    },
    { new: true, upsert: true }
  );

  if (doc.pharmacyClearance && doc.doctorApproval && doc.billingClearance) {
    admission.status = 'discharged';
    await admission.save();
  }

  return { discharge: doc, canDischarge: doc.pharmacyClearance && doc.doctorApproval && doc.billingClearance };
}

export async function listDischarges(filters) {
  const query = {};
  if (filters.admissionId) query.admissionId = filters.admissionId;
  if (filters.patientId) query.patientId = filters.patientId;

  return DischargeSummary.find(query)
    .populate('patientId', 'uhid firstName lastName')
    .populate('doctorId', 'fullName')
    .sort({ createdAt: -1 });
}
