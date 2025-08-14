import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { dormAndFloorData } from "@/utils/dormData";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Taylor2FAVerification } from './Taylor2FAVerification';

interface TaylorUserSignUpProps {
  onClose?: () => void;
}

export function TaylorUserSignUp({ onClose }: TaylorUserSignUpProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedDorm, setSelectedDorm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [requestedRole, setRequestedRole] = useState<string>('');
  const [isTaylorUser, setIsTaylorUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [show2FAVerification, setShow2FAVerification] = useState(false);

  const { signUp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (email.endsWith('@taylor.edu')) {
      setIsTaylorUser(true);
    } else {
      setIsTaylorUser(false);
      setSelectedDorm('');
      setSelectedFloor('');
      setShowPasswordWarning(false);
    }
  }, [email]);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match!",
        variant: "destructive",
      });
      return;
    }
    
    // Dorm selection is now optional for Taylor users
    // if (isTaylorUser && (!selectedDorm || !selectedFloor)) {
    //   toast({
    //     title: "Error", 
    //     description: "Please select your dorm and floor.",
    //     variant: "destructive",
      // });
      // return;
    // }

    setIsLoading(true);

    try {
      const { data, error } = await signUp({
        email,
        password,
        user_type: isTaylorUser ? 'student' : 'external',
        dorm: selectedDorm || null,
        wing: selectedFloor || null,
        requested_role: requestedRole || null,
      });

      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (isTaylorUser) {
          toast({
            title: "Account Created Successfully! 📧",
            description: "Please check your email for a verification code to complete your registration.",
          });
          setShow2FAVerification(true);
        } else {
          toast({
            title: "Account Created Successfully! 📝",
            description: "Your account has been submitted for admin approval.",
          });
          onClose?.();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: <DynamicText page="messages" section="error" contentKey="unexpected_error" fallback="An unexpected error occurred. Please try again." />,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    // If auto-login was successful, the user will already be redirected
    // If not, show the success message and close the modal
    toast({
      title: "Account Verified! 🎉",
      description: "Your account has been successfully verified. You can now sign in!",
    });
    onClose?.();
  };

  const handleBackToSignUp = () => {
    setShow2FAVerification(false);
  };

  // Show 2FA verification screen for Taylor users
  if (show2FAVerification && isTaylorUser) {
    return (
      <Taylor2FAVerification
        email={email}
        password={password}
        onVerificationComplete={handleVerificationComplete}
        onBack={handleBackToSignUp}
      />
    );
  }

  const dorms = Object.keys(dormAndFloorData);
  const floors = selectedDorm ? dormAndFloorData[selectedDorm as keyof typeof dormAndFloorData] : [];

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

        <div className="space-y-1">
          <label className="text-sm font-medium">Leadership role (optional)</label>
          <Select onValueChange={setRequestedRole} value={requestedRole}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select a role (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="pa">PA</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="student_leader">Student Leader</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Admin approval required. Approved leaders can sign up groups.</p>
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder=<DynamicText page="auth" section="login" contentKey="password_label" fallback=<DynamicText page="auth" section="signup" contentKey="password_label" fallback=<DynamicText page="organizationLogin" section="page" contentKey="password_label" fallback=<DynamicText page="organizationRegister" section="page" contentKey="password_label" fallback="Password" /> /> /> />
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
            placeholder=<DynamicText page="auth" section="signup" contentKey="confirm_password_label" fallback=<DynamicText page="organizationRegister" section="page" contentKey="confirm_password_label" fallback="Confirm Password" /> />
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
              <label className="text-sm font-medium text-foreground">
                Residence Hall <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
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
              <label className="text-sm font-medium text-foreground">
                Floor/Wing <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
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
            isLoading ||
            password !== confirmPassword || 
            !password || 
            !confirmPassword
            // Dorm selection is now optional
            // || (isTaylorUser && (!selectedDorm || !selectedFloor))
          }
        >
          {isLoading ? "Creating Account..." : <DynamicText page="auth" section="signup" contentKey="create_account_title" fallback=<DynamicText page="auth" section="signup" contentKey="title" fallback=<DynamicText page="auth" section="signup" contentKey="submit" fallback=<DynamicText page="organizationRegister" section="page" contentKey="create_account_button" fallback="Create Account" /> /> /> />}
        </Button>
      </div>
    </div>
  );
}