import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'hospital.db');

let db: sqlite3.Database;
let isInitialized = false;

export function initializeDatabase() {
  return new Promise<void>((resolve, reject) => {
    if (isInitialized && db) {
      resolve();
      return;
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        isInitialized = true;
        resolve();
      }
    });
  });
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function runQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve((rows || []) as T[]);
      }
    });
  });
}

export function runInsert(query: string, params: any[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

export function runUpdate(query: string, params: any[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'pharmacist' | 'lab_technician' | 'accountant' | 'nurse';
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: number;
  uhid: string;
  first_name: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  pin_code?: string;
  blood_group?: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export interface PatientRegistration {
  id: number;
  patient_id: number;
  registration_type: 'IPD' | 'OPD';
  doctor_id?: number;
  department_id?: number;
  admission_date: string;
  admission_time?: string;
  discharge_date?: string;
  status: 'Active' | 'Discharged' | 'Cancelled';
  provisional_diagnosis?: string;
  procedure_treatment?: string;
  comments?: string;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  insurance_company?: string;
  insurance_number?: string;
  rate_list: string;
  created_at: string;
}

export interface Investigation {
  id: number;
  name: string;
  description?: string;
  rate: number;
  unit?: string;
  is_active: boolean;
}

export interface InvestigationDetail {
  id: number;
  registration_id: number;
  investigation_id: number;
  quantity: number;
  rate: number;
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  entry_date: string;
}

export interface Medicine {
  id: number;
  name: string;
  generic_name?: string;
  batch_number?: string;
  expiry_date?: string;
  rate: number;
  unit?: string;
  quantity_in_stock: number;
  is_active: boolean;
}

export interface Bill {
  id: number;
  registration_id: number;
  bill_number: string;
  bill_date: string;
  total_investigation_amount: number;
  total_medicine_amount: number;
  total_amount: number;
  deposit_paid: number;
  amount_due: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  created_at: string;
}

export interface Payment {
  id: number;
  bill_id: number;
  amount: number;
  payment_mode: 'Cash' | 'Credit';
  payment_date: string;
  reference_number?: string;
  created_at: string;
}
