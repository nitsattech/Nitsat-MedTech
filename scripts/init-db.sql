-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist', 'pharmacist', 'lab_technician', 'accountant', 'nurse')),
  department VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  uhid VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pin_code VARCHAR(10),
  blood_group VARCHAR(5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  registration_number VARCHAR(50) UNIQUE,
  specialization VARCHAR(100),
  qualifications TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Patient Registration table (IPD/OPD)
CREATE TABLE IF NOT EXISTS patient_registrations (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  registration_type VARCHAR(20) CHECK (registration_type IN ('IPD', 'OPD')),
  doctor_id INTEGER,
  department_id INTEGER,
  admission_date DATE NOT NULL,
  admission_time TIME,
  discharge_date DATE,
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Discharged', 'Cancelled')),
  provisional_diagnosis TEXT,
  procedure_treatment TEXT,
  comments TEXT,
  guardian_name VARCHAR(255),
  guardian_relation VARCHAR(50),
  guardian_phone VARCHAR(20),
  insurance_company VARCHAR(100),
  insurance_number VARCHAR(50),
  rate_list VARCHAR(50) DEFAULT 'COMMON',
  admission_source VARCHAR(50),
  room_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Investigations (Lab Tests) table
CREATE TABLE IF NOT EXISTS investigations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  rate DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  department_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Investigation Details table
CREATE TABLE IF NOT EXISTS investigation_details (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER NOT NULL,
  investigation_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  rate DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  result TEXT,
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
  entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id),
  FOREIGN KEY (investigation_id) REFERENCES investigations(id)
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  batch_number VARCHAR(50),
  expiry_date DATE,
  rate DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  quantity_in_stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicine Dispensing table
CREATE TABLE IF NOT EXISTS medicine_dispensing (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER NOT NULL,
  medicine_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  dispensed_by INTEGER,
  dispense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (dispensed_by) REFERENCES users(id)
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER NOT NULL,
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  bill_date DATE NOT NULL,
  total_investigation_amount DECIMAL(12, 2) DEFAULT 0,
  total_medicine_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  deposit_paid DECIMAL(12, 2) DEFAULT 0,
  amount_due DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Partial', 'Unpaid')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_mode VARCHAR(50) CHECK (payment_mode IN ('Cash', 'Credit')),
  payment_date DATE NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES billing(id)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Create indexes for performance
CREATE INDEX idx_patients_uhid ON patients(uhid);
CREATE INDEX idx_registrations_patient ON patient_registrations(patient_id);
CREATE INDEX idx_registrations_doctor ON patient_registrations(doctor_id);
CREATE INDEX idx_investigation_details_registration ON investigation_details(registration_id);
CREATE INDEX idx_medicine_dispensing_registration ON medicine_dispensing(registration_id);
CREATE INDEX idx_billing_registration ON billing(registration_id);
CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
