import mongoose from 'mongoose';

export const ROLES = [
  'admin',
  'receptionist',
  'doctor',
  'nurse',
  'lab_technician',
  'pharmacist',
  'accountant',
];

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    department: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
