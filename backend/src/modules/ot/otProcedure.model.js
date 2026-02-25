import mongoose from 'mongoose';

const otProcedureSchema = new mongoose.Schema(
  {
    visitType: { type: String, enum: ['opd', 'ipd'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    surgeonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    anesthetistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    procedureName: { type: String, required: true },
    otRoom: { type: String },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

otProcedureSchema.index({ status: 1, scheduledAt: 1 });

export const OTProcedure = mongoose.model('OTProcedure', otProcedureSchema);
