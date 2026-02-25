import mongoose from 'mongoose';

const pharmacyItemSchema = new mongoose.Schema(
  {
    medicineId: { type: String },
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const pharmacyOrderSchema = new mongoose.Schema(
  {
    visitType: { type: String, enum: ['opd', 'ipd'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    items: { type: [pharmacyItemSchema], default: [] },
    status: { type: String, enum: ['pending', 'issued', 'cancelled'], default: 'pending' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PharmacyOrder = mongoose.model('PharmacyOrder', pharmacyOrderSchema);
