import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get notification statistics for monitoring
    const { data: stats, error: statsError } = await supabaseClient
      .rpc('get_notification_stats');

    if (statsError) {
      console.error('Error getting notification stats:', statsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to get notification stats',
        details: statsError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notificationStats = stats?.[0] || {};
    const { immediate_pending = 0 } = notificationStats;

    // Only process if there are pending notifications
    if (immediate_pending === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending notifications to process',
        stats: notificationStats
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the send-chat-notifications function
    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-chat-notifications`;
    const functionResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ automated: true })
    });

    const functionResult = await functionResponse.json();

    if (!functionResponse.ok) {
      console.error('Error calling send-chat-notifications:', functionResult);
      return new Response(JSON.stringify({ 
        error: 'Failed to process notifications',
        details: functionResult 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log successful processing for monitoring
    console.log(`Cron job processed ${functionResult.processed || 0} notifications`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Notifications processed successfully',
      stats: notificationStats,
      processing_result: functionResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-notifications-cron:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});