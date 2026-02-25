# HMS Backend (Express + MongoDB)

Production-grade modular backend aligned with unified hospital workflow:

`Patient -> OPD Visit / IPD Admission -> Services (Lab/Pharmacy/OT/IPD/OPD) -> Central Billing Ledger -> Payments -> Discharge`

## Modules

- `auth` (JWT login)
- `patients` (UHID-based patient master)
- `opd` (OPD visit/token/queue/close)
- `ipd` (admissions/bed/discharge gate)
- `lab` (pathology/radiology/investigation orders)
- `pharmacy` (medicine issue linked to prescriptions)
- `billing` (central billing ledger)
- `payments` (payment collection)
- `discharge` (clearance + discharge summary)
- `reports` (MIS aggregates)
- `ot` (operation theatre scheduling/procedures)
- `workflow` (inter-module reference validation + event handlers)

## Enterprise Folder Structure

```txt
src/
  config/
  middleware/
  utils/
  modules/
    auth/
    users/
    patients/
    opd/
    ipd/
    consultations/
    prescriptions/
    lab/
    pharmacy/
    billing/
    payments/
    discharge/
    reports/
    ot/
    workflow/
  app.js
  server.js
```

## Unified Integration Rules (Implemented)

- OPD module creates and owns `visit_id` (`OPDVisit._id`).
- IPD module creates and owns `admission_id` (`IPDAdmission._id`).
- Lab, Pharmacy, OT, Billing and Payments always resolve `referenceType + referenceId` using `validateClinicalReference()` before writing records.
- Pharmacy orders require `prescriptionId` and create billing items per medicine.
- Lab orders create billing items for ordered tests.
- Payments auto-refresh billing ledger status (`paid` / `partial` / `unpaid`) from all linked services.
- Discharge is allowed only when:
  - pharmacy clearance = true
  - doctor approval = true
  - and (billing due = 0 OR billing override approved by admin/accountant)

## Service Layer Data Flow

1. **Patient/Visit Context**
   - OPD/IPD creates a clinical context (`opd_visit` / `ipd_admission`).
2. **Service Orders**
   - Consultation, Lab, Pharmacy, OT attach to the context via reference keys.
3. **Central Billing**
   - All services push charges to `billing_items`.
4. **Payment Posting**
   - `payments` are posted against same reference.
   - Billing module recalculates summary and item statuses.
5. **Closure/Discharge**
   - OPD close checks due = 0.
   - IPD discharge checks medical + billing clearances.

## Inter-Module Events

Domain events are emitted through an internal event bus (`src/utils/eventBus.js`) and handled in `modules/workflow/workflow.events.js`.

Emitted events include:
- `opd.visit.created`
- `ipd.admission.created`
- `lab.order.created`
- `pharmacy.order.created`
- `billing.item.added`
- `payment.collected`
- `billing.ledger.updated`
- `discharge.approved`

## Example API Flow (OPD → Lab → Billing → Payment → Discharge)

1. **Create OPD Visit**
```http
POST /api/opd/visits
{
  "patientId": "...",
  "doctorId": "...",
  "visitDate": "2026-02-25",
  "department": "OPD",
  "consultationFee": 500
}
```

2. **Create Lab Order linked to OPD Visit**
```http
POST /api/lab/orders
{
  "visitType": "opd",
  "referenceId": "<visit_id>",
  "patientId": "...",
  "department": "pathology",
  "testName": "CBC",
  "chargeAmount": 350
}
```

3. **Get Unified Billing Ledger**
```http
GET /api/billing?referenceType=opd_visit&referenceId=<visit_id>
```

4. **Collect Payment**
```http
POST /api/payments
{
  "patientId": "...",
  "referenceType": "opd_visit",
  "referenceId": "<visit_id>",
  "amount": 850,
  "paymentMode": "cash"
}
```

5. **Close OPD Visit**
```http
POST /api/opd/visits/<visit_id>/close
```

6. **IPD Discharge (if needed)**
```http
POST /api/discharge
{
  "admissionId": "<admission_id>",
  "doctorId": "...",
  "pharmacyClearance": true,
  "doctorApproval": true,
  "billingOverrideApproved": false
}
```

## Core API Endpoints

- `POST /api/auth/login`
- `GET|POST /api/patients`
- `GET|POST /api/opd/visits`
- `PATCH /api/opd/visits/:id/status`
- `POST /api/opd/visits/:id/close`
- `GET /api/opd/queue`
- `GET|POST /api/ipd/admissions`
- `POST /api/ipd/admissions/:id/discharge`
- `GET|POST /api/lab/orders`
- `PATCH /api/lab/orders/:id`
- `GET|POST /api/pharmacy/orders`
- `POST /api/pharmacy/orders/:id/issue`
- `GET|POST /api/billing`
- `GET|POST /api/payments`
- `GET|POST /api/discharge`
- `GET /api/reports/mis`
- `GET|POST /api/ot/procedures`
- `PATCH /api/ot/procedures/:id`

## RBAC Roles

- admin
- receptionist
- doctor
- nurse
- lab_technician
- pharmacist
- accountant

## Run

```bash
cp .env.example .env
npm install
npm run dev
```
