import mongoose from 'mongoose';

const opdVisitSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, default: 'OPD' },
    visitDate: { type: Date, required: true },
    tokenNumber: { type: Number, required: true },
    consultationFee: { type: Number, default: 0 },
    status: { type: String, enum: ['waiting', 'in_consultation', 'completed', 'cancelled'], default: 'waiting' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

opdVisitSchema.index({ visitDate: 1, tokenNumber: 1 }, { unique: true });

export const OPDVisit = mongoose.model('OPDVisit', opdVisitSchema);
