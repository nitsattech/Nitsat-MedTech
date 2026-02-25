import { ApiError } from '../../utils/apiError.js';
import { DischargeSummary } from './dischargeSummary.model.js';
import { IPDAdmission } from '../ipd/ipdAdmission.model.js';
import { getLedger } from '../billing/billing.service.js';
import { HMS_EVENTS, hmsEventBus } from '../../utils/eventBus.js';

export async function createOrApproveDischarge(payload, userId, userRole) {
  const admission = await IPDAdmission.findById(payload.admissionId);
  if (!admission) throw new ApiError(404, 'Admission not found');

  const ledger = await getLedger('ipd_admission', payload.admissionId);
  const billingClearance = ledger.summary.due === 0;
  const wantsOverride = Boolean(payload.billingOverrideApproved);

  if (wantsOverride && !['admin', 'accountant'].includes(userRole)) {
    throw new ApiError(403, 'Billing override can only be approved by admin/accountant');
  }

  const overridePayload = wantsOverride
    ? {
        billingOverrideApproved: true,
        billingOverrideReason: payload.billingOverrideReason,
        billingOverrideApprovedBy: userId,
      }
    : {};

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
      ...overridePayload,
    },
    { new: true, upsert: true }
  );

  const billingGatePassed = doc.billingClearance || doc.billingOverrideApproved;
  if (doc.pharmacyClearance && doc.doctorApproval && billingGatePassed) {
    admission.status = 'discharged';
    await admission.save();

    hmsEventBus.emit(HMS_EVENTS.DISCHARGE_APPROVED, {
      admissionId: admission._id,
      patientId: admission.patientId,
      billingClearance: doc.billingClearance,
      billingOverrideApproved: doc.billingOverrideApproved,
    });
  }

  return {
    discharge: doc,
    canDischarge: doc.pharmacyClearance && doc.doctorApproval && billingGatePassed,
    ledger: ledger.summary,
  };
}

export async function listDischarges(filters) {
  const query = {};
  if (filters.admissionId) query.admissionId = filters.admissionId;
  if (filters.patientId) query.patientId = filters.patientId;

  return DischargeSummary.find(query)
    .populate('patientId', 'uhid firstName lastName')
    .populate('doctorId', 'fullName')
    .populate('billingOverrideApprovedBy', 'fullName role')
    .sort({ createdAt: -1 });
}
