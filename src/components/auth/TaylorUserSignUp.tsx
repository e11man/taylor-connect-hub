import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getEmailConfirmUrl } from "@/utils/config";
import { dormAndFloorData } from "@/utils/dormData";



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

  useEffect(() => {
    if (email.endsWith('@taylor.edu')) {
      setIsTaylorUser(true);
    } else {
      setIsTaylorUser(false);
      setSelectedDorm('');
      setSelectedFloor('');
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
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
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
        toast({
          title: "Success!",
          description: "Please check your email to confirm your account.",
        });
        onClose?.();
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

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-primary">Create Account</h2>
        <p className="text-muted-foreground text-sm">Sign up to connect with Taylor University community.</p>
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

        <Button 
          onClick={handleSignUp} 
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          disabled={password !== confirmPassword || !password || !confirmPassword}
        >
          Create Account
        </Button>
      </div>
    </div>
  );
}