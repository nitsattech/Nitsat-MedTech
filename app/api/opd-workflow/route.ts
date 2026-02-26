import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, runInsert, runQuery, runUpdate } from '@/lib/db';

async function ensureOpdSchema() {
  const registrationColumns = await runQuery<{ name: string }>('PRAGMA table_info(patient_registrations)');
  const names = new Set(registrationColumns.map((column) => column.name));

  if (!names.has('token_number')) {
    await runUpdate('ALTER TABLE patient_registrations ADD COLUMN token_number INTEGER');
  }

  if (!names.has('opd_visit_status')) {
    await runUpdate("ALTER TABLE patient_registrations ADD COLUMN opd_visit_status TEXT DEFAULT 'Waiting'");
  }

  if (!names.has('consultation_fee')) {
    await runUpdate('ALTER TABLE patient_registrations ADD COLUMN consultation_fee REAL DEFAULT 0');
  }

  await runUpdate(`CREATE TABLE IF NOT EXISTS consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    prescription_notes TEXT,
    advice TEXT,
    follow_up_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES patient_registrations(id)
  )`);

  await runUpdate(`CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES patient_registrations(id)
  )`);

  await runUpdate(`CREATE TABLE IF NOT EXISTS lab_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    test_name TEXT NOT NULL,
    status TEXT DEFAULT 'Ordered',
    report_url TEXT,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES patient_registrations(id)
  )`);
}

async function ensureBillForVisit(registrationId: number) {
  const existing = await runQuery<any>('SELECT * FROM billing WHERE registration_id = ? ORDER BY id DESC LIMIT 1', [registrationId]);
  if (existing.length) {
    return existing[0];
  }

  const countRows = await runQuery<any>('SELECT COUNT(*) as c FROM billing');
  const count = Number(countRows[0]?.c || 0) + 1;
  const year = new Date().getFullYear();
  const billNumber = `OPD-${year}-${String(count).padStart(5, '0')}`;
  const billDate = new Date().toISOString().split('T')[0];

  const billId = await runInsert(
    `INSERT INTO billing (
      registration_id, bill_number, bill_date,
      total_investigation_amount, total_medicine_amount, total_amount,
      deposit_paid, amount_due, status, gst_percent, gst_amount, subtotal,
      total_bed_amount, total_doctor_amount, total_other_amount
    ) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 'Unpaid', 0, 0, 0, 0, 0, 0)`,
    [registrationId, billNumber, billDate]
  );

  const bill = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [billId]);
  return bill[0];
}

async function recalcBill(billId: number) {
  const items = await runQuery<any>('SELECT * FROM bill_items WHERE bill_id = ?', [billId]);
  let medicine = 0;
  let lab = 0;
  let doctor = 0;
  let other = 0;

  for (const item of items) {
    if (item.category === 'medicine') medicine += Number(item.amount || 0);
    else if (item.category === 'lab') lab += Number(item.amount || 0);
    else if (item.category === 'doctor') doctor += Number(item.amount || 0);
    else other += Number(item.amount || 0);
  }

  const subtotal = medicine + lab + doctor + other;
  const billRows = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [billId]);
  if (!billRows.length) return null;

  const current = billRows[0];
  const paid = Number(current.deposit_paid || 0);
  const due = Math.max(0, subtotal - paid);
  const status = due === 0 && subtotal > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

  await runUpdate(
    `UPDATE billing
     SET subtotal = ?, total_amount = ?, amount_due = ?, status = ?,
         total_medicine_amount = ?, total_investigation_amount = ?,
         total_doctor_amount = ?, total_other_amount = ?
     WHERE id = ?`,
    [subtotal, subtotal, due, status, medicine, lab, doctor, other, billId]
  );

  const updated = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [billId]);
  return updated[0];
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    await ensureOpdSchema();

    const sp = request.nextUrl.searchParams;
    const action = sp.get('action');

    if (action === 'search-patients') {
      const search = (sp.get('search') || '').trim();
      if (!search) return NextResponse.json([]);

      const q = `%${search}%`;
      const patients = await runQuery(
        `SELECT * FROM patients
         WHERE uhid LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?
         ORDER BY created_at DESC LIMIT 20`,
        [q, q, q, q]
      );

      return NextResponse.json(patients);
    }

    if (action === 'get-flow') {
      const registrationId = Number(sp.get('registrationId'));
      if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 });

      const regs = await runQuery<any>(
        `SELECT pr.*, p.uhid, p.first_name, p.last_name, p.phone, d.name as department_name
         FROM patient_registrations pr
         LEFT JOIN patients p ON p.id = pr.patient_id
         LEFT JOIN departments d ON d.id = pr.department_id
         WHERE pr.id = ?`,
        [registrationId]
      );

      if (!regs.length) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

      const registration = regs[0];
      const consultationRows = await runQuery<any>('SELECT * FROM consultations WHERE registration_id = ? ORDER BY id DESC LIMIT 1', [registrationId]);
      const consultation = consultationRows[0] || null;

      const prescriptions = await runQuery<any>('SELECT * FROM prescriptions WHERE registration_id = ? ORDER BY id DESC', [registrationId]);
      const labOrders = await runQuery<any>('SELECT * FROM lab_orders WHERE registration_id = ? ORDER BY id DESC', [registrationId]);

      const bill = await ensureBillForVisit(registrationId);
      const billItems = await runQuery<any>('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY created_at DESC', [bill.id]);
      const payments = await runQuery<any>('SELECT * FROM payments WHERE bill_id = ? ORDER BY created_at DESC', [bill.id]);

      return NextResponse.json({ registration, consultation, prescriptions, labOrders, bill, billItems, payments });
    }



    if (action === 'lab-dashboard') {
      const visitDate = sp.get('visitDate') || new Date().toISOString().split('T')[0];
      const status = sp.get('status');

      let query = `SELECT lo.*, pr.token_number, pr.opd_visit_status, pr.admission_date,
                          p.uhid, p.first_name, p.last_name, p.phone,
                          d.name as department_name
                   FROM lab_orders lo
                   JOIN patient_registrations pr ON pr.id = lo.registration_id
                   JOIN patients p ON p.id = pr.patient_id
                   LEFT JOIN departments d ON d.id = pr.department_id
                   WHERE pr.registration_type = 'OPD' AND pr.admission_date = ?`;
      const params: any[] = [visitDate];

      if (status) {
        query += ' AND lo.status = ?';
        params.push(status);
      }

      query += ' ORDER BY lo.created_at DESC';

      const orders = await runQuery<any>(query, params);
      return NextResponse.json(orders);
    }

    if (action === 'queue') {
      const visitDate = sp.get('visitDate') || new Date().toISOString().split('T')[0];
      const doctorId = sp.get('doctorId');

      let query = `SELECT pr.id, pr.patient_id, pr.doctor_id, pr.department_id, pr.admission_date, pr.admission_time,
                          pr.token_number, pr.opd_visit_status, pr.status,
                          p.uhid, p.first_name, p.last_name, p.phone,
                          d.name as department_name
                   FROM patient_registrations pr
                   LEFT JOIN patients p ON p.id = pr.patient_id
                   LEFT JOIN departments d ON d.id = pr.department_id
                   WHERE pr.registration_type = 'OPD' AND pr.admission_date = ?`;
      const params: any[] = [visitDate];

      if (doctorId) {
        query += ' AND pr.doctor_id = ?';
        params.push(Number(doctorId));
      }

      query += ' ORDER BY COALESCE(pr.token_number, 999999), pr.created_at';

      const rows = await runQuery<any>(query, params);
      const grouped = {
        waiting: rows.filter((r) => (r.opd_visit_status || 'Waiting') === 'Waiting'),
        in_consultation: rows.filter((r) => r.opd_visit_status === 'In Consultation'),
        completed: rows.filter((r) => r.opd_visit_status === 'Completed'),
      };

      return NextResponse.json({ date: visitDate, grouped, rows });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OPD workflow GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch OPD workflow' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    await ensureOpdSchema();
    const body = await request.json();
    const action = body.action;


    if (action === 'create-patient') {
      const { first_name, last_name, phone, gender } = body;
      if (!first_name || !phone) return NextResponse.json({ error: 'first_name and phone are required' }, { status: 400 });

      const countRows = await runQuery<any>('SELECT COUNT(*) as c FROM patients');
      const uhid = `UHID${String(Number(countRows[0]?.c || 0) + 1).padStart(6, '0')}`;

      const patientId = await runInsert(
        `INSERT INTO patients (uhid, first_name, last_name, phone, gender)
         VALUES (?, ?, ?, ?, ?)`,
        [uhid, first_name, last_name || null, phone, gender || null]
      );

      const rows = await runQuery<any>('SELECT * FROM patients WHERE id = ?', [patientId]);
      return NextResponse.json(rows[0], { status: 201 });
    }

    if (action === 'create-opd-visit') {
      const { patient_id, doctor_id, department_id, visit_date, consultation_fee = 0 } = body;
      if (!patient_id || !visit_date) {
        return NextResponse.json({ error: 'patient_id and visit_date are required' }, { status: 400 });
      }

      const patientRows = await runQuery<any>('SELECT id FROM patients WHERE id = ?', [patient_id]);
      if (!patientRows.length) {
        return NextResponse.json({ error: 'Patient not found. Please select a valid patient.' }, { status: 404 });
      }

      const tokenRows = await runQuery<any>(
        `SELECT COALESCE(MAX(token_number), 0) as max_token
         FROM patient_registrations WHERE admission_date = ? AND registration_type = 'OPD'`,
        [visit_date]
      );
      const tokenNumber = Number(tokenRows[0]?.max_token || 0) + 1;

      const regId = await runInsert(
        `INSERT INTO patient_registrations (
          patient_id, registration_type, doctor_id, department_id,
          admission_date, admission_time, status, token_number, opd_visit_status, consultation_fee
        ) VALUES (?, 'OPD', ?, ?, ?, ?, 'Active', ?, 'Waiting', ?)`,
        [
          patient_id,
          doctor_id || null,
          department_id || null,
          visit_date,
          new Date().toTimeString().slice(0, 5),
          tokenNumber,
          Number(consultation_fee || 0),
        ]
      );

      const bill = await ensureBillForVisit(regId);

      if (Number(consultation_fee || 0) > 0) {
        await runInsert(
          `INSERT INTO bill_items (bill_id, category, name, quantity, unit, rate, amount)
           VALUES (?, 'doctor', 'OPD Consultation Fee', 1, 'visit', ?, ?)`,
          [bill.id, Number(consultation_fee), Number(consultation_fee)]
        );
        await recalcBill(bill.id);
      }

      const rows = await runQuery<any>('SELECT * FROM patient_registrations WHERE id = ?', [regId]);
      return NextResponse.json(rows[0], { status: 201 });
    }

    if (action === 'save-consultation') {
      const { registration_id, symptoms, diagnosis, prescription_notes, advice, follow_up_date } = body;
      if (!registration_id) return NextResponse.json({ error: 'registration_id is required' }, { status: 400 });

      const existing = await runQuery<any>('SELECT id FROM consultations WHERE registration_id = ?', [registration_id]);
      if (existing.length) {
        await runUpdate(
          `UPDATE consultations
           SET symptoms = ?, diagnosis = ?, prescription_notes = ?, advice = ?, follow_up_date = ?, updated_at = CURRENT_TIMESTAMP
           WHERE registration_id = ?`,
          [symptoms || null, diagnosis || null, prescription_notes || null, advice || null, follow_up_date || null, registration_id]
        );
      } else {
        await runInsert(
          `INSERT INTO consultations (registration_id, symptoms, diagnosis, prescription_notes, advice, follow_up_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [registration_id, symptoms || null, diagnosis || null, prescription_notes || null, advice || null, follow_up_date || null]
        );
      }

      await runUpdate(
        `UPDATE patient_registrations
         SET provisional_diagnosis = ?, procedure_treatment = ?,
             opd_visit_status = CASE WHEN COALESCE(opd_visit_status,'Waiting') = 'Completed' THEN opd_visit_status ELSE 'In Consultation' END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [diagnosis || null, advice || null, registration_id]
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'add-prescription') {
      const { registration_id, medicine_name, dosage, frequency, duration, instructions } = body;
      if (!registration_id || !medicine_name) {
        return NextResponse.json({ error: 'registration_id and medicine_name are required' }, { status: 400 });
      }

      const id = await runInsert(
        `INSERT INTO prescriptions (registration_id, medicine_name, dosage, frequency, duration, instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [registration_id, medicine_name, dosage || null, frequency || null, duration || null, instructions || null]
      );

      const rows = await runQuery<any>('SELECT * FROM prescriptions WHERE id = ?', [id]);
      return NextResponse.json(rows[0], { status: 201 });
    }

    if (action === 'add-lab-order') {
      const { registration_id, test_name } = body;
      if (!registration_id || !test_name) {
        return NextResponse.json({ error: 'registration_id and test_name are required' }, { status: 400 });
      }

      const id = await runInsert(
        `INSERT INTO lab_orders (registration_id, test_name, status)
         VALUES (?, ?, 'Ordered')`,
        [registration_id, test_name]
      );

      const rows = await runQuery<any>('SELECT * FROM lab_orders WHERE id = ?', [id]);
      return NextResponse.json(rows[0], { status: 201 });
    }

    if (action === 'update-lab-order-status') {
      const { order_id, status, report_url, remarks } = body;
      if (!order_id || !status) return NextResponse.json({ error: 'order_id and status are required' }, { status: 400 });

      await runUpdate(
        `UPDATE lab_orders
         SET status = ?, report_url = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, report_url || null, remarks || null, order_id]
      );

      const rows = await runQuery<any>('SELECT * FROM lab_orders WHERE id = ?', [order_id]);
      return NextResponse.json(rows[0]);
    }

    if (action === 'add-billing-item') {
      const { registration_id, item_type, name, quantity = 1, amount, rate } = body;
      if (!registration_id || !item_type || !name || amount === undefined) {
        return NextResponse.json({ error: 'registration_id, item_type, name, amount are required' }, { status: 400 });
      }

      const bill = await ensureBillForVisit(Number(registration_id));
      const qty = Number(quantity || 1);
      const finalAmount = Number(amount);
      const finalRate = rate !== undefined ? Number(rate) : finalAmount / (qty || 1);

      const categoryMap: Record<string, string> = {
        consultation: 'doctor',
        lab: 'lab',
        medicine: 'medicine',
        service: 'other',
      };
      const category = categoryMap[item_type] || 'other';

      await runInsert(
        `INSERT INTO bill_items (bill_id, category, name, quantity, unit, rate, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bill.id, category, name, qty, 'unit', finalRate, finalAmount]
      );

      const updatedBill = await recalcBill(bill.id);
      return NextResponse.json({ bill: updatedBill });
    }

    if (action === 'collect-payment') {
      const { registration_id, amount, payment_mode, reference_number } = body;
      if (!registration_id || !amount) {
        return NextResponse.json({ error: 'registration_id and amount are required' }, { status: 400 });
      }

      const bill = await ensureBillForVisit(Number(registration_id));
      const paymentAmount = Number(amount);
      if (paymentAmount <= 0) {
        return NextResponse.json({ error: 'amount must be greater than zero' }, { status: 400 });
      }

      const mappedMode = payment_mode === 'Cash' ? 'Cash' : 'Credit';
      const notes = payment_mode && payment_mode !== mappedMode ? `Original mode: ${payment_mode}` : null;

      await runInsert(
        `INSERT INTO payments (bill_id, amount, payment_mode, payment_date, reference_number, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bill.id, paymentAmount, mappedMode, new Date().toISOString().split('T')[0], reference_number || null, notes]
      );

      const currentRows = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [bill.id]);
      const current = currentRows[0];
      const newPaid = Number(current.deposit_paid || 0) + paymentAmount;
      const newDue = Math.max(0, Number(current.total_amount || 0) - newPaid);
      const newStatus = newDue === 0 && Number(current.total_amount || 0) > 0 ? 'Paid' : 'Partial';

      await runUpdate('UPDATE billing SET deposit_paid = ?, amount_due = ?, status = ? WHERE id = ?', [newPaid, newDue, newStatus, bill.id]);
      const updatedBill = await runQuery<any>('SELECT * FROM billing WHERE id = ?', [bill.id]);

      return NextResponse.json({ bill: updatedBill[0] });
    }


    if (action === 'update-visit-status') {
      const { registration_id, opd_visit_status } = body;
      if (!registration_id || !opd_visit_status) {
        return NextResponse.json({ error: 'registration_id and opd_visit_status are required' }, { status: 400 });
      }

      const allowed = new Set(['Waiting', 'In Consultation', 'Completed']);
      if (!allowed.has(opd_visit_status)) {
        return NextResponse.json({ error: 'Invalid opd_visit_status' }, { status: 400 });
      }

      await runUpdate(
        `UPDATE patient_registrations SET opd_visit_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [opd_visit_status, registration_id]
      );

      const row = await runQuery<any>('SELECT * FROM patient_registrations WHERE id = ?', [registration_id]);
      return NextResponse.json(row[0]);
    }

    if (action === 'complete-visit') {
      const { registration_id } = body;
      if (!registration_id) return NextResponse.json({ error: 'registration_id is required' }, { status: 400 });

      const bill = await ensureBillForVisit(Number(registration_id));
      if (Number(bill.amount_due || 0) > 0 || bill.status !== 'Paid') {
        return NextResponse.json({ error: 'Visit cannot be completed before full payment' }, { status: 400 });
      }

      await runUpdate(
        `UPDATE patient_registrations
         SET opd_visit_status = 'Completed', status = 'Active', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [registration_id]
      );

      const visit = await runQuery<any>('SELECT * FROM patient_registrations WHERE id = ?', [registration_id]);
      return NextResponse.json({ visit: visit[0] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OPD workflow POST error:', error);
    return NextResponse.json({ error: 'Failed to process OPD workflow' }, { status: 500 });
  }
}
