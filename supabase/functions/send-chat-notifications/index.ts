import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get pending notifications that need to be sent
    const { data: notifications, error: notificationsError } = await supabaseClient
      .from('notifications')
      .select(`
        *,
        chat_messages (
          message,
          is_anonymous,
          user_id,
          organization_id,
          organizations (name)
        ),
        events (
          title,
          organizations (name)
        )
      `)
      .is('sent_at', null)
      .lte('scheduled_for', new Date().toISOString());

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      return new Response(JSON.stringify({ error: notificationsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${notifications?.length || 0} notifications to send`);

    // Get user profiles for email addresses
    for (const notification of notifications || []) {
      try {
        // Get user email from auth.users
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(notification.user_id);
        
        if (userError || !userData.user?.email) {
          console.error('Error getting user email:', userError);
          continue;
        }

        const userEmail = userData.user.email;
        const chatMessage = notification.chat_messages;
        const event = notification.events;

        // Determine sender type and name
        let senderName = 'Anonymous';
        if (chatMessage.organization_id) {
          senderName = `${chatMessage.organizations?.name || 'Organization'} (Host)`;
        } else if (chatMessage.user_id && !chatMessage.is_anonymous) {
          senderName = 'Volunteer';
        }

        // Send email notification
        const emailResponse = await resend.emails.send({
          from: 'Community Events <notifications@resend.dev>',
          to: [userEmail],
          subject: `New message in "${event?.title}" chat`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Chat Message</h2>
              <p>There's a new message in the event chat for <strong>"${event?.title}"</strong></p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>From:</strong> ${senderName}</p>
                <p><strong>Message:</strong></p>
                <p style="font-style: italic;">"${chatMessage?.message}"</p>
              </div>
              
              <p>Visit the event page to join the conversation and stay updated.</p>
              
              <hr style="margin: 30px 0; border: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                You're receiving this because you're signed up for this event. 
                You can manage your notification preferences in your account settings.
              </p>
            </div>
          `,
        });

        if (emailResponse.error) {
          console.error('Error sending email:', emailResponse.error);
          continue;
        }

        // Mark notification as sent
        await supabaseClient
          .from('notifications')
          .update({ 
            sent_at: new Date().toISOString(),
            email_sent: true 
          })
          .eq('id', notification.id);

        console.log(`Sent notification to ${userEmail} for event ${event?.title}`);

      } catch (error) {
        console.error('Error processing notification:', error);
        continue;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: notifications?.length || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-chat-notifications function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});