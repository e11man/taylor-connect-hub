import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  otp: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔄 User verification email function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Processing user verification email request");
    
    // Check if Resend API key is available
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("❌ RESEND_API_KEY not found in environment");
      throw new Error("Email service not configured");
    }
    console.log("✅ Resend API key found");

    const body = await req.json();
    console.log("📄 Request body received:", { 
      email: body.email, 
      userName: body.userName,
      otpLength: body.otp?.length 
    });

    const { email, otp, userName }: VerificationEmailRequest = body;

    if (!email || !otp) {
      throw new Error("Missing required fields: email or otp");
    }

    console.log("📨 Sending verification email via Resend...");
    
    const emailResponse = await resend.emails.send({
      from: "Community Connect <onboarding@resend.dev>",
      to: [email],
      subject: "Verify Your Account - Community Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00AFCE; margin-bottom: 10px;">Community Connect</h1>
            <h2 style="color: #333; margin-bottom: 20px;">Account Verification</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
              Hello${userName ? ` ${userName}` : ''},
            </p>
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
              Welcome to Community Connect! To complete your account verification, please use the code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #00AFCE; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This verification code will expire in 10 minutes. If you didn't create an account with Community Connect, please ignore this email.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              Once verified, you'll be able to access all the amazing volunteer opportunities in your community!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              Community Connect - Connecting volunteers with meaningful opportunities
            </p>
            <p style="color: #888; font-size: 12px;">
              Taylor University Community Platform
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-user-verification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send verification email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);