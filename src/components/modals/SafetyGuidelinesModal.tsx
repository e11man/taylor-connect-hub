import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useContentSection } from '@/hooks/useContent';
import { Skeleton } from '@/components/ui/skeleton';

interface SafetyGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const SafetyGuidelinesModal: React.FC<SafetyGuidelinesModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept 
}) => {
  const [isAccepted, setIsAccepted] = useState(false);
  const content = useContentSection('events', 'safety');
  const [isLoading, setIsLoading] = useState(true);

  // Reset acceptance state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAccepted(false);
    }
  }, [isOpen]);

  // Check if content is loaded
  useEffect(() => {
    if (content && Object.keys(content).length > 0) {
      setIsLoading(false);
    }
  }, [content]);

  const handleAccept = () => {
    if (isAccepted) {
      onAccept();
    }
  };

  // Get guidelines (1-5)
  const guidelines = [];
  for (let i = 1; i <= 5; i++) {
    const guideline = content[`guideline_${i}`];
    if (guideline || isLoading) {
      guidelines.push({
        id: i,
        text: guideline || `Loading guideline ${i}...`
      });
    }
  }

  // Fallback content
  const title = content.guidelines_title || 'Safety Guidelines';
  const subtitle = content.guidelines_subtitle || 'Please review and accept these safety guidelines before signing up for an event:';
  const acceptButtonText = content.accept_button || 'I Accept and Understand';
  const cancelButtonText = content.cancel_button || 'Cancel';

  // Use fallback guidelines if content is not loaded
  if (guidelines.length === 0) {
    guidelines.push(
      { id: 1, text: 'Never go alone - always volunteer with a friend or group member' },
      { id: 2, text: 'Tell someone where you\'re going and when you expect to return' },
      { id: 3, text: 'Keep your phone charged and with you at all times' },
      { id: 4, text: 'Follow all instructions from event organizers and site supervisors' },
      { id: 5, text: 'Report any safety concerns immediately to the event coordinator' }
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-gray-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isLoading ? <Skeleton className="h-8 w-48" /> : title}
            </h2>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-gray-600 mb-6">
          {isLoading ? <Skeleton className="h-5 w-full" /> : subtitle}
        </p>

        {/* Guidelines List */}
        <div className="space-y-4 mb-8">
          {guidelines.map((guideline) => (
            <div key={guideline.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-orange-600">{guideline.id}</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {isLoading ? <Skeleton className="h-5 w-full" /> : guideline.text}
              </p>
            </div>
          ))}
        </div>

        {/* Acceptance Checkbox */}
        <div className="border-t pt-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors cursor-pointer"
              />
            </div>
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors select-none">
              I have read and understand these safety guidelines. I agree to follow them while participating in volunteer events.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 py-3 border-2 hover:bg-gray-50"
          >
            {cancelButtonText}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!isAccepted || isLoading}
            className="flex-1 py-3 bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {acceptButtonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyGuidelinesModal;