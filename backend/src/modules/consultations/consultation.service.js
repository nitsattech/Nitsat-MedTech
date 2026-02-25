import { Consultation } from './consultation.model.js';

export async function upsertConsultation(payload, userId) {
  return Consultation.findOneAndUpdate(
    { visitType: payload.visitType, referenceId: payload.referenceId },
    {
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      symptoms: payload.symptoms,
      diagnosis: payload.diagnosis,
      advice: payload.advice,
      followUpDate: payload.followUpDate,
      createdBy: userId,
    },
    { new: true, upsert: true }
  );
}

export async function getConsultation(visitType, referenceId) {
  return Consultation.findOne({ visitType, referenceId });
}
