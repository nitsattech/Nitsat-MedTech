/**
 * Migration: Add advance_amount to patient_registrations table
 * 
 * Usage: node scripts/migrate-advance-amount.js
 * 
 * Kya karega ye script:
 * 1. patient_registrations mein advance_amount column add karega
 * 2. billing mein deposit_paid column already hai — us se link ho jayega
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'hospital.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Cannot open DB. Run init-db.js first.');
    process.exit(1);
  }
  console.log('✅ Connected to DB');
});

db.serialize(() => {

  // Step 1: patient_registrations mein advance_amount add karo
  db.run(
    `ALTER TABLE patient_registrations ADD COLUMN advance_amount REAL DEFAULT 0`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column')) {
          console.log('ℹ️  advance_amount column already exists — skipping');
        } else {
          console.error('❌ Error adding advance_amount:', err.message);
        }
      } else {
        console.log('✅ Column added: patient_registrations.advance_amount');
      }
    }
  );

  // Step 2: payment_mode column add karo registration mein (Cash/Card/UPI)
  db.run(
    `ALTER TABLE patient_registrations ADD COLUMN advance_payment_mode TEXT DEFAULT 'Cash'`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column')) {
          console.log('ℹ️  advance_payment_mode column already exists — skipping');
        } else {
          console.error('❌ Error adding advance_payment_mode:', err.message);
        }
      } else {
        console.log('✅ Column added: patient_registrations.advance_payment_mode');
      }
    }
  );

  // Step 3: advance_receipt_number add karo (optional but useful)
  db.run(
    `ALTER TABLE patient_registrations ADD COLUMN advance_receipt_number TEXT`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column')) {
          console.log('ℹ️  advance_receipt_number column already exists — skipping');
        } else {
          console.error('❌ Error adding advance_receipt_number:', err.message);
        }
      } else {
        console.log('✅ Column added: patient_registrations.advance_receipt_number');
      }
    }
  );

  console.log('\n✅ Migration complete!');
  console.log('   ➜ patient_registrations.advance_amount');
  console.log('   ➜ patient_registrations.advance_payment_mode');
  console.log('   ➜ patient_registrations.advance_receipt_number');
  console.log('\nNext step: Registration form mein fields add karo (see instructions below)\n');

});

db.close(() => {
  console.log('🔒 DB closed');
});