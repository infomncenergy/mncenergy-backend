const { Resend } = require('resend');

// ─── Resend client ────────────────────────────────────────────────────────────
// Resend uses HTTP API (port 443) — works on all hosting including Render free.
// Get your API key at https://resend.com → API Keys.
// Add RESEND_API_KEY to your Render environment variables.
//
// FROM address options:
//   • Before domain verification: 'onboarding@resend.dev'
//   • After verifying mncenergy.co.uk in Resend dashboard: 'info@mncenergy.co.uk'
// Set EMAIL_FROM in .env / Render env vars once your domain is verified.

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'MNC Energy <onboarding@resend.dev>';
const ADMIN = process.env.ADMIN_EMAIL;

// ─── Verify / startup check ───────────────────────────────────────────────────
const verifyTransporter = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('⚠️  RESEND_API_KEY is not set — emails will not be sent');
    return;
  }
  console.log('✅ Resend email client ready');
  console.log(`   FROM: ${FROM}`);
  console.log(`   ADMIN: ${ADMIN}`);
};

verifyTransporter();

// ─────────────────────────────────────────────────────────────────────────────
// Send booking notification to admin + confirmation to customer
// ─────────────────────────────────────────────────────────────────────────────
const sendBookingNotification = async (booking) => {
  const resend = getResend();

  const returningBadge = booking.isReturning
    ? `<div style="margin:0 0 16px;padding:10px 14px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:6px;">
        <strong>&#11088; Returning Customer</strong> — This email has submitted a previous booking or enquiry.
       </div>`
    : '';

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6B2FA0 0%, #00B4D8 100%); padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">&#128197; New Booking Request</h2>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">MNC Energy — Gas Safe &middot; NICEIC &middot; NAPIT &middot; BAFE</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        ${returningBadge}
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px;"><strong>Service</strong></td><td style="padding: 8px 0;">${booking.service}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Name</strong></td><td style="padding: 8px 0;">${booking.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Email</strong></td><td style="padding: 8px 0;">${booking.email}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Phone</strong></td><td style="padding: 8px 0;">${booking.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Property Type</strong></td><td style="padding: 8px 0;">${booking.propertyType} &middot; ${booking.bedrooms}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Address</strong></td><td style="padding: 8px 0;">${booking.address}, ${booking.postcode}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;"><strong>Preferred Date</strong></td><td style="padding: 8px 0;">${booking.date}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px 0; color: #666;"><strong>Time Slot</strong></td><td style="padding: 8px 0;">${booking.timeSlot}</td></tr>
          ${booking.notes ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Notes</strong></td><td style="padding: 8px 0;">${booking.notes}</td></tr>` : ''}
        </table>
        <div style="margin-top: 20px; padding: 12px; background: #fff8e1; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <strong>Action Required:</strong> Please confirm this booking within 2 hours via email or phone call.
        </div>
      </div>
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 12px;">MNC Energy Ltd &middot; Company No: 16255515 &middot; London &amp; M25 Area</p>
    </div>
  `;

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6B2FA0 0%, #00B4D8 100%); padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">&#9989; Booking Request Received</h2>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">MNC Energy — Gas Safe &middot; NICEIC &middot; NAPIT &middot; BAFE</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <p>Dear <strong>${booking.name}</strong>,</p>
        <p>Thank you for your booking request. We have received your request for a <strong>${booking.service}</strong> and will confirm your appointment within <strong>2 hours</strong> by email and phone call.</p>
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px; color: #6B2FA0;">Booking Summary</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #666; width: 130px;"><strong>Service</strong></td><td style="padding: 6px 0;">${booking.service}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;"><strong>Address</strong></td><td style="padding: 6px 0;">${booking.address}, ${booking.postcode}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;"><strong>Preferred Date</strong></td><td style="padding: 6px 0;">${booking.date}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;"><strong>Time Slot</strong></td><td style="padding: 6px 0;">${booking.timeSlot}</td></tr>
          </table>
        </div>
        <p>If you need to speak to us urgently, please call us on <strong>+44 7345 158783</strong> or reply to this email.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Kind regards,<br><strong>MNC Energy Team</strong><br>
        <a href="mailto:Info@mncenergy.co.uk" style="color: #6B2FA0;">Info@mncenergy.co.uk</a> &middot; +44 7345 158783</p>
      </div>
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 12px;">MNC Energy Ltd &middot; Company No: 16255515 &middot; London &amp; M25 Area</p>
    </div>
  `;

  // Notify admin
  console.log(`📧 Sending admin booking email to: ${ADMIN}`);
  const adminResult = await resend.emails.send({
    from:    FROM,
    to:      [ADMIN],
    replyTo: booking.email,
    subject: `New Booking: ${booking.service} — ${booking.name}${booking.isReturning ? ' [Returning Customer]' : ''}`,
    html:    adminHtml,
  });
  if (adminResult.error) {
    console.error(`❌ Admin booking email error: ${adminResult.error.message}`);
    throw new Error(adminResult.error.message);
  }
  console.log(`✅ Admin booking email sent. ID: ${adminResult.data?.id}`);

  // Confirm to customer
  console.log(`📧 Sending customer booking email to: ${booking.email}`);
  const customerResult = await resend.emails.send({
    from:    FROM,
    to:      [booking.email],
    subject: `Booking Request Received — ${booking.service} | MNC Energy`,
    html:    customerHtml,
  });
  if (customerResult.error) {
    // This typically means domain not verified yet — admin email already sent above
    console.error(`❌ Customer booking email error: ${customerResult.error.message}`);
    console.error(`   → Fix: verify mncenergy.co.uk in Resend dashboard (resend.com/domains)`);
    console.error(`   → Then set EMAIL_FROM=MNC Energy <info@mncenergy.co.uk> in Render env vars`);
    throw new Error(customerResult.error.message);
  }
  console.log(`✅ Customer booking email sent. ID: ${customerResult.data?.id}`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Send contact notification to admin + confirmation to customer
// ─────────────────────────────────────────────────────────────────────────────
const sendContactNotification = async (contact) => {
  const resend = getResend();

  const returningBadge = contact.isReturning
    ? `<div style="margin:0 0 16px;padding:10px 14px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:6px;">
        <strong>&#11088; Returning Customer</strong> — This email has a previous booking or enquiry on record.
       </div>`
    : '';

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6B2FA0 0%, #00B4D8 100%); padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">&#128233; New Contact Enquiry</h2>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">MNC Energy — Gas Safe &middot; NICEIC &middot; NAPIT &middot; BAFE</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        ${returningBadge}
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
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 12px;">MNC Energy Ltd &middot; Company No: 16255515 &middot; London &amp; M25 Area</p>
    </div>
  `;

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6B2FA0 0%, #00B4D8 100%); padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">&#9989; We've Received Your Enquiry</h2>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">MNC Energy — Gas Safe &middot; NICEIC &middot; NAPIT &middot; BAFE</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <p>Dear <strong>${contact.name}</strong>,</p>
        <p>Thank you for contacting MNC Energy. We have received your message regarding <strong>"${contact.subject}"</strong> and will get back to you within <strong>24 hours</strong>.</p>
        <p>If your enquiry is urgent, please call us on <strong>+44 7345 158783</strong> or email us at <a href="mailto:Info@mncenergy.co.uk" style="color: #6B2FA0;">Info@mncenergy.co.uk</a>.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Kind regards,<br><strong>MNC Energy Team</strong><br>
        <a href="mailto:Info@mncenergy.co.uk" style="color: #6B2FA0;">Info@mncenergy.co.uk</a> &middot; +44 7345 158783</p>
      </div>
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 12px;">MNC Energy Ltd &middot; Company No: 16255515 &middot; London &amp; M25 Area</p>
    </div>
  `;

  console.log(`📧 Sending admin contact email to: ${ADMIN}`);
  const adminResult = await resend.emails.send({
    from:    FROM,
    to:      [ADMIN],
    replyTo: contact.email,
    subject: `New Enquiry: ${contact.subject} — ${contact.name}${contact.isReturning ? ' [Returning Customer]' : ''}`,
    html:    adminHtml,
  });
  if (adminResult.error) {
    console.error(`❌ Admin contact email error: ${adminResult.error.message}`);
    throw new Error(adminResult.error.message);
  }
  console.log(`✅ Admin contact email sent. ID: ${adminResult.data?.id}`);

  console.log(`📧 Sending customer contact email to: ${contact.email}`);
  const customerResult = await resend.emails.send({
    from:    FROM,
    to:      [contact.email],
    subject: `We've received your enquiry — MNC Energy`,
    html:    customerHtml,
  });
  if (customerResult.error) {
    console.error(`❌ Customer contact email error: ${customerResult.error.message}`);
    console.error(`   → Fix: verify mncenergy.co.uk in Resend dashboard (resend.com/domains)`);
    console.error(`   → Then set EMAIL_FROM=MNC Energy <info@mncenergy.co.uk> in Render env vars`);
    throw new Error(customerResult.error.message);
  }
  console.log(`✅ Customer contact email sent. ID: ${customerResult.data?.id}`);
};

module.exports = { sendBookingNotification, sendContactNotification };
