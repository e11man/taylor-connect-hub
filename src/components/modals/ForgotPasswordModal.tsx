import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetCode } from '@/utils/passwordResetService';
import { PasswordResetModal } from './PasswordResetModal';
import { Mail, ArrowLeft } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPasswordResetCode(email);

      if (result.success) {
        setEmailSent(true);
        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
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
    setEmail('');
    setEmailSent(false);
    setIsLoading(false);
    setShowResetModal(false);
    onClose();
  };

  const handleContinueToReset = () => {
    setShowResetModal(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#00AFCE]" />
              {emailSent ? 'Check Your Email' : 'Reset Password'}
            </DialogTitle>
            <DialogDescription>
              {emailSent
                ? 'We sent you a password reset link. Check your email and follow the instructions.'
                : 'Enter your email address and we\'ll send you a link to reset your password.'}
            </DialogDescription>
          </DialogHeader>

          {!emailSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePasswordReset}
                  disabled={isLoading || !email}
                  className="flex-1 h-12"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
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
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <Mail className="w-12 h-12 text-[#00AFCE] mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Password reset instructions sent to:
                </p>
                <p className="font-medium break-all">{email}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleContinueToReset}
                  className="flex-1 h-12"
                >
                  Continue to Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="h-12"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PasswordResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        email={email}
      />
    </>
  );
};