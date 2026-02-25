import mongoose from 'mongoose';

const dischargeSummarySchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    admissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission', required: true, unique: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    finalDiagnosis: String,
    treatmentSummary: String,
    dischargeAdvice: String,
    pharmacyClearance: { type: Boolean, default: false },
    billingClearance: { type: Boolean, default: false },
    billingOverrideApproved: { type: Boolean, default: false },
    billingOverrideReason: { type: String },
    billingOverrideApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctorApproval: { type: Boolean, default: false },
    dischargeDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const DischargeSummary = mongoose.model('DischargeSummary', dischargeSummarySchema);
