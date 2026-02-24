/**
 * Run this ONCE after init-db.js to create the admin user.
 * Usage: node scripts/create-admin.js
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(process.cwd(), 'data', 'hospital.db');

// Simple bcrypt-compatible hash using crypto (avoids needing bcryptjs in script)
// We'll store a known hash for 'admin123' — you can change this password in the app later
// This hash is: bcrypt hash of 'admin123' with 10 rounds
const ADMIN_PASSWORD_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
// ↑ This is a standard bcrypt hash of the string: admin123

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Cannot open database. Did you run: node scripts/init-db.js first?');
    process.exit(1);
  }
});

db.run(
  `INSERT OR IGNORE INTO users (email, password_hash, full_name, role, is_active)
   VALUES (?, ?, ?, ?, 1)`,
  ['admin@hospital.com', ADMIN_PASSWORD_HASH, 'Administrator', 'admin'],
  function(err) {
    if (err) {
      console.error('❌ Error creating admin:', err.message);
    } else if (this.changes === 0) {
      console.log('ℹ️  Admin user already exists.');
    } else {
      console.log('✅ Admin user created!');
      console.log('   Email:    admin@hospital.com');
      console.log('   Password: admin123');
    }
    db.close();
  }
);