import { asyncHandler } from '../../utils/asyncHandler.js';
import { createLabOrder, listLabOrders, updateLabOrder } from './lab.service.js';

export const createLabOrderController = asyncHandler(async (req, res) => {
  const order = await createLabOrder(req.body, req.user._id);
  res.status(201).json(order);
});

export const listLabOrdersController = asyncHandler(async (req, res) => {
  const orders = await listLabOrders(req.query);
  res.json(orders);
});

export const updateLabOrderController = asyncHandler(async (req, res) => {
  const order = await updateLabOrder(req.params.id, req.body);
  res.json(order);
});
