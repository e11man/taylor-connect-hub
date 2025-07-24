import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Home } from 'lucide-react';

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

interface ChangeDormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDorm?: string;
  currentWing?: string;
  onUpdate?: () => void;
}

export const ChangeDormModal = ({ 
  isOpen, 
  onClose, 
  currentDorm = '', 
  currentWing = '',
  onUpdate 
}: ChangeDormModalProps) => {
  const [selectedDorm, setSelectedDorm] = useState(currentDorm);
  const [selectedWing, setSelectedWing] = useState(currentWing);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const dorms = Object.keys(dormAndFloorData);
  const wings = selectedDorm ? dormAndFloorData[selectedDorm as keyof typeof dormAndFloorData] : [];

  useEffect(() => {
    if (isOpen) {
      setSelectedDorm(currentDorm);
      setSelectedWing(currentWing);
    }
  }, [isOpen, currentDorm, currentWing]);

  // Reset wing when dorm changes
  useEffect(() => {
    if (selectedDorm && selectedDorm !== currentDorm) {
      setSelectedWing('');
    }
  }, [selectedDorm, currentDorm]);

  const handleSave = async () => {
    if (!selectedDorm || !selectedWing) {
      toast({
        title: "Error",
        description: "Please select both a dorm and wing",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your dorm",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          dorm: selectedDorm, 
          wing: selectedWing 
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Your dorm information has been updated",
        });
        onUpdate?.();
        onClose();
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

  const handleClose = () => {
    setSelectedDorm(currentDorm);
    setSelectedWing(currentWing);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#00AFCE]" />
            Change Dorm
          </DialogTitle>
          <DialogDescription>
            Update your residence hall and wing information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dorm-select">Residence Hall</Label>
            <Select value={selectedDorm} onValueChange={setSelectedDorm}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select Your Dorm" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {dorms.map((dorm) => (
                  <SelectItem key={dorm} value={dorm}>
                    {dorm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wing-select">Floor/Wing</Label>
            <Select 
              value={selectedWing} 
              onValueChange={setSelectedWing}
              disabled={!selectedDorm}
            >
              <SelectTrigger className={`h-12 ${!selectedDorm ? 'opacity-50' : ''}`}>
                <SelectValue placeholder={selectedDorm ? "Select Your Floor/Wing" : "Select dorm first"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {wings.map((wing) => (
                  <SelectItem key={wing} value={wing}>
                    {wing}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading || !selectedDorm || !selectedWing}
              className="flex-1 h-12"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="h-12"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};