/**
 * Run: node scripts/migrate-registration.js
 * Adds doctors table + extra columns to patient_registrations and patients
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(process.cwd(), 'data', 'hospital.db');
const db = new sqlite3.Database(DB_PATH, err => {
  if (err) { console.error('❌ DB not found. Run init-db.js first.'); process.exit(1); }
  console.log('✅ Connected');
});

db.serialize(() => {
  // Doctors table
  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialization TEXT,
    qualification TEXT,
    phone TEXT,
    email TEXT,
    registration_number TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, err => { if(err) console.error(err.message); else console.log('✅ Table: doctors'); });

  // Seed sample doctors
  db.run(`INSERT OR IGNORE INTO doctors (id,name,specialization,qualification) VALUES
    (1,'Dr. Alok Mehta','General Medicine','MBBS, MD'),
    (2,'Dr. RMO','Resident Medical Officer','MBBS'),
    (3,'Dr. Sharma','Orthopaedics','MBBS, MS Ortho'),
    (4,'Dr. Priya Singh','Gynaecology','MBBS, MS Gynae'),
    (5,'Dr. Anil Kumar','Paediatrics','MBBS, MD Paed')
  `, err => { if(err) console.error(err.message); else console.log('✅ Seeded 5 doctors'); });

  // Extra columns on patient_registrations
  const regCols = [
    'ALTER TABLE patient_registrations ADD COLUMN consultant_name TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN referred_by TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN additional_consultant TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN bed_number TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN nationality TEXT DEFAULT \'India\'',
    'ALTER TABLE patient_registrations ADD COLUMN religion TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN occupation TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN marital_status TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN id_document_type TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN id_document_number TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN tpa_name TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN admission_source TEXT',
    'ALTER TABLE patient_registrations ADD COLUMN category TEXT DEFAULT \'Cash\'',
  ];
  regCols.forEach(sql => {
    db.run(sql, err => { if (err && !err.message.includes('duplicate')) console.error(sql, err.message); });
  });
  console.log('✅ patient_registrations columns added');
  console.log('✅ Migration complete!');
});
db.close();