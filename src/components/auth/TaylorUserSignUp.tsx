import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Info } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getEmailConfirmUrl } from "@/utils/config";
import { dormAndFloorData } from "@/utils/dormData";
import { OTPVerification } from "./OTPVerification";
import { ApprovalPendingMessage } from "./ApprovalPendingMessage";
import { Alert, AlertDescription } from "@/components/ui/alert";


interface TaylorUserSignUpProps {
  onClose?: () => void;
}

export function TaylorUserSignUp({ onClose }: TaylorUserSignUpProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedDorm, setSelectedDorm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [isTaylorUser, setIsTaylorUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showApprovalPending, setShowApprovalPending] = useState(false);
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);

  useEffect(() => {
    if (email.endsWith('@taylor.edu')) {
      setIsTaylorUser(true);
    } else {
      setIsTaylorUser(false);
      setSelectedDorm('');
      setSelectedFloor('');
      // Hide password warning when email changes to non-Taylor
      setShowPasswordWarning(false);
    }
  }, [email]);

  const { toast } = useToast();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match!",
        variant: "destructive",
      });
      return;
    }
    
    if (isTaylorUser && (!selectedDorm || !selectedFloor)) {
      toast({
        title: "Error", 
        description: "Please select your dorm and floor.",
        variant: "destructive",
      });
      return;
    }

    try {
      const redirectUrl = getEmailConfirmUrl('/');
      
      // Both Taylor and non-Taylor users should not auto-login until email is verified
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_type: isTaylorUser ? 'student' : 'external',
            dorm: selectedDorm,
            wing: selectedFloor,
          }
        }
      });

      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // CRITICAL: Sign out immediately to prevent auto-login
        await supabase.auth.signOut();
        
        if (isTaylorUser) {
          toast({
            title: "Verification Code Sent! 📧",
            description: "Please check your email for a 6-digit verification code.",
          });
          setShowOTPVerification(true);
        } else {
          toast({
            title: "Account Created Successfully! 📝",
            description: "Your account has been submitted for admin approval.",
          });
          setShowApprovalPending(true);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const dorms = Object.keys(dormAndFloorData);
  const floors = selectedDorm ? dormAndFloorData[selectedDorm as keyof typeof dormAndFloorData] : [];

  const handleVerificationComplete = () => {
    setShowOTPVerification(false);
    onClose?.();
  };

  const handleBackToSignUp = () => {
    setShowOTPVerification(false);
  };

  const handleApprovalPendingClose = () => {
    setShowApprovalPending(false);
    onClose?.();
  };

  if (showOTPVerification) {
    return (
      <OTPVerification 
        email={email}
        onVerificationComplete={handleVerificationComplete}
        onBack={handleBackToSignUp}
      />
    );
  }

  if (showApprovalPending) {
    return (
      <ApprovalPendingMessage 
        email={email}
        onClose={handleApprovalPendingClose}
      />
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-primary">Create Account</h2>
        <p className="text-muted-foreground text-sm">
          {isTaylorUser 
            ? "Sign up to connect with Taylor University community." 
            : "Non-Taylor email accounts require admin approval."}
        </p>
      </div>
      
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email (e.g., john_doe@taylor.edu)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
          required
        />
        
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Show warning when Taylor user starts typing password
                if (isTaylorUser && e.target.value.length > 0) {
                  setShowPasswordWarning(true);
                }
              }}
              onFocus={() => {
                // Show warning when Taylor user focuses on password field
                if (isTaylorUser && password.length === 0) {
                  setShowPasswordWarning(true);
                }
              }}
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

          {/* Password security warning for Taylor users */}
          {showPasswordWarning && isTaylorUser && (
            <Alert className="border-amber-200 bg-amber-50 transition-all duration-300 animate-in fade-in slide-in-from-top-1">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                For your security, please do not reuse your Taylor email password.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`h-12 pr-12 ${
              confirmPassword && password !== confirmPassword 
                ? 'border-destructive focus:ring-destructive' 
                : ''
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {confirmPassword && password !== confirmPassword && (
          <p className="text-destructive text-sm">Passwords do not match</p>
        )}

        {isTaylorUser && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Residence Hall</label>
              <Select onValueChange={setSelectedDorm} value={selectedDorm}>
                <SelectTrigger className="w-full h-12 bg-background border-input">
                  <SelectValue placeholder="Select Your Dorm" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-background border-input z-50">
                  {dorms.map((dorm) => (
                    <SelectItem key={dorm} value={dorm} className="cursor-pointer hover:bg-accent">{dorm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Floor/Wing</label>
              <Select onValueChange={setSelectedFloor} value={selectedFloor} disabled={!selectedDorm}>
                <SelectTrigger className={`w-full h-12 bg-background border-input ${
                  !selectedDorm ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  <SelectValue placeholder={selectedDorm ? "Select Your Floor" : "Select dorm first"} />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-background border-input z-50">
                  {floors.map((floor) => (
                    <SelectItem key={floor} value={floor} className="cursor-pointer hover:bg-accent">{floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!isTaylorUser && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Non-Taylor email accounts require admin approval before access is granted.
            </p>
          </div>
        )}

        <Button 
          onClick={handleSignUp} 
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          disabled={
            password !== confirmPassword || 
            !password || 
            !confirmPassword || 
            (isTaylorUser && (!selectedDorm || !selectedFloor))
          }
        >
          Create Account
        </Button>
      </div>
    </div>
  );
}