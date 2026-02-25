import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './modules/auth/auth.routes.js';
import patientRoutes from './modules/patients/patient.routes.js';
import opdRoutes from './modules/opd/opd.routes.js';
import ipdRoutes from './modules/ipd/ipd.routes.js';
import consultationRoutes from './modules/consultations/consultation.routes.js';
import prescriptionRoutes from './modules/prescriptions/prescription.routes.js';
import labRoutes from './modules/lab/lab.routes.js';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import dischargeRoutes from './modules/discharge/discharge.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import otRoutes from './modules/ot/ot.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes); // /api/auth/login
app.use('/api/patients', patientRoutes);
app.use('/api/opd', opdRoutes); // /api/opd/visits
app.use('/api/ipd', ipdRoutes); // /api/ipd/admissions
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/lab', labRoutes); // /api/lab/orders
app.use('/api/pharmacy', pharmacyRoutes); // /api/pharmacy/orders
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discharge', dischargeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ot', otRoutes); // /api/ot/procedures

app.use(notFound);
app.use(errorHandler);
