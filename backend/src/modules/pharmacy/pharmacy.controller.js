import { asyncHandler } from '../../utils/asyncHandler.js';
import { createPharmacyOrder, issuePharmacyOrder, listPharmacyOrders } from './pharmacy.service.js';

export const createPharmacyOrderController = asyncHandler(async (req, res) => {
  const order = await createPharmacyOrder(req.body, req.user._id);
  res.status(201).json(order);
});

export const issuePharmacyOrderController = asyncHandler(async (req, res) => {
  const order = await issuePharmacyOrder(req.params.id, req.user._id);
  res.json(order);
});

export const listPharmacyOrdersController = asyncHandler(async (req, res) => {
  const orders = await listPharmacyOrders(req.query);
  res.json(orders);
});
