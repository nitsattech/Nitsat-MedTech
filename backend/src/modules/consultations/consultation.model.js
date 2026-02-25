import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
    visitType: { type: String, enum: ['opd', 'ipd'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symptoms: String,
    diagnosis: String,
    advice: String,
    followUpDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Consultation = mongoose.model('Consultation', consultationSchema);
