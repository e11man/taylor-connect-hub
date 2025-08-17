// Vercel serverless function for sending signup notification emails
import { Resend } from 'resend';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signups, eventTitle, eventId, eventDate, eventTime, eventLocation } = req.body;

    // Validate required fields
    if (!signups || !Array.isArray(signups) || signups.length === 0) {
      return res.status(400).json({ error: 'No signups provided' });
    }

    if (!eventTitle) {
      return res.status(400).json({ error: 'Event title is required' });
    }

    console.log('Processing signup notifications for event:', eventTitle);
    console.log('Number of signups:', signups.length);

    const resend = new Resend(process.env.RESEND_API_KEY || 're_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92');
    const results = [];

    // Send email to each signup
    for (const signup of signups) {
      const { userEmail, userName, signedUpBy } = signup;
      
      if (!userEmail) {
        console.log('Skipping signup with no email:', signup);
        continue;
      }

      try {
        console.log('Sending signup notification to:', userEmail);

        // Create beautiful HTML email content
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Event Signup Confirmation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f9fc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1B365F 0%, #00AFCE 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Main Street Connect</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Event Signup Confirmation</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #0A2540; margin-bottom: 25px; font-size: 24px;">You're Signed Up!</h2>
                
                <!-- Event Info -->
                <div style="background: #f6f9fc; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #E14F3D;">
                  <h3 style="color: #1B365F; margin: 0 0 15px 0; font-size: 20px;">${eventTitle}</h3>
                  ${eventDate ? `<p style="color: #666; margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${eventDate}</p>` : ''}
                  ${eventTime ? `<p style="color: #666; margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${eventTime}</p>` : ''}
                  ${eventLocation ? `<p style="color: #666; margin: 5px 0; font-size: 14px;"><strong>Location:</strong> ${eventLocation}</p>` : ''}
                </div>
                
                <!-- Signup Details -->
                <div style="background: #e8f4fd; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #d1e7dd;">
                  <p style="color: #1B365F; margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">
                    <strong>Participant:</strong> ${userName || userEmail}
                  </p>
                  ${signedUpBy && signedUpBy !== userEmail ? `
                    <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                      <strong>Signed up by:</strong> ${signedUpBy}
                    </p>
                  ` : ''}
                </div>
                
                <!-- Call to Action -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="https://taylor-connect-hub.vercel.app/" 
                     style="background: #00AFCE; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; transition: background-color 0.3s;">
                    View Event Details →
                  </a>
                </div>
                
                <!-- Footer Info -->
                <div style="background: #f6f9fc; padding: 20px; border-radius: 12px; margin: 25px 0;">
                  <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.5;">
                    <strong>What's Next:</strong> You'll receive updates about this event as the date approaches.<br>
                    <strong>Questions:</strong> Contact the event organizer if you have any questions or need to make changes.
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #1B365F; padding: 25px; text-align: center;">
                <p style="color: #ffffff; margin: 0; font-size: 14px;">© 2024 Main Street Connect. All rights reserved.</p>
                <p style="color: #E14F3D; margin: 5px 0 0 0; font-size: 12px;">Connecting communities through meaningful volunteer opportunities</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send the email using Resend
        const emailResult = await resend.emails.send({
          from: 'Main Street Connect <noreply@uplandmainstreet.org>',
          to: [userEmail],
          subject: `Signup confirmed for "${eventTitle}"`,
          html: htmlContent,
        });

        if (emailResult.error) {
          console.error('Resend error for', userEmail, ':', emailResult.error);
          results.push({ 
            email: userEmail, 
            success: false, 
            error: emailResult.error 
          });
        } else {
          console.log('Signup notification sent successfully to:', userEmail);
          results.push({ 
            email: userEmail, 
            success: true, 
            messageId: emailResult.data.id 
          });
        }

      } catch (error) {
        console.error('Error sending to', userEmail, ':', error);
        results.push({ 
          email: userEmail, 
          success: false, 
          error: error.message 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Signup notifications complete: ${successCount} sent, ${failureCount} failed`);

    return res.status(200).json({
      success: true,
      message: `Signup notifications processed: ${successCount} sent, ${failureCount} failed`,
      results,
      totalProcessed: results.length
    });

  } catch (error) {
    console.error('Signup notification error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}