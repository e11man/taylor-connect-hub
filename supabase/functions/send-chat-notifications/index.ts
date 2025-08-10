import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Resend with production API
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Production configuration
const BATCH_SIZE = 10; // Process notifications in batches
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 100; // Delay between emails to respect rate limits

// Utility function for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await delay(delayMs);
      return retryWithBackoff(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    // Production logging with request ID
    console.log(`[${requestId}] Starting notification processing at ${new Date().toISOString()}`);

    // Get pending notifications using the optimized function
    const { data: notifications, error: notificationsError } = await supabaseClient
      .rpc('get_pending_notifications');

    if (notificationsError) {
      console.error(`[${requestId}] Error fetching notifications:`, notificationsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch notifications',
        requestId,
        details: notificationsError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalNotifications = notifications?.length || 0;
    console.log(`[${requestId}] Found ${totalNotifications} notifications to process`);

    if (totalNotifications === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending notifications',
        processed: 0,
        requestId,
        processingTimeMs: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ notificationId: string; error: string }> = [];

    // Process notifications in batches for better performance
    const batches = [];
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      batches.push(notifications.slice(i, i + BATCH_SIZE));
    }

    console.log(`[${requestId}] Processing ${batches.length} batches of up to ${BATCH_SIZE} notifications each`);

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[${requestId}] Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} notifications`);

      // Process notifications in the current batch
      for (const notification of batch) {
        try {
          const {
            id,
            user_email,
            event_title,
            message,
            sender_name,
            sender_type,
            event_description,
            organization_name
          } = notification;

          console.log(`[${requestId}] Processing notification ${id} for ${user_email}`);

        // Create improved email content
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
              <div style="background: linear-gradient(135deg, #0A2540 0%, #525f7f 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Taylor Connect Hub</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">New Chat Message</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #0A2540; margin-bottom: 25px; font-size: 24px;">New Message in Event Chat</h2>
                
                <!-- Event Info -->
                <div style="background: #f6f9fc; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #E8A87C;">
                  <h3 style="color: #0A2540; margin: 0 0 15px 0; font-size: 20px;">${event_title}</h3>
                  <p style="color: #525f7f; margin: 0; font-size: 15px; line-height: 1.6;">
                    ${event_description ? (event_description.length > 150 ? event_description.substring(0, 150) + '...' : event_description) : 'Join the conversation and stay updated with this event.'}
                  </p>
                  <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                    <strong>Organization:</strong> ${organization_name || 'Community Event'}
                  </p>
                </div>
                
                <!-- Message Content -->
                <div style="background: #e8f4fd; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #d1e7dd;">
                  <p style="color: #0A2540; margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">
                    <strong>From:</strong> ${sender_name}
                  </p>
                  <div style="background: white; padding: 20px; border-radius: 8px; border-left: 3px solid #E8A87C;">
                    <p style="color: #333; margin: 0; font-style: italic; line-height: 1.6; font-size: 16px;">
                      "${message}"
                    </p>
                  </div>
                </div>
                
                <!-- Call to Action -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="https://taylor-connect-hub.vercel.app/opportunities" 
                     style="background: #0A2540; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; transition: background-color 0.3s;">
                    View Event Chat →
                  </a>
                </div>
                
                <!-- Footer Info -->
                <div style="background: #f6f9fc; padding: 20px; border-radius: 12px; margin: 25px 0;">
                  <p style="color: #525f7f; margin: 0; font-size: 14px; line-height: 1.5;">
                    <strong>Manage Notifications:</strong> You can control your notification preferences in your account settings.<br>
                    <strong>Event Updates:</strong> Stay informed about changes and new opportunities.
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #0A2540; padding: 25px; text-align: center;">
                <p style="color: #ffffff; margin: 0; font-size: 14px;">© 2024 Taylor Connect Hub. All rights reserved.</p>
                <p style="color: #E8A87C; margin: 5px 0 0 0; font-size: 12px;">Connecting communities through meaningful service</p>
              </div>
            </div>
          </body>
          </html>
        `;

          // Send email with retry logic and rate limiting
          const emailResponse = await retryWithBackoff(async () => {
            return await resend.emails.send({
              from: 'Taylor Connect Hub <noreply@ellmangroup.org>',
              to: [user_email],
              subject: `New message in "${event_title}" chat`,
              html: htmlContent,
            });
          });

          if (emailResponse.error) {
            const errorMsg = `Failed to send email: ${emailResponse.error}`;
            console.error(`[${requestId}] ${errorMsg}`);
            errors.push({ notificationId: id, error: errorMsg });
            errorCount++;
            continue;
          }

          // Mark notification as sent
          const { error: markError } = await supabaseClient
            .rpc('mark_notification_sent', { p_notification_id: id });

          if (markError) {
            const errorMsg = `Failed to mark notification as sent: ${markError.message}`;
            console.error(`[${requestId}] ${errorMsg}`);
            errors.push({ notificationId: id, error: errorMsg });
            errorCount++;
          } else {
            successCount++;
            console.log(`[${requestId}] Successfully sent notification ${id} to ${user_email}`);
          }

          processedCount++;

          // Rate limiting: delay between emails
          if (processedCount < totalNotifications) {
            await delay(RATE_LIMIT_DELAY_MS);
          }

      } catch (error) {
          const errorMsg = `Unexpected error processing notification ${notification.id}: ${error.message}`;
          console.error(`[${requestId}] ${errorMsg}`);
          errors.push({ notificationId: notification.id, error: errorMsg });
          errorCount++;
          processedCount++;
        }
      }

      // Add delay between batches to prevent overwhelming the email service
      if (batchIndex < batches.length - 1) {
        console.log(`[${requestId}] Completed batch ${batchIndex + 1}, waiting before next batch...`);
        await delay(1000); // 1 second delay between batches
      }
    }

    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;
    const processingTimeSec = (processingTimeMs / 1000).toFixed(2);

    // Production logging with comprehensive metrics
    console.log(`[${requestId}] PROCESSING COMPLETE:`);
    console.log(`[${requestId}] - Total notifications: ${totalNotifications}`);
    console.log(`[${requestId}] - Processed: ${processedCount}`);
    console.log(`[${requestId}] - Successful: ${successCount}`);
    console.log(`[${requestId}] - Errors: ${errorCount}`);
    console.log(`[${requestId}] - Processing time: ${processingTimeSec}s`);
    console.log(`[${requestId}] - Batches processed: ${batches.length}`);
    
    if (errors.length > 0) {
      console.error(`[${requestId}] ERRORS ENCOUNTERED:`);
      errors.forEach((err, index) => {
        console.error(`[${requestId}] Error ${index + 1}: Notification ${err.notificationId} - ${err.error}`);
      });
    }

    const response = {
      success: true,
      requestId,
      message: `Processed ${processedCount}/${totalNotifications} notifications in ${processingTimeSec}s`,
      stats: {
        total: totalNotifications,
        processed: processedCount,
        successful: successCount,
        errors: errorCount,
        batches: batches.length,
        processingTimeMs,
        processingTimeSec: parseFloat(processingTimeSec)
      },
      errors: errors.length > 0 ? errors : undefined
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;
    
    console.error(`[${requestId}] CRITICAL ERROR in send-chat-notifications:`);
    console.error(`[${requestId}] Error: ${error.message}`);
    console.error(`[${requestId}] Stack: ${error.stack}`);
    console.error(`[${requestId}] Processing time before error: ${processingTimeMs}ms`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process chat notifications',
        requestId,
        details: error.message,
        processingTimeMs
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});