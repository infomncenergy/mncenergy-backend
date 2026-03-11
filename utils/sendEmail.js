const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT, 10),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Send booking notification to admin
// ─────────────────────────────────────────────────────────────────────────────
const sendBookingNotification = async (booking) => {
  const transporter = createTransporter();

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a7a4c; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">🗓️ New Booking Request</h2>
        <p style="color: #a8e6c4; margin: 4px 0 0;">Landlord Safety Certificate</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px;"><strong>Service</strong></td><td style="padding: 8px 0;">${booking.service}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Name</strong></td><td style="padding: 8px 0;">${booking.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Email</strong></td><td style="padding: 8px 0;">${booking.email}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Phone</strong></td><td style="padding: 8px 0;">${booking.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Property Type</strong></td><td style="padding: 8px 0;">${booking.propertyType} · ${booking.bedrooms}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Address</strong></td><td style="padding: 8px 0;">${booking.address}, ${booking.postcode}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Preferred Date</strong></td><td style="padding: 8px 0;">${booking.date}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Time Slot</strong></td><td style="padding: 8px 0;">${booking.timeSlot}</td></tr>
          ${booking.notes ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Notes</strong></td><td style="padding: 8px 0;">${booking.notes}</td></tr>` : ''}
        </table>
        <div style="margin-top: 20px; padding: 12px; background: #fff8e1; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <strong>Action Required:</strong> Please confirm this booking within 2 hours via email or phone call.
        </div>
      </div>
    </div>
  `;

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a7a4c; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">✅ Booking Request Received</h2>
        <p style="color: #a8e6c4; margin: 4px 0 0;">Landlord Safety Certificate</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <p>Dear <strong>${booking.name}</strong>,</p>
        <p>Thank you for your booking request. We have received your request for a <strong>${booking.service}</strong> and will confirm your appointment within <strong>2 hours</strong> by email and phone call.</p>
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px; color: #1a7a4c;">Booking Summary</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #666; width: 130px;"><strong>Service</strong></td><td style="padding: 6px 0;">${booking.service}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;"><strong>Address</strong></td><td style="padding: 6px 0;">${booking.address}, ${booking.postcode}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;"><strong>Preferred Date</strong></td><td style="padding: 6px 0;">${booking.date}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;"><strong>Time Slot</strong></td><td style="padding: 6px 0;">${booking.timeSlot}</td></tr>
          </table>
        </div>
        <p>If you need to speak to us urgently, please call us on <strong>0800 XXX XXXX</strong> or reply to this email.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Kind regards,<br><strong>Landlord Safety Certificate Team</strong></p>
      </div>
    </div>
  `;

  // Notify admin
  await transporter.sendMail({
    from:    `"Landlord Safety Cert" <${process.env.EMAIL_USER}>`,
    to:      process.env.ADMIN_EMAIL,
    subject: `🗓️ New Booking: ${booking.service} — ${booking.name}`,
    html:    adminHtml,
  });

  // Confirm to customer
  await transporter.sendMail({
    from:    `"Landlord Safety Certificate" <${process.env.EMAIL_USER}>`,
    to:      booking.email,
    subject: `Booking Request Received — ${booking.service}`,
    html:    customerHtml,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Send contact notification to admin
// ─────────────────────────────────────────────────────────────────────────────
const sendContactNotification = async (contact) => {
  const transporter = createTransporter();

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a7a4c; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">📩 New Contact Enquiry</h2>
        <p style="color: #a8e6c4; margin: 4px 0 0;">Landlord Safety Certificate</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 100px;"><strong>Name</strong></td><td style="padding: 8px 0;">${contact.name}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Email</strong></td><td style="padding: 8px 0;">${contact.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Phone</strong></td><td style="padding: 8px 0;">${contact.phone || 'Not provided'}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Subject</strong></td><td style="padding: 8px 0;">${contact.subject}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
          <strong style="color: #666;">Message:</strong>
          <p style="margin: 8px 0 0;">${contact.message}</p>
        </div>
      </div>
    </div>
  `;

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a7a4c; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">✅ We've Received Your Enquiry</h2>
        <p style="color: #a8e6c4; margin: 4px 0 0;">Landlord Safety Certificate</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <p>Dear <strong>${contact.name}</strong>,</p>
        <p>Thank you for contacting us. We have received your message regarding <strong>"${contact.subject}"</strong> and will get back to you within <strong>24 hours</strong>.</p>
        <p>If your enquiry is urgent, please call us on <strong>0800 XXX XXXX</strong>.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Kind regards,<br><strong>Landlord Safety Certificate Team</strong></p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    `"Landlord Safety Cert" <${process.env.EMAIL_USER}>`,
    to:      process.env.ADMIN_EMAIL,
    subject: `📩 New Enquiry: ${contact.subject} — ${contact.name}`,
    html:    adminHtml,
  });

  await transporter.sendMail({
    from:    `"Landlord Safety Certificate" <${process.env.EMAIL_USER}>`,
    to:      contact.email,
    subject: `We've received your enquiry — Landlord Safety Certificate`,
    html:    customerHtml,
  });
};

module.exports = { sendBookingNotification, sendContactNotification };
