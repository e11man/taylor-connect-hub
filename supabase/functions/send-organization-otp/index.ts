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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, organizationName }: OTPEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Community Connect <onboarding@resend.dev>",
      to: [email],
      subject: "Verify Your Organization Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00AFCE; margin-bottom: 10px;">Community Connect</h1>
            <h2 style="color: #333; margin-bottom: 20px;">Organization Verification</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
              Hello <strong>${organizationName}</strong>,
            </p>
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
              Thank you for registering your organization with Community Connect. To complete your registration, please use the verification code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #00AFCE; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              <strong>Important:</strong> After verification, your organization will need admin approval before you can access the platform. You'll receive an email notification once approved.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              Community Connect - Connecting volunteers with meaningful opportunities
            </p>
          </div>
        </div>
      `,
    });

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-organization-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);