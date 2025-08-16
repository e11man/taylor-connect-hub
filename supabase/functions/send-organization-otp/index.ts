import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  otp: string;
  organizationName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔄 Edge function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Processing OTP email request");
    
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
      organizationName: body.organizationName,
      otpLength: body.otp?.length 
    });

    const { email, otp, organizationName }: OTPEmailRequest = body;

    if (!email || !otp || !organizationName) {
      throw new Error("Missing required fields: email, otp, or organizationName");
    }

    console.log("📨 Sending email via Resend...");
    
    const emailResponse = await resend.emails.send({
      from: "Main Street Connect <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your organization - Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00AFCE; margin-bottom: 10px;">Main Street Connect</h1>
            <h2 style="color: #333; margin-bottom: 20px;">Organization Verification</h2>
          </div>
          
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
              Hello ${organizationName},
            </p>
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
              Thank you for registering your organization with Main Street Connect. To complete your registration, please use the verification code below:
            </p>
            
            <div style="background-color: #00AFCE; color: white; font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              Main Street Connect - Connecting volunteers with meaningful opportunities
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ Email sent successfully:", emailResponse);

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
    console.error("❌ Error in send-organization-otp function:", error);
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