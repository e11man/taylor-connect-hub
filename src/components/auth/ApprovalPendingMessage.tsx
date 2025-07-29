import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock } from 'lucide-react';

interface ApprovalPendingMessageProps {
  email: string;
  onClose?: () => void;
}

export function ApprovalPendingMessage({ email, onClose }: ApprovalPendingMessageProps) {
  const handleContactSupport = () => {
    // Close the modal and navigate to contact section on main page
    onClose?.();
    // Navigate to main page and scroll to contact section
    window.location.href = '/#contact';
    // Small delay to ensure page loads before scrolling
    setTimeout(() => {
      const contactSection = document.querySelector('#contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center space-y-4 mb-6">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-accent" />
        </div>
        
        <h2 className="text-2xl font-bold text-primary">Account Submitted</h2>
        <p className="text-muted-foreground text-sm">
          Thank you for creating an account with <strong>{email}</strong>
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
          <h3 className="font-semibold text-secondary mb-2">What happens next?</h3>
          <ul className="text-sm text-secondary/80 space-y-1">
            <li>• Your account has been submitted for admin review</li>
            <li>• You'll receive an email when your account is approved</li>
            <li>• This process typically takes 1-2 business days</li>
          </ul>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-semibold text-amber-900 mb-2">Important Note</h3>
          <p className="text-sm text-amber-800">
            Non-Taylor email accounts require admin approval before access is granted. 
            This helps maintain the security and integrity of our community platform.
          </p>
        </div>

        <Button 
          onClick={handleContactSupport}
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-sm hover:shadow-md transition-all"
        >
          Contact Support
        </Button>

        <Button 
          variant="outline" 
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
}