import { asyncHandler } from '../../utils/asyncHandler.js';
import { addBillingItem, getLedger } from './billing.service.js';

export const addBillingItemController = asyncHandler(async (req, res) => {
  const item = await addBillingItem(req.body, req.user._id);
  const ledger = await getLedger(item.referenceType, item.referenceId);
  res.status(201).json({ item, ledger });
});

export const getLedgerController = asyncHandler(async (req, res) => {
  const { referenceType, referenceId } = req.query;
  const ledger = await getLedger(referenceType, referenceId);
  res.json(ledger);
});
