import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendOrganizationPasswordResetCode } from '@/utils/organizationPasswordResetService';
import { OrganizationPasswordResetModal } from './OrganizationPasswordResetModal';

interface OrganizationForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrganizationForgotPasswordModal: React.FC<OrganizationForgotPasswordModalProps> = ({
  isOpen,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await sendOrganizationPasswordResetCode(email);
      
      if (result.success) {
        setEmailSent(true);
        toast({
          title: "Reset Code Sent",
          description: "A 6-digit reset code has been sent to your email address.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send reset code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending reset code:', error);
      toast({
        title: "Error",
        description: "Failed to send reset code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToReset = () => {
    setShowResetModal(true);
  };

  const handleResetComplete = () => {
    setShowResetModal(false);
    onClose();
    setEmail('');
    setEmailSent(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Organization Password</DialogTitle>
            <DialogDescription>
              {emailSent 
                ? "Enter the 6-digit code sent to your email to reset your password."
                : "Enter your organization's email address to receive a password reset code."
              }
            </DialogDescription>
          </DialogHeader>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Organization Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your organization email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="flex-1"
                >
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Reset code sent to <strong>{email}</strong>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Back to Login
                </Button>
                <Button
                  onClick={handleContinueToReset}
                  className="flex-1"
                >
                  Continue to Reset
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OrganizationPasswordResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onComplete={handleResetComplete}
        email={email}
      />
    </>
  );
}; 