const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    phone:   { type: String, default: '' },
    subject: { type: String, default: 'General Enquiry' },
    message: { type: String, required: true },

    // Admin tracking
    status: {
      type:    String,
      enum:    ['New', 'Read', 'Replied', 'Closed'],
      default: 'New',
    },

    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
