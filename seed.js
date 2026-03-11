/**
 * seed.js — Run this ONCE to create the first admin account
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin    = require('./models/Admin');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
    if (existing) {
      console.log('⚠️  Admin account already exists. Skipping seed.');
      process.exit(0);
    }

    await Admin.create({
      username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    });

    console.log('✅ Admin account created successfully!');
    console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
    console.log('   ⚠️  Please change the password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
