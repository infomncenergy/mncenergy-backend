const express  = require('express');
const Booking  = require('../models/Booking');
const { protect }       = require('../middleware/authMiddleware');
const { sendBookingNotification } = require('../utils/sendEmail');

const router = express.Router();

// ─── POST /api/bookings  (public — submit booking) ───────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { service, propertyType, bedrooms, address, postcode, date, timeSlot, name, email, phone, notes } = req.body;

    // Basic validation
    if (!service || !propertyType || !address || !postcode || !date || !timeSlot || !name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const booking = await Booking.create({
      service, propertyType, bedrooms, address, postcode,
      date, timeSlot, name, email, phone, notes,
    });

    // Send email notifications (don't fail the request if email fails)
    try {
      await sendBookingNotification(booking);
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Booking received! We will confirm your appointment within 2 hours.',
      bookingId: booking._id,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/bookings  (admin — get all bookings) ───────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
        { phone:    { $regex: search, $options: 'i' } },
        { service:  { $regex: search, $options: 'i' } },
        { postcode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      bookings,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/bookings/stats  (admin — dashboard stats) ──────────────────────
router.get('/stats', protect, async (req, res, next) => {
  try {
    const [total, newCount, confirmed, completed, cancelled] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'New' }),
      Booking.countDocuments({ status: 'Confirmed' }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' }),
    ]);

    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = await Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({ success: true, stats: { total, new: newCount, confirmed, completed, cancelled, recent } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/bookings/:id  (admin — single booking) ─────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/bookings/:id  (admin — update status / notes) ────────────────
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const update = {};
    if (status)     update.status     = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/bookings/:id  (admin — delete booking) ──────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
