import { Patient } from './patient.model.js';

export async function generateUhid() {
  const count = await Patient.countDocuments();
  return `UHID${String(count + 1).padStart(8, '0')}`;
}

export async function createPatient(payload, userId) {
  const uhid = await generateUhid();
  return Patient.create({
    uhid,
    firstName: payload.firstName,
    lastName: payload.lastName,
    gender: payload.gender,
    dateOfBirth: payload.dateOfBirth,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    bloodGroup: payload.bloodGroup,
    emergencyContactName: payload.emergencyContactName,
    emergencyContactPhone: payload.emergencyContactPhone,
    createdBy: userId,
  });
}

export async function listPatients(search) {
  const query = search
    ? {
        $or: [
          { uhid: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  return Patient.find(query).sort({ createdAt: -1 }).limit(100);
}
