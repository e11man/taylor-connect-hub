import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ForgotPasswordModal } from "@/components/modals/ForgotPasswordModal";
import { Taylor2FAVerification } from "@/components/auth/Taylor2FAVerification";
import { sendVerificationCode } from "@/utils/emailService";

interface TaylorUserLoginProps {
  onClose?: () => void;
}

export function TaylorUserLogin({ onClose }: TaylorUserLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);

  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        // Check if the error is about email verification
        if (result.error.message.includes('EMAIL_VERIFICATION_REQUIRED') || 
            result.error.message.includes('verify your email address') || 
            result.error.message.includes('verification code')) {
          
          // Automatically resend verification code
          setIsResendingCode(true);
          try {
            const { success } = await sendVerificationCode(email);
            if (success) {
              toast({
                title: "Verification Email Sent! 📧",
                description: "We've sent a new verification code to your email address.",
              });
              // Show verification modal
              setShowVerification(true);
            } else {
              toast({
                title: "Failed to Send Code",
                description: "Please try again or contact support.",
                variant: "destructive",
              });
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to send verification code. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsResendingCode(false);
          }
        } else {
          toast({
            title: "Login Failed",
            description: result.error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Welcome back! 👋",
          description: "You have successfully logged in.",
        });
        // Redirection is now handled automatically in AuthContext
        onClose?.();
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

  const handleVerificationComplete = () => {
    setShowVerification(false);
    // Try to login again after verification
    handleLogin();
  };

  const handleBackToLogin = () => {
    setShowVerification(false);
  };

  // If showing verification, render the verification component
  if (showVerification) {
    return (
      <Taylor2FAVerification
        email={email}
        onVerificationComplete={handleVerificationComplete}
        onBack={handleBackToLogin}
      />
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-primary">Welcome Back</h2>
        <p className="text-muted-foreground text-sm">Sign in to your Taylor Connect Hub account.</p>
      </div>
      
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
          required
        />
        
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button 
          onClick={handleLogin} 
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          disabled={isLoading || isResendingCode || !email || !password}
        >
          {isLoading ? "Signing In..." : isResendingCode ? "Sending Code..." : "Sign In"}
        </Button>
        
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-secondary hover:text-secondary/80 transition-colors duration-200 font-medium"
            onClick={() => setForgotPasswordModalOpen(true)}
          >
            Forgot your password?
          </button>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
      />
    </div>
  );
}