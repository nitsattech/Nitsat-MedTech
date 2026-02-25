import mongoose from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import { OPDVisit } from './opdVisit.model.js';
import { BillingItem } from '../billing/billingItem.model.js';
import { getLedger } from '../billing/billing.service.js';

export async function createOpdVisit(payload, userId) {
  const visitDate = new Date(payload.visitDate);
  const dayStart = new Date(visitDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(visitDate);
  dayEnd.setHours(23, 59, 59, 999);

  const last = await OPDVisit.findOne({ visitDate: { $gte: dayStart, $lte: dayEnd } }).sort({ tokenNumber: -1 });
  const tokenNumber = (last?.tokenNumber || 0) + 1;

  const visit = await OPDVisit.create({
    patientId: payload.patientId,
    doctorId: payload.doctorId,
    department: payload.department || 'OPD',
    visitDate,
    tokenNumber,
    consultationFee: Number(payload.consultationFee || 0),
    createdBy: userId,
  });

  if (visit.consultationFee > 0) {
    await BillingItem.create({
      patientId: visit.patientId,
      referenceType: 'opd_visit',
      referenceId: visit._id,
      department: 'opd',
      itemType: 'consultation',
      description: 'OPD Consultation Fee',
      quantity: 1,
      unitPrice: visit.consultationFee,
      amount: visit.consultationFee,
      createdBy: userId,
    });
  }

  return visit;
}

export async function listOpdVisits(filters) {
  const query = {};
  if (filters.patientId) query.patientId = filters.patientId;
  if (filters.status) query.status = filters.status;
  if (filters.doctorId) query.doctorId = filters.doctorId;
  return OPDVisit.find(query).populate('patientId doctorId', 'uhid firstName lastName fullName').sort({ visitDate: -1 });
}

export async function closeOpdVisit(visitId) {
  const visit = await OPDVisit.findById(visitId);
  if (!visit) throw new ApiError(404, 'OPD visit not found');

  const ledger = await getLedger('opd_visit', visitId);
  if (ledger.summary.due > 0) {
    throw new ApiError(400, 'Cannot close OPD visit until dues are cleared');
  }

  visit.status = 'completed';
  await visit.save();

  return { visit, ledger };
}

export async function queue(visitDate) {
  const date = new Date(visitDate);
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const visits = await OPDVisit.find({ visitDate: { $gte: dayStart, $lte: dayEnd } })
    .populate('patientId', 'uhid firstName lastName phone')
    .sort({ tokenNumber: 1 });

  return {
    waiting: visits.filter((v) => v.status === 'waiting'),
    inConsultation: visits.filter((v) => v.status === 'in_consultation'),
    completed: visits.filter((v) => v.status === 'completed'),
  };
}

export async function updateVisitStatus(visitId, status) {
  const allowed = new Set(['waiting', 'in_consultation', 'completed', 'cancelled']);
  if (!allowed.has(status)) throw new ApiError(400, 'Invalid visit status');

  const visit = await OPDVisit.findByIdAndUpdate(visitId, { status }, { new: true });
  if (!visit) throw new ApiError(404, 'OPD visit not found');
  return visit;
}
