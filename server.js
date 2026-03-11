require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const connectDB      = require('./config/db');
const authRoutes     = require('./routes/auth');
const bookingRoutes  = require('./routes/bookings');
const contactRoutes  = require('./routes/contacts');
const errorHandler   = require('./middleware/errorHandler');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Serve admin panel static files ──────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,        // allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // handle preflight requests for all routes

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  message:  { success: false, message: 'Too many requests, please try again later.' },
});

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      process.env.NODE_ENV === 'production' ? 10 : 200, // relaxed in development
  message:  { success: false, message: 'Too many submissions, please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production', // skip rate limit entirely in development
});

app.use('/api/', limiter);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/bookings', formLimiter, bookingRoutes);
app.use('/api/contacts', formLimiter, contactRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
