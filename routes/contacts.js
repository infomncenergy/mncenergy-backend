const express = require('express');
const Contact = require('../models/Contact');
const { protect }        = require('../middleware/authMiddleware');
const { sendContactNotification } = require('../utils/sendEmail');

const router = express.Router();

// ─── POST /api/contacts  (public — submit contact form) ──────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }

    const contact = await Contact.create({ name, email, phone, subject: subject || 'General Enquiry', message });

    try {
      await sendContactNotification(contact);
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Thank you for your enquiry. We'll get back to you within 24 hours.",
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/contacts  (admin — get all contacts) ───────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { email:   { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      contacts,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/contacts/stats ──────────────────────────────────────────────────
router.get('/stats', protect, async (req, res, next) => {
  try {
    const [total, newCount, read, replied, closed] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'New' }),
      Contact.countDocuments({ status: 'Read' }),
      Contact.countDocuments({ status: 'Replied' }),
      Contact.countDocuments({ status: 'Closed' }),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = await Contact.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({ success: true, stats: { total, new: newCount, read, replied, closed, recent } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/contacts/:id ────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    // Auto-mark as Read when viewed
    if (contact.status === 'New') {
      contact.status = 'Read';
      await contact.save();
    }

    res.json({ success: true, contact });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/contacts/:id ──────────────────────────────────────────────────
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const update = {};
    if (status)     update.status     = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const contact = await Contact.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    res.json({ success: true, contact });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/contacts/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
