import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface SignupData {
  userId: string;
  eventId: string;
  signedUpBy?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { signups }: { signups: SignupData[] } = await req.json();

    if (!signups || signups.length === 0) {
      return new Response(JSON.stringify({ error: 'No signups provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailPromises = [];

    for (const signup of signups) {
      // Get user details
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('user_id', signup.userId)
        .single();

      if (!profile) continue;

      // Get event details
      const { data: event } = await supabaseClient
        .from('events')
        .select(`
          title,
          description,
          date,
          location,
          organizations (name)
        `)
        .eq('id', signup.eventId)
        .single();

      if (!event) continue;

      // Get PA details if signed up by someone else
      let paName = null;
      if (signup.signedUpBy) {
        const { data: paProfile } = await supabaseClient
          .from('profiles')
          .select('email')
          .eq('user_id', signup.signedUpBy)
          .single();
        
        paName = paProfile?.email?.split('@')[0] || 'Your PA';
      }

      // Format date and time
      const eventDate = new Date(event.date);
      const dateStr = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = eventDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Send email
      const emailPromise = resend.emails.send({
        from: 'Community Connect <notifications@resend.dev>',
        to: [profile.email],
        subject: `You're signed up for "${event.title}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Event Signup Confirmation</h1>
            
            ${paName ? `
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #1976d2;">
                  <strong>${paName}</strong> has signed you up for this event.
                </p>
              </div>
            ` : ''}
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              You have been successfully signed up for the following event:
            </p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; font-size: 20px; margin-top: 0;">${event.title}</h2>
              
              <p style="color: #666; margin: 10px 0;">
                ${event.description}
              </p>
              
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${dateStr}</p>
                <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${timeStr}</p>
                <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${event.location}</p>
                ${event.organizations?.name ? `<p style="margin: 5px 0;"><strong>🏢 Organized by:</strong> ${event.organizations.name}</p>` : ''}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              To view or manage your event signups, please log in to your Community Connect account.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated message from Community Connect. Please do not reply to this email.
            </p>
          </div>
        `,
      });

      emailPromises.push(emailPromise);
    }

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email send results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successful} emails successfully`,
        successful,
        failed 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-signup-confirmation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});