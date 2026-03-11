const express = require('express');
const jwt     = require('jsonwebtoken');
const Admin   = require('../models/Admin');
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

module.exports = router;
