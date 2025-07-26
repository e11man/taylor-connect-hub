import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OTPVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onBack: () => void;
}

export function OTPVerification({ email, onVerificationComplete, onBack }: OTPVerificationProps) {
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
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Verified! 🎉",
          description: "You can now access the platform.",
        });
        onVerificationComplete();
      }
    } catch (error) {
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

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        toast({
          title: "Resend Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email.",
        });
        setCanResend(false);
        setCountdown(60);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-primary">Verify Your Email</h2>
        <p className="text-muted-foreground text-sm">
          We sent a 6-digit code to <strong>{email}</strong>
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
          {isLoading ? 'Verifying...' : 'Verify Email'}
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

        <Button 
          variant="ghost" 
          onClick={onBack}
          className="w-full"
        >
          Back to Sign Up
        </Button>
      </div>
    </div>
  );
}