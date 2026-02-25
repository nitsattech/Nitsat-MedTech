import mongoose from 'mongoose';

const ipdAdmissionSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    admissionNo: { type: String, required: true, unique: true },
    admissionDate: { type: Date, required: true },
    attendingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ward: String,
    bedNumber: String,
    status: { type: String, enum: ['admitted', 'discharged', 'cancelled'], default: 'admitted' },
    provisionalDiagnosis: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const IPDAdmission = mongoose.model('IPDAdmission', ipdAdmissionSchema);
