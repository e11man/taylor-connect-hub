import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Resend with latest API
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting chat notification processing...');

    // Get pending notifications using the new optimized function
    const { data: notifications, error: notificationsError } = await supabaseClient
      .rpc('get_pending_notifications');

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      return new Response(JSON.stringify({ error: notificationsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${notifications?.length || 0} notifications to send`);

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending notifications',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process each notification
    for (const notification of notifications) {
      try {
        console.log(`Processing notification ${notification.id} for user ${notification.user_email}`);
        
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

        // Send email notification using latest Resend API
        const emailResponse = await resend.emails.send({
          from: 'Taylor Connect Hub <noreply@ellmangroup.org>',
          to: [user_email],
          subject: `New message in "${event_title}" chat`,
          html: htmlContent,
        });

        if (emailResponse.error) {
          console.error('Error sending email:', emailResponse.error);
          errorCount++;
          continue;
        }

        // Mark notification as sent using the new function
        const { error: markError } = await supabaseClient
          .rpc('mark_notification_sent', { p_notification_id: id });

        if (markError) {
          console.error('Error marking notification as sent:', markError);
          errorCount++;
        } else {
          successCount++;
          console.log(`Successfully sent notification to ${user_email} for event ${event_title}`);
        }

        processedCount++;

      } catch (error) {
        console.error('Error processing notification:', error);
        errorCount++;
        continue;
      }
    }

    console.log(`Processing complete: ${processedCount} processed, ${successCount} successful, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedCount,
      successful: successCount,
      errors: errorCount,
      message: `Processed ${processedCount} notifications with ${successCount} successful and ${errorCount} errors`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-chat-notifications function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});