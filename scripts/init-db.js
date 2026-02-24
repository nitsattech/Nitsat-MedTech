import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'hospital.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Database connected');
});

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist', 'pharmacist', 'lab_technician', 'accountant', 'nurse')),
  department TEXT,
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uhid TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pin_code TEXT,
  blood_group TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  registration_number TEXT UNIQUE,
  specialization TEXT,
  qualifications TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Patient Registration table (IPD/OPD)
CREATE TABLE IF NOT EXISTS patient_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  registration_type TEXT CHECK (registration_type IN ('IPD', 'OPD')),
  doctor_id INTEGER,
  department_id INTEGER,
  admission_date DATE NOT NULL,
  admission_time TIME,
  discharge_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Discharged', 'Cancelled')),
  provisional_diagnosis TEXT,
  procedure_treatment TEXT,
  comments TEXT,
  guardian_name TEXT,
  guardian_relation TEXT,
  guardian_phone TEXT,
  insurance_company TEXT,
  insurance_number TEXT,
  rate_list TEXT DEFAULT 'COMMON',
  admission_source TEXT,
  room_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Investigations (Lab Tests) table
CREATE TABLE IF NOT EXISTS investigations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rate REAL NOT NULL,
  unit TEXT,
  department_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Investigation Details table
CREATE TABLE IF NOT EXISTS investigation_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL,
  investigation_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  rate REAL NOT NULL,
  amount REAL NOT NULL,
  result TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
  entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id),
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  generic_name TEXT,
  batch_number TEXT,
  expiry_date DATE,
  rate REAL NOT NULL,
  unit TEXT,
  quantity_in_stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medicine Dispensing table
CREATE TABLE IF NOT EXISTS medicine_dispensing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL,
  medicine_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  rate REAL NOT NULL,
  amount REAL NOT NULL,
  dispensed_by INTEGER,
  dispense_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (dispensed_by) REFERENCES users(id)
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL,
  bill_number TEXT UNIQUE NOT NULL,
  bill_date DATE NOT NULL,
  total_investigation_amount REAL DEFAULT 0,
  total_medicine_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  deposit_paid REAL DEFAULT 0,
  amount_due REAL,
  status TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Partial', 'Unpaid')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT CHECK (payment_mode IN ('Cash', 'Credit')),
  payment_date DATE NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES billing(id)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
`;

// Run schema setup
db.exec(schema, async (err) => {
  if (err) {
    console.error('Error creating schema:', err);
    db.close();
    process.exit(1);
  }
  console.log('Schema created successfully');

  // Add sample data with proper promise handling
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const insertData = () => {
      return new Promise((resolve, reject) => {
        let completed = 0;
        let total = 3; // departments, admin, medicines, investigations

        const checkComplete = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        // Insert admin user first
        db.run(
          `INSERT OR IGNORE INTO users (email, password_hash, full_name, role, is_active)
           VALUES (?, ?, ?, ?, ?)`,
          ['admin@nitsat.com', adminPassword, 'Administrator', 'admin', 1],
          function(err) {
            if (err) {
              console.error('Error inserting admin:', err);
            } else {
              console.log('✅ Admin user created/verified');
            }
            checkComplete();
          }
        );

        // Insert departments
        const departments = [
          ['OPD', 'Out Patient Department', 'user'],
          ['IPD', 'In Patient Department', 'home'],
          ['Medicines', 'Pharmacy', 'pill'],
          ['Services', 'Services', 'service'],
          ['Investigation', 'Laboratory', 'microscope'],
          ['Payment', 'Payment', 'credit-card'],
          ['O.T.', 'Operation Theater', 'activity'],
          ['Discharge', 'Discharge', 'log-out'],
          ['Billing', 'Billing', 'file-text'],
          ['File', 'File Management', 'folder'],
          ['MIS', 'Management Info System', 'bar-chart-2'],
          ['Pathology', 'Pathology', 'microscope'],
          ['Sonography', 'Sonography', 'radio'],
          ['Radiology', 'Radiology', 'radio'],
          ['Cardiology', 'Cardiology', 'heart'],
          ['Gastrology', 'Gastrology', 'activity']
        ];

        departments.forEach(dept => {
          db.run(
            'INSERT OR IGNORE INTO departments (name, description, icon, is_active) VALUES (?, ?, ?, ?)',
            [...dept, 1]
          );
        });
        console.log('✅ Departments created/verified');
        checkComplete();

        // Insert sample medicines
        const medicines = [
          { name: 'Paracetamol', generic: 'Paracetamol', rate: 50, unit: 'Tablet' },
          { name: 'Aspirin', generic: 'Aspirin', rate: 100, unit: 'Tablet' },
          { name: 'Amoxicillin', generic: 'Amoxicillin', rate: 150, unit: 'Capsule' },
          { name: 'Ibuprofen', generic: 'Ibuprofen', rate: 80, unit: 'Tablet' },
          { name: 'Ciprofloxacin', generic: 'Ciprofloxacin', rate: 120, unit: 'Tablet' },
          { name: 'Metformin', generic: 'Metformin', rate: 40, unit: 'Tablet' }
        ];

        medicines.forEach(med => {
          db.run(
            `INSERT OR IGNORE INTO medicines (name, generic_name, rate, unit, quantity_in_stock, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [med.name, med.generic, med.rate, med.unit, 500, 1]
          );
        });
        console.log('✅ Medicines created/verified');
        checkComplete();
      });
    };

    await insertData();
    console.log('✅ Sample data insertion complete');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }

  db.close(() => {
    console.log('✅ Database initialization complete');
    process.exit(0);
  });
});
