import { EventEmitter } from 'events';

class HMSEventBus extends EventEmitter {}

export const hmsEventBus = new HMSEventBus();

export const HMS_EVENTS = {
  OPD_VISIT_CREATED: 'opd.visit.created',
  IPD_ADMISSION_CREATED: 'ipd.admission.created',
  LAB_ORDER_CREATED: 'lab.order.created',
  PHARMACY_ORDER_CREATED: 'pharmacy.order.created',
  BILLING_ITEM_ADDED: 'billing.item.added',
  PAYMENT_COLLECTED: 'payment.collected',
  LEDGER_UPDATED: 'billing.ledger.updated',
  DISCHARGE_APPROVED: 'discharge.approved',
};
