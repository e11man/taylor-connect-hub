// Vercel serverless function for handling contact form submissions
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
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, message' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get current timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f8fafc;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #00AFCE 0%, #0088a9 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
              }
              .header p {
                  margin: 10px 0 0 0;
                  opacity: 0.9;
                  font-size: 16px;
              }
              .content {
                  padding: 40px 30px;
              }
              .info-section {
                  background-color: #f8f9fa;
                  border-radius: 8px;
                  padding: 20px;
                  margin-bottom: 25px;
              }
              .info-section h3 {
                  color: #00AFCE;
                  margin: 0 0 15px 0;
                  font-size: 18px;
                  font-weight: 600;
              }
              .info-item {
                  margin-bottom: 12px;
              }
              .info-label {
                  font-weight: 600;
                  color: #555;
                  display: inline-block;
                  width: 80px;
              }
              .info-value {
                  color: #333;
              }
              .message-section {
                  background-color: #fff;
                  border: 2px solid #e9ecef;
                  border-radius: 8px;
                  padding: 20px;
                  margin-top: 20px;
              }
              .message-section h3 {
                  color: #00AFCE;
                  margin: 0 0 15px 0;
                  font-size: 18px;
                  font-weight: 600;
              }
              .message-content {
                  background-color: #f8f9fa;
                  padding: 15px;
                  border-radius: 6px;
                  border-left: 4px solid #00AFCE;
                  white-space: pre-wrap;
                  line-height: 1.5;
              }
              .footer {
                  background-color: #f8f9fa;
                  padding: 20px 30px;
                  text-align: center;
                  border-top: 1px solid #e9ecef;
              }
              .footer p {
                  margin: 0;
                  color: #6c757d;
                  font-size: 14px;
              }
              .timestamp {
                  color: #6c757d;
                  font-size: 12px;
                  text-align: center;
                  margin-top: 15px;
                  padding-top: 15px;
                  border-top: 1px solid #e9ecef;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🌟 acme</h1>
                  <p>New Contact Form Submission</p>
              </div>
              
              <div class="content">
                  <div class="info-section">
                      <h3>📋 Contact Information</h3>
                      <div class="info-item">
                          <span class="info-label">Name:</span>
                          <span class="info-value">${name}</span>
                      </div>
                      <div class="info-item">
                          <span class="info-label">Email:</span>
                          <span class="info-value">${email}</span>
                      </div>
                      <div class="info-item">
                          <span class="info-label">Date:</span>
                          <span class="info-value">${timestamp}</span>
                      </div>
                  </div>
                  
                  <div class="message-section">
                      <h3>💬 Message</h3>
                      <div class="message-content">${message}</div>
                  </div>
              </div>
              
              <div class="footer">
                  <p>This message was sent through the acme contact form.</p>
                  <div class="timestamp">
                      Received on ${timestamp}
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
              from: 'acme <noreply@ellmangroup.org>',
      to: ['josh_ellman@icloud.com'],
      subject: `New Contact Form Submission - ${name}`,
      html: htmlContent,
      reply_to: email
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: error.message 
      });
    }

    console.log('Contact form email sent successfully:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Contact form submitted successfully',
      id: data.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}