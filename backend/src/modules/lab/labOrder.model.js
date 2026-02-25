import mongoose from 'mongoose';

const labOrderSchema = new mongoose.Schema(
  {
    visitType: { type: String, enum: ['opd', 'ipd'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, enum: ['pathology', 'radiology', 'investigation'], required: true },
    testName: { type: String, required: true },
    status: {
      type: String,
      enum: ['ordered', 'sample_collected', 'completed', 'report_uploaded', 'cancelled'],
      default: 'ordered',
    },
    reportUrl: String,
    resultSummary: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const LabOrder = mongoose.model('LabOrder', labOrderSchema);
