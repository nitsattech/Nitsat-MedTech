import { asyncHandler } from '../../utils/asyncHandler.js';
import { closeOpdVisit, createOpdVisit, listOpdVisits, queue, updateVisitStatus } from './opd.service.js';

export const createOpdVisitController = asyncHandler(async (req, res) => {
  const visit = await createOpdVisit(req.body, req.user._id);
  res.status(201).json(visit);
});

export const listOpdVisitsController = asyncHandler(async (req, res) => {
  const visits = await listOpdVisits(req.query);
  res.json(visits);
});

export const closeOpdVisitController = asyncHandler(async (req, res) => {
  const result = await closeOpdVisit(req.params.id);
  res.json(result);
});

export const queueController = asyncHandler(async (req, res) => {
  const date = req.query.visitDate || new Date().toISOString();
  const data = await queue(date);
  res.json(data);
});

export const updateVisitStatusController = asyncHandler(async (req, res) => {
  const visit = await updateVisitStatus(req.params.id, req.body.status);
  res.json(visit);
});
