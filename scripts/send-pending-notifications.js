#!/usr/bin/env node

/**
 * Send Pending Notifications Script
 * This script processes pending notifications and sends them via Resend API
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// Initialize clients
const supabaseUrl = process.env.SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY || 're_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

// Configuration
const BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 600; // 600ms between emails (respects 2 req/sec limit)

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendChatNotificationEmail(notification) {
  const { user_email, event_title, message, sender_name, organization_name } = notification;

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
            <h3 style="color: #1B365F; margin: 0 0 15px 0; font-size: 20px;">
              ${event_title}${organization_name ? ` - ${organization_name}` : ''}
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 3px solid #00AFCE;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
                <strong style="color: #1B365F;">From:</strong> ${sender_name}
              </p>
              <p style="color: #333; margin: 0; font-size: 16px; line-height: 1.5;">
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

  try {
    const result = await resend.emails.send({
      from: 'Main Street Connect <noreply@uplandmainstreet.org>',
      to: [user_email],
      subject: `New message in "${event_title}" chat`,
      html: htmlContent,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Failed to send email');
    }

    console.log(`✅ Email sent to ${user_email}: ${result.data?.id || 'success'}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${user_email}:`, error.message);
    return false;
  }
}

async function processPendingNotifications() {
  console.log('🚀 Processing pending chat notifications...\n');

  try {
    // Get pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .rpc('get_pending_notifications');

    if (fetchError) {
      console.error('❌ Error fetching notifications:', fetchError.message);
      return false;
    }

    if (!notifications || notifications.length === 0) {
      console.log('✅ No pending notifications to process');
      return true;
    }

    console.log(`📬 Found ${notifications.length} pending notifications`);

    // Process in batches
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(notifications.length / BATCH_SIZE)} (${batch.length} notifications)`);

      for (const notification of batch) {
        try {
          console.log(`📧 Sending email to ${notification.user_email} for message: "${notification.message.substring(0, 50)}..."`);

          // Send email
          const emailSent = await sendChatNotificationEmail(notification);

          if (emailSent) {
            // Mark notification as sent
            const { error: markError } = await supabase
              .rpc('mark_notification_sent', { p_notification_id: notification.id });

            if (markError) {
              console.error(`❌ Failed to mark notification as sent: ${markError.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            errorCount++;
          }

          processedCount++;

          // Rate limiting delay
          if (processedCount < notifications.length) {
            await delay(RATE_LIMIT_DELAY);
          }

        } catch (error) {
          console.error(`❌ Error processing notification ${notification.id}:`, error.message);
          errorCount++;
          processedCount++;
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < notifications.length) {
        console.log('⏳ Waiting before next batch...');
        await delay(1000);
      }
    }

    console.log('\n📊 Processing Summary:');
    console.log(`   Total: ${notifications.length}`);
    console.log(`   Processed: ${processedCount}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Success Rate: ${Math.round((successCount / processedCount) * 100)}%`);

    return successCount > 0;

  } catch (error) {
    console.error('❌ Unexpected error processing notifications:', error);
    return false;
  }
}

// Run the script
processPendingNotifications()
  .then(success => {
    if (success) {
      console.log('\n🎉 Notification processing completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Notification processing failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });

export { processPendingNotifications };
