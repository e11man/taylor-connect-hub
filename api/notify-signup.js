import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signups, eventDetails } = req.body;

    if (!signups || !Array.isArray(signups)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Prepare email messages
    const emailPromises = signups.map(async (signup) => {
      const msg = {
        to: signup.email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: 'Taylor Serves'
        },
        subject: `You've been signed up for: ${signup.eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1B365F; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Taylor Serves</h1>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #1B365F; margin-bottom: 20px;">Event Signup Confirmation</h2>
              
              <p style="color: #333; line-height: 1.6;">Hi there,</p>
              
              <p style="color: #333; line-height: 1.6;">
                You have been signed up for the following event by <strong>${signup.signedUpBy}</strong>:
              </p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E14F3D;">
                <h3 style="color: #E14F3D; margin: 0 0 10px 0; font-size: 20px;">${signup.eventName}</h3>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Event ID:</strong> ${signup.eventId}
                </p>
              </div>
              
              <p style="color: #333; line-height: 1.6;">
                If you have any questions or need to cancel your participation, please contact your PA or the event coordinator.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                  This is an automated message from Taylor Serves. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
Event Signup Confirmation

Hi there,

You have been signed up for the following event by ${signup.signedUpBy}:

Event: ${signup.eventName}
Event ID: ${signup.eventId}

If you have any questions or need to cancel your participation, please contact your PA or the event coordinator.

This is an automated message from Taylor Serves.
        `
      };

      return sgMail.send(msg);
    });

    // Send all emails
    const results = await Promise.allSettled(emailPromises);
    
    // Check for failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some emails failed to send:', failures);
      return res.status(207).json({
        message: 'Partial success',
        sent: results.length - failures.length,
        failed: failures.length,
        errors: failures.map(f => f.reason?.message || 'Unknown error')
      });
    }

    res.status(200).json({
      message: 'All emails sent successfully',
      sent: results.length
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
} 