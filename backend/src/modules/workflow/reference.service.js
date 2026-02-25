import { ApiError } from '../../utils/apiError.js';
import { OPDVisit } from '../opd/opdVisit.model.js';
import { IPDAdmission } from '../ipd/ipdAdmission.model.js';

export async function validateClinicalReference(referenceType, referenceId, patientId) {
  if (!referenceType || !referenceId) {
    throw new ApiError(400, 'referenceType and referenceId are required');
  }

  if (referenceType === 'opd_visit') {
    const visit = await OPDVisit.findById(referenceId);
    if (!visit) throw new ApiError(404, 'OPD visit not found for provided referenceId');
    if (patientId && String(visit.patientId) !== String(patientId)) {
      throw new ApiError(400, 'Patient does not match OPD visit reference');
    }
    return { type: 'opd_visit', entity: visit };
  }

  if (referenceType === 'ipd_admission') {
    const admission = await IPDAdmission.findById(referenceId);
    if (!admission) throw new ApiError(404, 'IPD admission not found for provided referenceId');
    if (patientId && String(admission.patientId) !== String(patientId)) {
      throw new ApiError(400, 'Patient does not match IPD admission reference');
    }
    return { type: 'ipd_admission', entity: admission };
  }

  throw new ApiError(400, 'Invalid referenceType. Use opd_visit or ipd_admission');
}

export function toReferenceTypeFromVisitType(visitType) {
  return visitType === 'opd' ? 'opd_visit' : 'ipd_admission';
}
