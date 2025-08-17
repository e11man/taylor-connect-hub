import { Resend } from 'resend';

// Only use Resend for email sending
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Add a test endpoint for debugging
  if (req.method === 'GET') {
    return res.json({ 
      status: 'Email service is running',
      resendConfigured: !!RESEND_API_KEY,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Resend API key is available
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ 
      error: 'Email service not configured',
      message: 'RESEND_API_KEY environment variable is required'
    });
  }

  try {
    const { signups, eventDetails } = req.body;

    console.log('Received request body:', JSON.stringify(req.body, null, 2));

    if (!signups || !Array.isArray(signups)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    console.log(`Processing ${signups.length} signup notifications`);

    const buildHtml = (signup) => {
      const brand = 'Main Street Connect';
      const header = '#1B365F';
      const accent = '#E14F3D';
      return `
        <!doctype html>
        <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
          <body style="margin:0;padding:0;background:#f6f9fc;font-family:Arial,sans-serif;">
            <div style="max-width:600px;margin:0 auto;background:#fff;">
              <div style="background:${header};padding:24px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;">${brand}</h1>
                <p style="color:#fff;margin:8px 0 0 0;opacity:.9;font-size:14px;">Event Signup Confirmation</p>
              </div>
              <div style="padding:28px 24px;">
                <p style="color:#333;line-height:1.6;margin:0 0 16px 0;">Hi,</p>
                <p style="color:#333;line-height:1.6;margin:0 0 16px 0;">You have been signed up for the following event by <strong>${signup.signedUpBy}</strong>.</p>
                <div style="background:#f6f9fc;padding:18px;border-radius:10px;border-left:4px solid ${accent};margin:18px 0;">
                  <p style="margin:0;color:#333;font-size:14px;">
                    <strong>Event:</strong> ${signup.eventName}<br/>
                    ${signup.eventId ? `<strong>Event ID:</strong> ${signup.eventId}` : ''}
                  </p>
                </div>
                <p style="color:#666;font-size:14px;line-height:1.6;margin:0;">If you have questions or need to cancel, please contact your PA or the event coordinator.</p>
              </div>
              <div style="background:${header};padding:18px;text-align:center;">
                <p style="color:#fff;margin:0;font-size:12px;">© 2025 ${brand}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>`;
    };

    const FROM = 'Main Street Connect <noreply@uplandmainstreet.org>';
    const resend = new Resend(RESEND_API_KEY);

    // Send emails to all signups
    const emailPromises = signups.map(async (signup) => {
      if (!signup.email) {
        console.warn(`Skipping signup for user ${signup.userId} - no email address`);
        return { success: false, reason: 'No email address' };
      }

      try {
        console.log(`Sending email to: ${signup.email} for event: ${signup.eventName}`);
        
        const result = await resend.emails.send({
          from: FROM,
          to: [signup.email],
          subject: `You've been signed up for: ${signup.eventName}`,
          html: buildHtml(signup),
        });

        if (result.error) {
          console.error(`Failed to send email to ${signup.email}:`, result.error);
          return { success: false, reason: result.error.message, email: signup.email };
        }

        console.log(`Email sent successfully to ${signup.email}:`, result.data?.id);
        return { success: true, email: signup.email, messageId: result.data?.id };
      } catch (error) {
        console.error(`Error sending email to ${signup.email}:`, error);
        return { success: false, reason: error.message, email: signup.email };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);
    
    // Process results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;
    const errors = results.filter(r => r.status === 'rejected').length;

    console.log(`Email results: ${successful} successful, ${failed} failed, ${errors} errors`);

    // Return detailed results
    if (failed > 0 || errors > 0) {
      return res.status(207).json({
        message: 'Partial success',
        sent: successful,
        failed: failed + errors,
        total: signups.length,
        details: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, reason: 'Promise rejected' })
      });
    }

    res.status(200).json({
      message: 'All emails sent successfully',
      sent: successful,
      total: signups.length
    });

  } catch (error) {
    console.error('Error in notify-signup handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
} 