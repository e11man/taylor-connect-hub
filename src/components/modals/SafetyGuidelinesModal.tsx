import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useContentSection } from '@/hooks/useContent';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SafetyGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  userType?: 'volunteer' | 'organization';
}

// Volunteer guidelines
const VOLUNTEER_GUIDELINES = {
  title: 'Volunteer Safety Guidelines',
  subtitle: 'Please review and accept these safety guidelines before participating in volunteer events:',
  guidelines: [
    'Never go alone - always volunteer with a friend or group member',
    'Tell someone where you\'re going and when you expect to return',
    'Keep your phone charged and with you at all times',
    'Follow all instructions from event organizers and site supervisors',
    'Report any safety concerns immediately to the event coordinator',
    'Wear appropriate clothing and footwear for the activity',
    'Stay hydrated and take breaks when needed'
  ],
  acceptText: 'I have read and understand these safety guidelines. I agree to follow them while participating in volunteer events.',
  acceptButton: 'I Accept and Understand',
  cancelButton: 'Cancel'
};

// Organization guidelines
const ORGANIZATION_GUIDELINES = {
  title: 'Event Hosting Guidelines',
  subtitle: 'Please review and accept these guidelines for hosting volunteer events:',
  guidelines: [
    'Provide clear safety instructions to all volunteers before the event',
    'Ensure adequate supervision and support for all activities',
    'Have emergency contact information readily available',
    'Provide necessary safety equipment and protective gear',
    'Maintain a safe and accessible environment for all participants',
    'Have a first aid kit and emergency plan in place',
    'Communicate clearly about arrival times, locations, and expectations'
  ],
  acceptText: 'I have read and understand these hosting guidelines. I agree to follow them while organizing volunteer events.',
  acceptButton: 'I Accept and Understand',
  cancelButton: 'Cancel'
};

// Default fallback content (for backward compatibility)
const FALLBACK_CONTENT = VOLUNTEER_GUIDELINES;

const SafetyGuidelinesModal: React.FC<SafetyGuidelinesModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept,
  userType = 'volunteer'
}) => {
  const [isAccepted, setIsAccepted] = useState(false);
  // Get the appropriate guidelines based on user type
  const guidelines = useMemo(() => {
    return userType === 'organization' ? ORGANIZATION_GUIDELINES : VOLUNTEER_GUIDELINES;
  }, [userType]);

  // Reset acceptance state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAccepted(false);
    }
  }, [isOpen]);

  // Memoized callbacks
  const handleAccept = useCallback(() => {
    if (isAccepted) {
      onAccept();
    }
  }, [isAccepted, onAccept]);

  const handleClose = useCallback(() => {
    setIsAccepted(false);
    onClose();
  }, [onClose]);

  // Memoized guidelines array
  const guidelinesList = useMemo(() => {
    return guidelines.guidelines.map((text, index) => ({
      id: index + 1,
      text
    }));
  }, [guidelines]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-2rem)] sm:w-[95vw] max-w-2xl h-[calc(100vh-2rem)] sm:h-auto sm:max-h-[90vh] translate-x-[-50%] translate-y-[-50%] bg-background rounded-xl shadow-2xl border border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] p-0 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-muted px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-secondary rounded-full shadow-sm flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                {guidelines.title}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1 leading-snug">
                {guidelines.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          {/* Guidelines List */}
          <div className="space-y-2 sm:space-y-3">
            {guidelinesList.map((guideline, index) => (
              <div 
                key={guideline.id} 
                className={cn(
                  "flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition-all duration-200",
                  "hover:bg-muted hover:scale-[1.01]",
                  isAccepted && "opacity-80"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-secondary text-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs sm:text-sm font-bold">{guideline.id}</span>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-foreground leading-relaxed flex-1">
                  {guideline.text}
                </p>
              </div>
            ))}
          </div>

          {/* Acceptance Checkbox */}
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-muted rounded-lg border border-border">
            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={isAccepted}
                  onChange={(e) => setIsAccepted(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-border text-secondary focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-all cursor-pointer"
                />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors select-none leading-relaxed">
                {guidelines.acceptText}
              </span>
            </label>
          </div>
        </div>

        {/* Fixed Footer with Actions */}
        <div className="border-t border-border bg-muted px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex-shrink-0">
          <div className="flex gap-2 sm:gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 py-2 sm:py-3 text-sm sm:text-base border-2 border-secondary text-secondary hover:bg-secondary/5 transition-all duration-200 rounded-lg"
            >
              {guidelines.cancelButton}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!isAccepted}
              className={cn(
                "flex-1 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-200 rounded-lg",
                "bg-secondary text-white border-0",
                "hover:bg-secondary/90 hover:shadow-lg hover:scale-[1.02]",
                "disabled:bg-muted-foreground disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {isAccepted && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-in zoom-in-50" />}
              <span className={cn(
                "truncate",
                isAccepted && "hidden sm:inline"
              )}>
                {guidelines.acceptButton}
              </span>
              <span className={cn(
                "sm:hidden",
                !isAccepted && "hidden"
              )}>
                Accept
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyGuidelinesModal;