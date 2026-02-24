/**
 * Run this to add new billing columns and bill_items table
 * Usage: node scripts/migrate-billing.js
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'hospital.db');
const db = new sqlite3.Database(DB_PATH, err => {
  if (err) { console.error('❌ Cannot open DB. Run init-db.js first.'); process.exit(1); }
  console.log('✅ Connected to DB');
});

db.serialize(() => {
  // Add new columns to billing table (ignore errors if they already exist)
  const newCols = [
    'ALTER TABLE billing ADD COLUMN gst_percent REAL DEFAULT 0',
    'ALTER TABLE billing ADD COLUMN gst_amount REAL DEFAULT 0',
    'ALTER TABLE billing ADD COLUMN subtotal REAL DEFAULT 0',
    'ALTER TABLE billing ADD COLUMN total_bed_amount REAL DEFAULT 0',
    'ALTER TABLE billing ADD COLUMN total_doctor_amount REAL DEFAULT 0',
    'ALTER TABLE billing ADD COLUMN total_other_amount REAL DEFAULT 0',
  ];
  newCols.forEach(sql => {
    db.run(sql, err => {
      if (err && !err.message.includes('duplicate column')) console.error('Column:', err.message);
    });
  });

  // Create bill_items table
  db.run(`CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    name TEXT NOT NULL,
    description TEXT,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT DEFAULT '',
    rate REAL NOT NULL DEFAULT 0,
    amount REAL NOT NULL DEFAULT 0,
    batch_number TEXT,
    expiry_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES billing(id)
  )`, err => {
    if (err) console.error('❌ bill_items:', err.message);
    else console.log('✅ Table: bill_items');
  });

  console.log('✅ Migration complete!');
  console.log('   New columns added to billing table');
  console.log('   bill_items table created');
});

db.close();