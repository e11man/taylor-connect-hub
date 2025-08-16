import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface ApprovalRequest {
  organizationId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminUserId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { organizationId, action, rejectionReason, adminUserId }: ApprovalRequest = await req.json();

    console.log(`📧 Processing ${action} request for organization:`, organizationId);

    // Get organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      throw new Error('Organization not found');
    }

    console.log('✅ Organization found:', organization.name);

    // Update organization status using the appropriate function
    if (action === 'approve') {
      const { error: approveError } = await supabaseClient.rpc('approve_organization', {
        org_id: organizationId,
        admin_user_id: adminUserId
      });
      
      if (approveError) {
        throw new Error(`Failed to approve organization: ${approveError.message}`);
      }
    } else {
      const { error: rejectError } = await supabaseClient.rpc('reject_organization', {
        org_id: organizationId,
        admin_user_id: adminUserId,
        reason: rejectionReason || 'No reason provided'
      });
      
      if (rejectError) {
        throw new Error(`Failed to reject organization: ${rejectError.message}`);
      }
    }

    console.log(`✅ Organization status updated to: ${action}d`);

    // Send email notification
    const emailTemplate = action === 'approve' ? {
      subject: "Organization Approved - Main Street Connect",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Organization Approved - Main Street Connect</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #00AFCE; margin: 0;">Main Street Connect</h1>
                    <p style="color: #666; margin: 10px 0;">Connecting volunteers with meaningful opportunities</p>
                </div>
                
                <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                    <h2 style="color: #155724; margin-top: 0;">🎉 Your Organization Has Been Approved!</h2>
                    
                    <p style="color: #155724; font-size: 16px; margin-bottom: 15px;">
                        Hello <strong>${organization.name}</strong>,
                    </p>
                    
                    <p style="color: #155724; font-size: 16px; margin-bottom: 15px;">
                        Great news! Your organization has been approved by our admin team. You can now access your organization dashboard and start creating volunteer opportunities.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/organization-login" style="background-color: #00AFCE; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Access Your Dashboard
                        </a>
                    </div>
                    
                    <p style="color: #155724; font-size: 14px; margin-top: 20px;">
                        You can now:
                    </p>
                    <ul style="color: #155724; font-size: 14px;">
                        <li>Create and manage volunteer opportunities</li>
                        <li>View participant registrations</li>
                        <li>Communicate with volunteers</li>
                        <li>Track event success metrics</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        Main Street Connect - Connecting volunteers with meaningful opportunities
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    } : {
      subject: "Organization Registration Update - Main Street Connect",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Organization Registration Update - Main Street Connect</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #00AFCE; margin: 0;">Main Street Connect</h1>
                    <p style="color: #666; margin: 10px 0;">Connecting volunteers with meaningful opportunities</p>
                </div>
                
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                    <h2 style="color: #721c24; margin-top: 0;">Organization Registration Update</h2>
                    
                    <p style="color: #721c24; font-size: 16px; margin-bottom: 15px;">
                        Hello <strong>${organization.name}</strong>,
                    </p>
                    
                    <p style="color: #721c24; font-size: 16px; margin-bottom: 15px;">
                        After careful review, we regret to inform you that your organization registration has not been approved at this time.
                    </p>
                    
                    <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="color: #721c24; margin: 0; font-size: 14px;">
                            <strong>Reason:</strong> ${rejectionReason || 'No specific reason provided'}
                        </p>
                    </div>
                    
                    <p style="color: #721c24; font-size: 14px; margin-top: 20px;">
                        If you believe this decision was made in error or if you would like to provide additional information, please contact our support team.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                        Main Street Connect - Connecting volunteers with meaningful opportunities
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    console.log('📨 Sending notification email...');

    const emailResponse = await resend.emails.send({
      from: "Main Street Connect <onboarding@resend.dev>",
      to: [organization.contact_email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    console.log('✅ Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResponse,
      organizationStatus: action === 'approve' ? 'approved' : 'rejected'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error('❌ Error processing approval request:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to process approval request"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);