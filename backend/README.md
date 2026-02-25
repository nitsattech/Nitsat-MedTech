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
  app.js
  server.js
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
