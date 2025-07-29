import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrganizationOTPVerificationProps {
  email: string;
  organizationName: string;
  onVerificationComplete: () => void;
  onBack: () => void;
}

export function OrganizationOTPVerification({ 
  email, 
  organizationName, 
  onVerificationComplete, 
  onBack 
}: OrganizationOTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Verifying OTP for organization:', organizationName);
      
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) {
        console.error('❌ OTP verification failed:', error);
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ OTP verified successfully');
        
        // Get current user to confirm email
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('🔄 Confirming organization email...');
          
          // Call the confirm_organization_email function
          const { error: confirmError } = await supabase.rpc('confirm_organization_email', {
            user_id: user.id
          });
          
          if (confirmError) {
            console.error('❌ Failed to confirm email:', confirmError);
            toast({
              title: "Email Confirmation Failed",
              description: "OTP verified but failed to update email status. Please contact support.",
              variant: "destructive",
            });
            return;
          }
          
          console.log('✅ Organization email confirmed successfully');
        }
        
        toast({
          title: "Organization Verified! 🎉",
          description: "Your organization is now verified and pending admin approval.",
        });
        onVerificationComplete();
      }
    } catch (error: any) {
      console.error('❌ Unexpected error during verification:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      console.log('🔄 Resending OTP for organization:', organizationName);
      
      // Generate new OTP and send via edge function
      const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      
      const newOtp = generateOTP();
      
      const { data, error } = await supabase.functions.invoke('send-organization-otp', {
        body: {
          email,
          otp: newOtp,
          organizationName
        }
      });

      if (error) {
        console.error('❌ Failed to resend OTP:', error);
        toast({
          title: "Resend Failed",
          description: error.message || "Failed to resend verification code.",
          variant: "destructive",
        });
      } else {
        console.log('✅ OTP resent successfully');
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email.",
        });
        setCanResend(false);
        setCountdown(60);
        setOtp(''); // Clear current OTP input
      }
    } catch (error: any) {
      console.error('❌ Unexpected error during resend:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-primary">Verify Your Organization</h2>
        <p className="text-muted-foreground text-sm">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
        <p className="text-muted-foreground text-xs">
          For organization: <strong>{organizationName}</strong>
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="flex justify-center">
          <InputOTP 
            maxLength={6} 
            value={otp} 
            onChange={setOtp}
            className="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          onClick={handleVerifyOTP} 
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? 'Verifying...' : 'Verify Organization'}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>
          {canResend ? (
            <Button 
              variant="outline" 
              onClick={handleResendOTP}
              className="text-sm"
            >
              Resend Code
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend in {countdown}s
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Next Steps:</strong> After verification, your organization will be reviewed by our admin team. You'll receive an email notification once approved and can then sign in to post volunteer opportunities.
          </p>
        </div>

        <Button 
          variant="ghost" 
          onClick={onBack}
          className="w-full"
        >
          Back to Registration
        </Button>
      </div>
    </div>
  );
}