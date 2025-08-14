import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendVerificationCode } from '@/utils/emailService';
import { DynamicText } from '@/components/content/DynamicText';
import { useContent } from '@/hooks/useContent';
import { useAuth } from "@/contexts/AuthContext";

interface Taylor2FAVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onBack: () => void;
  password?: string; // Add password for auto-login
}

export function Taylor2FAVerification({ email, onVerificationComplete, onBack, password }: Taylor2FAVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Dynamic content
  const { content: invalidCodeTitle } = useContent('twoFA', 'errors', 'invalidCodeTitle', 'Invalid Code');
  const { content: invalidCodeDesc } = useContent('twoFA', 'errors', 'invalidCodeDescription', 'Please enter the complete 6-digit verification code.');
  const { content: verificationFailedTitle } = useContent('twoFA', 'errors', 'verificationFailedTitle', 'Verification Failed');
  const { content: userNotFoundDesc } = useContent('twoFA', 'errors', 'userNotFoundDescription', 'User not found. Please try again.');
  const { content: incorrectCodeDesc } = useContent('twoFA', 'errors', 'incorrectCodeDescription', 'The verification code you entered is incorrect. Please try again.');
  const { content: failedActivateDesc } = useContent('twoFA', 'errors', 'failedActivateDescription', 'Failed to activate account. Please try again.');
  const { content: accountVerifiedTitle } = useContent('twoFA', 'success', 'accountVerifiedTitle', 'Account Verified! 🎉');
  const { content: accountVerifiedDesc } = useContent('twoFA', 'success', 'accountVerifiedDescription', 'Your account has been successfully verified. You can now sign in.');
  const { content: errorTitle } = useContent('twoFA', 'toast', 'errorTitle', 'Error');
  const { content: unexpectedError } = useContent('twoFA', 'toast', 'unexpectedError', 'An unexpected error occurred. Please try again.');
  const { content: resendFailedTitle } = useContent('twoFA', 'errors', 'resendFailedTitle', 'Resend Failed');
  const { content: resendFailedGenerateDesc } = useContent('twoFA', 'errors', 'resendFailedGenerateDescription', 'Failed to generate new code. Please try again.');
  const { content: codeResentTitle } = useContent('twoFA', 'success', 'codeResentTitle', 'Code Resent');
  const { content: codeResentDesc } = useContent('twoFA', 'success', 'codeResentDescription', 'A new verification code has been sent to your email address.');
  const { content: resendFailedSendDesc } = useContent('twoFA', 'errors', 'resendFailedSendDescription', 'Failed to send verification code. Please try again.');
  const { content: headerTitle } = useContent('twoFA', 'page', 'title', 'Verify Your Email');
  const { content: headerSubtitlePrefix } = useContent('twoFA', 'page', 'subtitlePrefix', "We've sent a 6-digit verification code to");
  const { content: codeInputLabel } = useContent('twoFA', 'form', 'codeInputLabel', 'Enter Verification Code');
  const { content: codeInputPlaceholder } = useContent('twoFA', 'form', 'codeInputPlaceholder', '0');
  const { content: verifyingButton } = useContent('twoFA', 'buttons', 'verifying', 'Verifying...');
  const { content: verifyCodeButton } = useContent('twoFA', 'buttons', 'verifyCode', 'Verify Code');
  const { content: didntReceive } = useContent('twoFA', 'resend', 'prompt', "Didn't receive the code?");
  const { content: resendCodeButton } = useContent('twoFA', 'buttons', 'resendCode', 'Resend Code');
  const { content: resendInPrefix } = useContent('twoFA', 'resend', 'resendInPrefix', 'Resend in');
  const { content: backToSignUp } = useContent('twoFA', 'buttons', 'backToSignUp', 'Back to Sign Up');

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
        title: invalidCodeTitle,
        description: invalidCodeDesc,
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
          title: verificationFailedTitle,
          description: userNotFoundDesc,
          variant: "destructive",
        });
        return;
      }

      if (data.verification_code !== otpString) {
        toast({
          title: invalidCodeTitle,
          description: incorrectCodeDesc,
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
          title: verificationFailedTitle,
          description: failedActivateDesc,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: accountVerifiedTitle,
        description: accountVerifiedDesc,
      });
      
      // Auto-login the user after successful verification
      if (password) {
        try {
          const loginResult = await signIn(email, password);
          if (loginResult.error) {
            toast({
              title: "Auto-login Failed",
              description: "Account verified but login failed. Please log in manually.",
              variant: "destructive",
            });
          } else {
            // Auto-login successful, user will be redirected to dashboard
            toast({
              title: "Welcome! 🎉",
              description: "Account verified and logged in successfully!",
            });
          }
        } catch (error) {
          toast({
            title: "Auto-login Error",
            description: "Account verified but login failed. Please log in manually.",
            variant: "destructive",
          });
        }
      }
      
      onVerificationComplete();
    } catch (error) {
      toast({
        title: errorTitle,
        description: unexpectedError,
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
          title: resendFailedTitle,
          description: resendFailedGenerateDesc,
          variant: "destructive",
        });
        return;
      }

      // Update verification code in database (email service will handle the rest)
      const emailResult = await sendVerificationCode(email, newCode);
      if (!emailResult.success) {
        throw new Error('Failed to update verification code');
      }

      toast({
        title: codeResentTitle,
        description: codeResentDesc,
      });
      
      setCanResend(false);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      toast({
        title: resendFailedTitle,
        description: resendFailedSendDesc,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          <DynamicText page="twoFA" section="page" contentKey="title" fallback="Verify Your Email" />
        </CardTitle>
        <p className="text-muted-foreground">
          {headerSubtitlePrefix} <strong>{email}</strong>
        </p>

      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            <DynamicText page="twoFA" section="form" contentKey="codeInputLabel" fallback="Enter Verification Code" />
          </label>
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={otp.join('')}
            onChange={(e) => {
              // Only allow digits and limit to 6 characters
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              // Split into array for backward compatibility
              const newOtp = value.split('').concat(Array(6).fill('')).slice(0, 6);
              setOtp(newOtp);
            }}
            className="h-12 text-center text-lg font-mono tracking-widest"
            maxLength={6}
          />
          <p className="text-xs text-muted-foreground text-center">
            Paste or type your 6-digit verification code
          </p>
        </div>

        <Button
          onClick={handleVerifyOTP}
          disabled={otp.join('').length !== 6 || isLoading}
          className="w-full"
        >
          {isLoading ? verifyingButton : verifyCodeButton}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            <DynamicText page="twoFA" section="resend" contentKey="prompt" fallback="Didn't receive the code?" />
          </p>
          <Button
            variant="outline"
            onClick={handleResendOTP}
            disabled={!canResend}
            className="w-full"
          >
            {canResend ? resendCodeButton : `${resendInPrefix} ${countdown}s`}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full"
        >
          {backToSignUp}
        </Button>
      </CardContent>
    </Card>
  );
} 