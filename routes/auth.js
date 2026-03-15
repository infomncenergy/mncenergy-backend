const express   = require('express');
const jwt       = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Admin     = require('../models/Admin');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    res.json({
      success: true,
      token:   generateToken(admin._id),
      admin: { id: admin._id, username: admin.username },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me (verify token + get admin info) ────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// ─── POST /api/auth/change-password ──────────────────────────────────────────
router.post('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id);
    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/test-email  (admin — verify email config) ────────────────
// Sends a test email and returns the exact result or error message.
// Use this from the Admin Panel → Settings to diagnose email issues.
router.post('/test-email', protect, async (req, res) => {
  const user = process.env.EMAIL_USER;
  const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!user || !pass) {
    return res.json({
      success: false,
      message: 'EMAIL_USER or EMAIL_PASS is missing from environment variables.',
      config: { EMAIL_USER: user || '(not set)', EMAIL_PASS: pass ? '(set)' : '(not set)', ADMIN_EMAIL: adminEmail || '(not set)' },
    });
  }

  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transporter.verify();

    // Send actual test email
    await transporter.sendMail({
      from:    `"MNC Energy" <${user}>`,
      to:      adminEmail || user,
      subject: '✅ Email Test — MNC Energy Admin Panel',
      html:    `<p>This is a test email sent from the MNC Energy Admin Panel at ${new Date().toLocaleString('en-GB')}.</p><p>If you can see this, your email configuration is working correctly.</p>`,
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${adminEmail || user}. Check your inbox.`,
      config: { EMAIL_USER: user, ADMIN_EMAIL: adminEmail || user },
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message,
      hint: err.message.includes('535') || err.message.includes('Username and Password')
        ? 'Gmail rejected the login. Check: (1) 2-Step Verification is ON in your Google Account, (2) EMAIL_PASS is a Gmail App Password (not your normal password), (3) Generate a fresh App Password at myaccount.google.com/apppasswords'
        : err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')
          ? 'Cannot reach Gmail SMTP. Check your internet connection or Render outbound rules.'
          : 'Check EMAIL_USER, EMAIL_PASS and ADMIN_EMAIL in your Render environment variables.',
      config: { EMAIL_USER: user, EMAIL_PASS: '(set — hidden)', ADMIN_EMAIL: adminEmail || '(not set)' },
    });
  }
});

module.exports = router;
