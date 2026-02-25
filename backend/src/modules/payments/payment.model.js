import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    referenceType: { type: String, enum: ['opd_visit', 'ipd_admission'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'insurance'], required: true },
    paymentStatus: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    transactionRef: String,
    notes: String,
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
