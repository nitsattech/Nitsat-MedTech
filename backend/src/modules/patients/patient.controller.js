import { asyncHandler } from '../../utils/asyncHandler.js';
import { createPatient, listPatients } from './patient.service.js';

export const createPatientController = asyncHandler(async (req, res) => {
  const patient = await createPatient(req.body, req.user._id);
  res.status(201).json(patient);
});

export const listPatientsController = asyncHandler(async (req, res) => {
  const patients = await listPatients(req.query.search);
  res.json(patients);
});
