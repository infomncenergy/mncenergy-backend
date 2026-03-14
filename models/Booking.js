const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // Service
    service:      { type: String, required: true },

    // Property
    propertyType: { type: String, required: true },
    bedrooms:     { type: String, default: '' },
    address:      { type: String, required: true },
    postcode:     { type: String, required: true },

    // Appointment
    date:         { type: String, required: true },
    timeSlot:     { type: String, required: true },

    // Contact
    name:         { type: String, required: true },
    email:        { type: String, required: true },
    phone:        { type: String, required: true },
    notes:        { type: String, default: '' },

    // Admin tracking
    status: {
      type:    String,
      enum:    ['New', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'New',
    },

    adminNotes:  { type: String,  default: '' },
    isReturning: { type: Boolean, default: false }, // true if same email has a prior record
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
