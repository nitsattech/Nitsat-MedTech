import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    uhid: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: Date,
    phone: { type: String, index: true },
    email: String,
    address: String,
    bloodGroup: String,
    emergencyContactName: String,
    emergencyContactPhone: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Patient = mongoose.model('Patient', patientSchema);
