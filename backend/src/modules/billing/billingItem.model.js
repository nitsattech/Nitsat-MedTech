import mongoose from 'mongoose';

const billingItemSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    referenceType: { type: String, enum: ['opd_visit', 'ipd_admission'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    department: { type: String, enum: ['opd', 'ipd', 'lab', 'pharmacy', 'ot', 'radiology', 'pathology'], required: true },
    itemType: { type: String, enum: ['consultation', 'lab', 'medicine', 'service', 'bed', 'ot'], required: true },
    description: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['unpaid', 'paid', 'cancelled'], default: 'unpaid' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

billingItemSchema.index({ referenceType: 1, referenceId: 1, status: 1 });

export const BillingItem = mongoose.model('BillingItem', billingItemSchema);
