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
}

// Default fallback content
const FALLBACK_CONTENT = {
  guidelines_title: 'Safety Guidelines',
  guidelines_subtitle: 'Please review and accept these safety guidelines before signing up for an event:',
  guideline_1: 'Never go alone - always volunteer with a friend or group member',
  guideline_2: 'Tell someone where you\'re going and when you expect to return',
  guideline_3: 'Keep your phone charged and with you at all times',
  guideline_4: 'Follow all instructions from event organizers and site supervisors',
  guideline_5: 'Report any safety concerns immediately to the event coordinator',
  accept_button: 'I Accept and Understand',
  cancel_button: 'Cancel'
};

const SafetyGuidelinesModal: React.FC<SafetyGuidelinesModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept 
}) => {
  const [isAccepted, setIsAccepted] = useState(false);
  const content = useContentSection('events', 'safety');
  
  // Optimized loading state
  const isLoading = useMemo(() => {
    return !content || Object.keys(content).length === 0;
  }, [content]);

  // Reset acceptance state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAccepted(false);
    }
  }, [isOpen]);

  // Memoized callbacks
  const handleAccept = useCallback(() => {
    if (isAccepted && !isLoading) {
      onAccept();
    }
  }, [isAccepted, isLoading, onAccept]);

  const handleClose = useCallback(() => {
    setIsAccepted(false);
    onClose();
  }, [onClose]);

  // Memoized guidelines array
  const guidelines = useMemo(() => {
    const items = [];
    for (let i = 1; i <= 5; i++) {
      const text = content[`guideline_${i}`] || FALLBACK_CONTENT[`guideline_${i}`];
      items.push({ id: i, text });
    }
    return items;
  }, [content]);

  // Memoized content values with fallbacks
  const { title, subtitle, acceptButtonText, cancelButtonText } = useMemo(() => ({
    title: content.guidelines_title || FALLBACK_CONTENT.guidelines_title,
    subtitle: content.guidelines_subtitle || FALLBACK_CONTENT.guidelines_subtitle,
    acceptButtonText: content.accept_button || FALLBACK_CONTENT.accept_button,
    cancelButtonText: content.cancel_button || FALLBACK_CONTENT.cancel_button
  }), [content]);

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
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-2xl max-h-[85vh] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] p-0 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 sm:px-8 py-6 border-b border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-48" /> : title}
              </h2>
              <p className="text-gray-600 mt-1">
                {isLoading ? <Skeleton className="h-5 w-full max-w-md" /> : subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6" style={{ maxHeight: 'calc(85vh - 220px)' }}>
          {/* Guidelines List */}
          <div className="space-y-3">
            {guidelines.map((guideline, index) => (
              <div 
                key={guideline.id} 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                  "hover:bg-orange-50 hover:scale-[1.01]",
                  isAccepted && "opacity-80"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold">{guideline.id}</span>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed flex-1">
                  {isLoading ? (
                    <Skeleton className="h-5 w-full" />
                  ) : (
                    guideline.text
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Acceptance Checkbox */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={isAccepted}
                  onChange={(e) => setIsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all cursor-pointer"
                  disabled={isLoading}
                />
              </div>
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors select-none text-sm">
                I have read and understand these safety guidelines. I agree to follow them while participating in volunteer events.
              </span>
            </label>
          </div>
        </div>

        {/* Fixed Footer with Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 sm:px-8 py-4">
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 py-3 border-2 hover:bg-white transition-all duration-200"
              disabled={isLoading}
            >
              {cancelButtonText}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!isAccepted || isLoading}
              className={cn(
                "flex-1 py-3 font-semibold transition-all duration-200",
                "bg-gradient-to-r from-orange-600 to-amber-600 text-white",
                "hover:from-orange-700 hover:to-amber-700 hover:shadow-lg hover:scale-[1.02]",
                "disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {isAccepted && <CheckCircle2 className="w-4 h-4 mr-2 animate-in zoom-in-50" />}
              {acceptButtonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyGuidelinesModal;