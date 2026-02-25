import { HMS_EVENTS, hmsEventBus } from '../../utils/eventBus.js';

export function registerWorkflowEventHandlers() {
  hmsEventBus.on(HMS_EVENTS.OPD_VISIT_CREATED, (event) => {
    console.info('[HMS_EVENT] opd.visit.created', event);
  });

  hmsEventBus.on(HMS_EVENTS.IPD_ADMISSION_CREATED, (event) => {
    console.info('[HMS_EVENT] ipd.admission.created', event);
  });

  hmsEventBus.on(HMS_EVENTS.LAB_ORDER_CREATED, (event) => {
    console.info('[HMS_EVENT] lab.order.created', event);
  });

  hmsEventBus.on(HMS_EVENTS.PHARMACY_ORDER_CREATED, (event) => {
    console.info('[HMS_EVENT] pharmacy.order.created', event);
  });

  hmsEventBus.on(HMS_EVENTS.PAYMENT_COLLECTED, (event) => {
    console.info('[HMS_EVENT] payment.collected', event);
  });

  hmsEventBus.on(HMS_EVENTS.DISCHARGE_APPROVED, (event) => {
    console.info('[HMS_EVENT] discharge.approved', event);
  });
}
