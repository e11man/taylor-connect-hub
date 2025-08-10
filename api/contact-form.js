// Vercel serverless function for contact form submissions
import { Resend } from 'resend';

export default async function handler(req, res) {
  // CORS
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
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, message' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY || 're_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92');

    const toAddress = process.env.CONTACT_TO || 'connect@taylor.edu';
    const fromAddress = process.env.CONTACT_FROM || 'Community Connect <onboarding@resend.dev>';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00AFCE 0%, #0088a9 100%); padding: 24px; color: white; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">Community Connect</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9;">New Contact Form Submission</p>
        </div>
        <div style="background: #fff; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.08)">
          <p style="margin: 0 0 12px 0; color:#333"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin: 0 0 12px 0; color:#333"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <div style="margin-top: 18px; padding: 16px; background:#f8f9fa; border-left: 4px solid #00AFCE; border-radius: 8px; white-space: pre-wrap; color:#333">
            ${escapeHtml(message)}
          </div>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: fromAddress, // Must be in the format "Name <email@domain>"
      to: [toAddress],
      subject: `New Contact Form Submission - ${name}`,
      html,
      reply_to: `${name} <${email}>`
    });

    if (emailResponse.error) {
      return res.status(502).json({ error: emailResponse.error.message || 'Failed to send email' });
    }

    return res.status(200).json({ success: true, message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}