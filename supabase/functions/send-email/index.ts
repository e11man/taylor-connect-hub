import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("🔄 Send Email Hook called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    const { user, email_data } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new: string;
        token_hash_new: string;
      };
    };

    console.log("📧 Processing email request:", {
      email: user.email,
      action: email_data.email_action_type,
      hasToken: !!email_data.token
    });

    // Check if Resend API key is available
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("❌ RESEND_API_KEY not found in environment");
      throw new Error("Email service not configured");
    }

    let subject = "Verify Your Email";
    let html = "";

    // Handle different email types
    if (email_data.email_action_type === "signup" || email_data.email_action_type === "email") {
      subject = "Verify Your Email";
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin-bottom: 10px;">Verify Your Email</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 32px; border-radius: 12px; margin-bottom: 20px;">
            <p style="color: #666; font-size: 16px; margin-bottom: 24px; text-align: center;">
              We sent a 6-digit code to<br/>
              <strong style="color: #1a1a1a;">${user.email}</strong>
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 24px;">
                <div style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #1a1a1a;">
                  ${email_data.token}
                </div>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 24px;">
              This code will expire in 10 minutes.
            </p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p style="margin-bottom: 8px;">Didn't request this code?</p>
            <p style="margin: 0;">You can safely ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Community Connect - Connecting volunteers with meaningful opportunities
            </p>
          </div>
        </div>
      `;
    } else if (email_data.email_action_type === "recovery") {
      subject = "Reset Your Password";
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin-bottom: 10px;">Reset Your Password</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 32px; border-radius: 12px; margin-bottom: 20px;">
            <p style="color: #666; font-size: 16px; margin-bottom: 24px; text-align: center;">
              Use this code to reset your password:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 24px;">
                <div style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #1a1a1a;">
                  ${email_data.token}
                </div>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 24px;">
              This code will expire in 10 minutes.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Community Connect - Connecting volunteers with meaningful opportunities
            </p>
          </div>
        </div>
      `;
    }

    console.log("📨 Sending email via Resend...");
    
    const emailResponse = await resend.emails.send({
      from: "Community Connect <onboarding@resend.dev>",
      to: [user.email],
      subject,
      html,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    // Return empty response with 200 status as required by Supabase
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-email hook:", error);
    
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.status || 500,
          message: error.message || "Failed to send email"
        }
      }),
      {
        status: error.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);