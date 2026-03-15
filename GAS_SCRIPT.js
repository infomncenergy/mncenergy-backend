/**
 * MNC Energy — Email Relay via Google Apps Script
 * ─────────────────────────────────────────────────
 * Paste this entire file into https://script.google.com
 * Then: Deploy → New deployment → Web app
 *   Execute as:     Me (info.mncenergy@gmail.com)
 *   Who has access: Anyone
 * Copy the web app URL → add as GAS_WEBHOOK_URL in Render env vars.
 *
 * Also add GAS_SECRET in Render env vars (any string, must match SECRET below).
 */

var SECRET = 'mnc_energy_2025'; // ← must match GAS_SECRET in Render env vars

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Basic auth check
    if (data.secret !== SECRET) {
      return respond({ error: 'Unauthorized' });
    }

    // Send the email via Gmail
    GmailApp.sendEmail(
      data.to,
      data.subject,
      'Please view this email in an HTML-capable client.',
      {
        htmlBody:  data.html,
        name:      'MNC Energy',
        replyTo:   data.replyTo || 'info.mncenergy@gmail.com',
      }
    );

    return respond({ success: true, to: data.to, timestamp: new Date().toISOString() });

  } catch (err) {
    return respond({ error: err.toString() });
  }
}

// Allow GET so you can test the URL is live in a browser
function doGet(e) {
  return respond({ status: 'MNC Energy email relay is running' });
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
