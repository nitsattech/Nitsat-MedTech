import { asyncHandler } from '../../utils/asyncHandler.js';
import { OPDVisit } from '../opd/opdVisit.model.js';
import { IPDAdmission } from '../ipd/ipdAdmission.model.js';
import { BillingItem } from '../billing/billingItem.model.js';
import { Payment } from '../payments/payment.model.js';

export const getMISDashboardController = asyncHandler(async (_req, res) => {
  const [opdToday, ipdActive, totalBilling, totalPayments] = await Promise.all([
    OPDVisit.countDocuments(),
    IPDAdmission.countDocuments({ status: 'admitted' }),
    BillingItem.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { paymentStatus: 'success' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
  ]);

  res.json({
    opdVisits: opdToday,
    activeIpdAdmissions: ipdActive,
    billedAmount: totalBilling[0]?.sum || 0,
    collectedAmount: totalPayments[0]?.sum || 0,
  });
});
