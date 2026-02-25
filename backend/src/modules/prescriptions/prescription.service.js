import { Prescription } from './prescription.model.js';

export async function createPrescription(payload, userId) {
  return Prescription.create({ ...payload, createdBy: userId });
}

export async function listPrescriptions(filters) {
  const query = {};
  if (filters.referenceId) query.referenceId = filters.referenceId;
  if (filters.patientId) query.patientId = filters.patientId;
  return Prescription.find(query).sort({ createdAt: -1 });
}
