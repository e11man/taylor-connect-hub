import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from 'lucide-react';

const dormAndFloorData = {
  "Away From Campus": ["Upland (abroad)"],
  "Bergwall Hall": ["1st Bergwall", "2nd Bergwall", "3rd Bergwall", "4th Bergwall"],
  "Breuninger Hall": ["1st Breuninger", "2nd Breuninger", "3rd Breuninger"],
  "Brolund Hall": ["Residential Village Wing 6"],
  "Campbell Hall": ["Univ Apts-Campbell Hall-1st Fl", "Univ Apts-Campbell Hall-2nd Fl"],
  "Chiu Hall": ["Residential Village Wing 1"],
  "Commuter": ["Married", "Single"],
  "Corner House": ["Corner House Wing"],
  "Delta Apts": ["Delta Wing"],
  "English Hall": [
    "1st North English", "1st South English", "2nd Center English",
    "2nd North English", "2nd South English", "3rd Center English",
    "3rd North English", "3rd South English", "English Hall - Cellar"
  ],
  "Flanigan Hall": ["Residential Village Wing 3"],
  "Gerig Hall": ["2nd Gerig", "3rd Gerig", "4th Gerig"],
  "Gygi Hall": ["Residential Village Wing 2"],
  "Haven on 2nd": ["Second South Street", "West Spencer Avenue"],
  "Jacobsen Hall": ["Residential Village Wing 7"],
  "Kerlin Hall": ["Residential Village Wing 5"],
  "Off-Campus Housing": ["Off-Campus Housing"],
  "Olson Hall": [
    "1st East Olson", "1st West Olson", "2nd Center Olson",
    "2nd East Olson", "2nd West Olson", "3rd Center Olson",
    "3rd East Olson", "3rd West Olson"
  ],
  "Robbins Hall": ["Residential Village Wing 4"],
  "Sammy Morris Hall": [
    "1st Morris Center", "1st Morris North", "1st Morris South",
    "2nd Morris Center", "2nd Morris North", "2nd Morris South",
    "3rd Morris Center", "3rd Morris North", "3rd Morris South",
    "4th Morris Center", "4th Morris North", "4th Morris South"
  ],
  "Swallow Robin Hall": ["1st Swallow", "2nd Swallow", "3rd Swallow"],
  "The Flats Apartments": ["Casa Wing"],
  "Wengatz Hall": [
    "1st East Wengatz", "1st West Wengatz", "2nd Center Wengatz",
    "2nd East Wengatz", "2nd West Wengatz", "3rd Center Wengatz",
    "3rd East Wengatz", "3rd West Wengatz"
  ],
  "Wolgemuth Hall": [
    "Univ Apt-Wolgemuth Hall-1st Fl", "Univ Apt-Wolgemuth Hall-2nd Fl", "Univ Apt-Wolgemuth Hall-3rd Fl"
  ]
};

export function TaylorUserSignUp() {
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

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (isTaylorUser && (!selectedDorm || !selectedFloor)) {
      alert('Please select your dorm and floor.');
      return;
    }
    console.log('Signing up with:', { email, password, selectedDorm, selectedFloor, isTaylorUser });
    // Add your sign-up logic here, potentially different for Taylor vs non-Taylor users
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

        {isTaylorUser && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Residence Hall</label>
              <Select onValueChange={setSelectedDorm} value={selectedDorm}>
                <SelectTrigger className="w-full h-12 bg-background border-input">
                  <SelectValue placeholder="Select Your Dorm" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {dorms.map((dorm) => (
                    <SelectItem key={dorm} value={dorm} className="cursor-pointer">{dorm}</SelectItem>
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
                <SelectContent className="max-h-60">
                  {floors.map((floor) => (
                    <SelectItem key={floor} value={floor} className="cursor-pointer">{floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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