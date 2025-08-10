import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DynamicText } from '@/components/content/DynamicText';
import { useContent } from '@/hooks/useContent';

const TestEmailVerification: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  // Dynamic content
  const { content: pageTitle } = useContent('emailVerification', 'page', 'title', 'Verify Your Email');
  const { content: sentToPrefix } = useContent('emailVerification', 'page', 'sentToPrefix', 'We sent a 6-digit code to');
  const { content: verifyButton } = useContent('emailVerification', 'buttons', 'verify', 'Verify Email');
  const { content: verifyingButton } = useContent('emailVerification', 'buttons', 'verifying', 'Verifying...');
  const { content: didntReceive } = useContent('emailVerification', 'resend', 'prompt', "Didn't receive the code?");
  const { content: resendCode } = useContent('emailVerification', 'resend', 'button', 'Resend Code');
  const { content: resendInPrefix } = useContent('emailVerification', 'resend', 'resendInPrefix', 'Resend in');
  const { content: hideMyEmail } = useContent('emailVerification', 'mobile', 'hideMyEmail', 'Hide My Email');
  const { content: toastCodeSentTitle } = useContent('emailVerification', 'toast', 'codeSentTitle', 'Code Sent! 📧');
  const { content: toastCodeSentDescPrefix } = useContent('emailVerification', 'toast', 'codeSentDescPrefix', 'Verification code sent to');
  const { content: toastErrorTitle } = useContent('emailVerification', 'toast', 'errorTitle', 'Error');
  const { content: toastSendFailedDesc } = useContent('emailVerification', 'toast', 'sendFailedDescription', 'Failed to send verification code. Check console for details.');
  const { content: invalidCodeTitle } = useContent('emailVerification', 'errors', 'invalidCodeTitle', 'Invalid Code');
  const { content: invalidCodeDescription } = useContent('emailVerification', 'errors', 'invalidCodeDescription', 'Please enter the complete 6-digit code.');
  const { content: verificationFailedTitle } = useContent('emailVerification', 'errors', 'verificationFailedTitle', 'Verification Failed');
  const { content: verifiedTitle } = useContent('emailVerification', 'success', 'verifiedTitle', 'Verified! 🎉');
  const { content: verifiedDescription } = useContent('emailVerification', 'success', 'verifiedDescription', 'Email verification successful.');
  const { content: verificationErrorDescription } = useContent('emailVerification', 'errors', 'verificationErrorDescription', 'Verification failed. Please try again.');
  
  const email = 'josh_ellman@taylor.edu';

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

  useEffect(() => {
    // Auto-trigger signup on component mount
    handleSignup();
  }, []);

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      // Generate a test password
      const testPassword = 'TestPassword123!';
      
      // Sign up with test email
      const { error } = await supabase.auth.signUp({
        email,
        password: testPassword,
        options: {
          data: {
            user_type: 'student',
            test_user: true
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: toastCodeSentTitle,
        description: `${toastCodeSentDescPrefix} ${email}`,
      });
    } catch (error: any) {
      toast({
        title: toastErrorTitle,
        description: error.message || toastSendFailedDesc,
        variant: "destructive",
      });
      console.error('Failed to trigger signup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast({
        title: invalidCodeTitle,
        description: invalidCodeDescription,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup'
      });
      
      if (error) {
        toast({
          title: verificationFailedTitle,
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: verifiedTitle,
          description: verifiedDescription,
        });
      }
    } catch (error) {
      toast({
        title: toastErrorTitle,
        description: verificationErrorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setCountdown(45);
    
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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        <button 
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-700"
          onClick={() => window.history.back()}
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <DynamicText page="emailVerification" section="page" contentKey="title" fallback="Verify Your Email" />
          </h2>
          <p className="text-gray-600">
            <DynamicText page="emailVerification" section="page" contentKey="sentToPrefix" fallback="We sent a 6-digit code to" />
            <br />
            <strong className="text-gray-900">{email}</strong>
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-14 h-14 text-center text-2xl font-medium border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${
                  index === 0 && digit === '' ? 'border-accent' : 'border-gray-300'
                }`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full h-12 bg-[#E4A89A] hover:bg-[#d49889] text-white font-medium rounded-lg"
          >
            {isLoading ? verifyingButton : verifyButton}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <DynamicText page="emailVerification" section="resend" contentKey="prompt" fallback="Didn't receive the code?" />
            </p>
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm text-accent hover:underline font-medium"
              >
                <DynamicText page="emailVerification" section="resend" contentKey="button" fallback="Resend Code" />
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                {resendInPrefix} {countdown}s
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile number pad - visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1C1C1E] p-4 md:hidden">
        <div className="max-w-sm mx-auto">
          <div className="text-white text-sm mb-4 flex justify-between items-center">
            <span className="truncate">{email}</span>
            <button className="text-accent ml-2">
              <DynamicText page="emailVerification" section="mobile" contentKey="hideMyEmail" fallback="Hide My Email" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => {
                  const emptyIndex = otp.findIndex(d => d === '');
                  if (emptyIndex !== -1) {
                    handleOtpChange(emptyIndex, num.toString());
                  }
                }}
                className="bg-[#3A3A3C] text-white text-xl font-medium py-4 rounded-lg hover:bg-[#4A4A4C] active:bg-[#2A2A2C]"
              >
                {num}
                {num === 2 && <div className="text-xs text-gray-400">ABC</div>}
                {num === 3 && <div className="text-xs text-gray-400">DEF</div>}
                {num === 4 && <div className="text-xs text-gray-400">GHI</div>}
                {num === 5 && <div className="text-xs text-gray-400">JKL</div>}
                {num === 6 && <div className="text-xs text-gray-400">MNO</div>}
                {num === 7 && <div className="text-xs text-gray-400">PQRS</div>}
                {num === 8 && <div className="text-xs text-gray-400">TUV</div>}
                {num === 9 && <div className="text-xs text-gray-400">WXYZ</div>}
              </button>
            ))}
            <div></div>
            <button
              onClick={() => {
                const emptyIndex = otp.findIndex(d => d === '');
                if (emptyIndex !== -1) {
                  handleOtpChange(emptyIndex, '0');
                }
              }}
              className="bg-[#3A3A3C] text-white text-xl font-medium py-4 rounded-lg hover:bg-[#4A4A4C] active:bg-[#2A2A2C]"
            >
              0
            </button>
            <button
              onClick={() => {
                const lastFilledIndex = otp.map((d, i) => d ? i : -1).filter(i => i !== -1).pop();
                if (lastFilledIndex !== undefined && lastFilledIndex >= 0) {
                  handleOtpChange(lastFilledIndex, '');
                }
              }}
              className="bg-[#3A3A3C] text-white text-xl font-medium py-4 rounded-lg hover:bg-[#4A4A4C] active:bg-[#2A2A2C] flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEmailVerification;