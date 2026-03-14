import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "hospital.db");

// ensure data folder
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("DB Error", err);
    process.exit(1);
  }
  console.log("✅ Database Connected");
});

const schema = `

-- HOSPITALS
CREATE TABLE IF NOT EXISTS hospitals (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 address TEXT,
 phone TEXT,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 email TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 full_name TEXT NOT NULL,
 role TEXT NOT NULL,
 department TEXT,
 hospital_id INTEGER,
 phone TEXT,
 is_active INTEGER DEFAULT 1,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT UNIQUE,
 description TEXT,
 icon TEXT,
 is_active INTEGER DEFAULT 1
);

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 uhid TEXT UNIQUE,
 first_name TEXT,
 last_name TEXT,
 gender TEXT,
 phone TEXT,
 hospital_id INTEGER,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- DOCTORS
CREATE TABLE IF NOT EXISTS doctors (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER UNIQUE,
 specialization TEXT,
 phone TEXT,
 FOREIGN KEY (user_id) REFERENCES users(id)
);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 patient_id INTEGER,
 doctor_id INTEGER,
 appointment_date DATE,
 appointment_time TIME,
 status TEXT DEFAULT 'Scheduled',
 notes TEXT,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MEDICINES
CREATE TABLE IF NOT EXISTS medicines (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT,
 generic_name TEXT,
 rate REAL,
 unit TEXT,
 quantity_in_stock INTEGER DEFAULT 0
);

-- BILLING
CREATE TABLE IF NOT EXISTS billing (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 bill_number TEXT UNIQUE,
 total_amount REAL,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

`;

db.exec(schema, async (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log("✅ Schema Created");

  try {
    // hospitals
    db.run(`
    INSERT OR IGNORE INTO hospitals (id,name,address,phone)
    VALUES
    (1,'Nitsat Hospital','Bhadohi','9999999999'),
    (2,'CityCare Hospital','Lucknow','8888888888'),
    (3,'Sunrise Clinic','Delhi','7777777777')
    `);

    // users
    const users = [
      {
        email: "admin@nitsat.com",
        password: "admin123",
        name: "Nitsat Admin",
        role: "admin",
        dept: "Administration",
        hospital: 1,
      },
      {
        email: "doctor@nitsat.com",
        password: "doctor123",
        name: "Dr Sharma",
        role: "doctor",
        dept: "OPD",
        hospital: 1,
      },
      {
        email: "reception@nitsat.com",
        password: "reception123",
        name: "Reception",
        role: "receptionist",
        dept: "OPD",
        hospital: 1,
      },
      {
        email: "admin@citycare.com",
        password: "admin123",
        name: "CityCare Admin",
        role: "admin",
        dept: "Administration",
        hospital: 2,
      },
      {
        email: "lab@sunrise.com",
        password: "lab123",
        name: "Lab Technician",
        role: "lab_technician",
        dept: "Pathology",
        hospital: 3,
      },
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);

      db.run(
        `INSERT OR IGNORE INTO users 
        (email,password_hash,full_name,role,department,hospital_id,is_active)
        VALUES (?,?,?,?,?,?,1)`,
        [u.email, hash, u.name, u.role, u.dept, u.hospital]
      );
    }

    console.log("✅ Demo Users Created");

    // departments
    const departments = [
      ["OPD", "Out Patient", "user"],
      ["IPD", "In Patient", "home"],
      ["Investigation", "Lab", "microscope"],
      ["Pharmacy", "Medicines", "pill"],
      ["Billing", "Accounts", "credit-card"],
      ["MIS", "Reports", "bar-chart"],
    ];

    departments.forEach((d) => {
      db.run(
        `INSERT OR IGNORE INTO departments (name,description,icon)
         VALUES (?,?,?)`,
        d
      );
    });

    console.log("✅ Departments Created");

    // medicines
    const medicines = [
      ["Paracetamol", "Paracetamol", 50, "Tablet"],
      ["Ibuprofen", "Ibuprofen", 80, "Tablet"],
      ["Amoxicillin", "Amoxicillin", 120, "Capsule"],
    ];

    medicines.forEach((m) => {
      db.run(
        `INSERT OR IGNORE INTO medicines
         (name,generic_name,rate,unit,quantity_in_stock)
         VALUES (?,?,?,?,500)`,
        m
      );
    });

    console.log("✅ Medicines Created");

    console.log("🎉 HMS Database Ready");
  } catch (err) {
    console.error(err);
  }

  db.close();
});