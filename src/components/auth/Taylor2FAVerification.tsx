import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendVerificationCode } from '@/utils/emailService';

interface Taylor2FAVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onBack: () => void;
}

export function Taylor2FAVerification({ email, onVerificationComplete, onBack }: Taylor2FAVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { toast } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verify the OTP against the database
      const { data, error } = await supabase
        .from('profiles')
        .select('id, verification_code, status')
        .eq('email', email)
        .single();

      if (error || !data) {
        toast({
          title: "Verification Failed",
          description: "User not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.verification_code !== otpString) {
        toast({
          title: "Invalid Code",
          description: "The verification code you entered is incorrect. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update user status to active and clear verification code
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'active',
          verification_code: null 
        })
        .eq('email', email);

      if (updateError) {
        toast({
          title: "Verification Failed",
          description: "Failed to activate account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account Verified! 🎉",
        description: "Your account has been successfully verified. You can now sign in.",
      });
      
      onVerificationComplete();
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
      // Generate new 6-digit code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Update verification code in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verification_code: newCode })
        .eq('email', email);

      if (updateError) {
        toast({
          title: "Resend Failed",
          description: "Failed to generate new code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Send new code via Resend
      const emailSent = await sendVerificationCode(email, newCode);
      if (!emailSent) {
        throw new Error('Failed to send verification code');
      }

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
      
      setCanResend(false);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      toast({
        title: "Resend Failed",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Enter Verification Code</label>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-mono"
                placeholder="0"
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleVerifyOTP}
          disabled={otp.join('').length !== 6 || isLoading}
          className="w-full"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>
          <Button
            variant="outline"
            onClick={handleResendOTP}
            disabled={!canResend}
            className="w-full"
          >
            {canResend ? "Resend Code" : `Resend in ${countdown}s`}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full"
        >
          Back to Sign Up
        </Button>
      </CardContent>
    </Card>
  );
} 