// Vercel serverless function for sending chat notification emails
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
    const { 
      userEmail, 
      eventTitle, 
      message, 
      senderName, 
      senderType, 
      organizationName 
    } = req.body;

    // Validate required fields
    if (!userEmail || !eventTitle || !message || !senderName) {
      return res.status(400).json({ 
        error: 'Missing required fields: userEmail, eventTitle, message, senderName' 
      });
    }

    console.log('Sending chat notification email to:', userEmail);

    const resend = new Resend(process.env.RESEND_API_KEY || 're_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92');

    // Create beautiful HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Chat Message</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f9fc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1B365F 0%, #00AFCE 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Main Street Connect</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">New Chat Message</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #0A2540; margin-bottom: 25px; font-size: 24px;">New Message in Event Chat</h2>
            
            <!-- Event Info -->
            <div style="background: #f6f9fc; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #E14F3D;">
              <h3 style="color: #1B365F; margin: 0 0 15px 0; font-size: 20px;">${eventTitle}</h3>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                <strong>Organization:</strong> ${organizationName || 'Community Event'}
              </p>
            </div>
            
            <!-- Message Content -->
            <div style="background: #e8f4fd; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #d1e7dd;">
              <p style="color: #1B365F; margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">
                <strong>From:</strong> ${senderName}${senderType === 'organization' ? ' (Organization)' : ''}
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 3px solid #E14F3D;">
                <p style="color: #333; margin: 0; font-style: italic; line-height: 1.6; font-size: 16px;">
                  "${message}"
                </p>
              </div>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://taylor-connect-hub.vercel.app/" 
                 style="background: #00AFCE; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; transition: background-color 0.3s;">
                View Event Chat →
              </a>
            </div>
            
            <!-- Footer Info -->
            <div style="background: #f6f9fc; padding: 20px; border-radius: 12px; margin: 25px 0;">
              <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.5;">
                <strong>Manage Notifications:</strong> You can control your notification preferences in your account settings.<br>
                <strong>Event Updates:</strong> Stay informed about changes and new opportunities.
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
      subject: `New message in "${eventTitle}" chat`,
      html: htmlContent,
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: emailResult.error 
      });
    }

    console.log('Chat notification email sent successfully:', emailResult.data);
    return res.status(200).json({ 
      success: true, 
      message: 'Chat notification email sent successfully',
      messageId: emailResult.data.id
    });

  } catch (error) {
    console.error('Chat notification email error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
