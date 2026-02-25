import { ApiError } from '../../utils/apiError.js';
import { IPDAdmission } from './ipdAdmission.model.js';
import { getLedger } from '../billing/billing.service.js';
import { HMS_EVENTS, hmsEventBus } from '../../utils/eventBus.js';

export async function createAdmission(payload, userId) {
  const count = await IPDAdmission.countDocuments();
  const admissionNo = `IPD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const admission = await IPDAdmission.create({
    patientId: payload.patientId,
    admissionNo,
    admissionDate: payload.admissionDate || new Date(),
    attendingDoctorId: payload.attendingDoctorId,
    ward: payload.ward,
    bedNumber: payload.bedNumber,
    provisionalDiagnosis: payload.provisionalDiagnosis,
    createdBy: userId,
  });

  hmsEventBus.emit(HMS_EVENTS.IPD_ADMISSION_CREATED, {
    admissionId: admission._id,
    patientId: admission.patientId,
    attendingDoctorId: admission.attendingDoctorId,
    ward: admission.ward,
    bedNumber: admission.bedNumber,
  });

  return admission;
}


export async function listAdmissions(filters) {
  const query = {};
  if (filters.patientId) query.patientId = filters.patientId;
  if (filters.status) query.status = filters.status;
  return IPDAdmission.find(query)
    .populate('patientId', 'uhid firstName lastName phone')
    .populate('attendingDoctorId', 'fullName')
    .sort({ admissionDate: -1 });
}

export async function dischargeAdmission(admissionId) {
  const admission = await IPDAdmission.findById(admissionId);
  if (!admission) throw new ApiError(404, 'Admission not found');

  const ledger = await getLedger('ipd_admission', admissionId);
  if (ledger.summary.due > 0) {
    throw new ApiError(400, 'Cannot discharge while billing due exists');
  }

  admission.status = 'discharged';
  await admission.save();

  return { admission, ledger };
}
