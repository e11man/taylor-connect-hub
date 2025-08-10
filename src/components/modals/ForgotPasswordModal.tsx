import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetCode } from '@/utils/passwordResetService';
import { PasswordResetModal } from './PasswordResetModal';
import { Mail, ArrowLeft } from 'lucide-react';
import { DynamicText } from '@/components/content/DynamicText';
import { useContent } from '@/hooks/useContent';

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
  // Dynamic content
  const { content: dialogTitleReset } = useContent('forgotPassword', 'dialog', 'titleReset', 'Reset Password');
  const { content: dialogTitleCheckEmail } = useContent('forgotPassword', 'dialog', 'titleCheckEmail', 'Check Your Email');
  const { content: dialogDescInitial } = useContent('forgotPassword', 'dialog', 'descriptionInitial', "Enter your email address and we'll send you a link to reset your password.");
  const { content: dialogDescSent } = useContent('forgotPassword', 'dialog', 'descriptionSent', "We sent you a password reset link. Check your email and follow the instructions.");
  const { content: toastErrorTitle } = useContent('forgotPassword', 'toast', 'errorTitle', 'Error');
  const { content: toastEnterEmail } = useContent('forgotPassword', 'toast', 'enterEmail', 'Please enter your email address');
  const { content: toastResetEmailSentTitle } = useContent('forgotPassword', 'toast', 'resetEmailSentTitle', 'Reset email sent');
  const { content: toastResetEmailSentDesc } = useContent('forgotPassword', 'toast', 'resetEmailSentDescription', 'Check your email for password reset instructions');
  const { content: toastUnexpectedError } = useContent('forgotPassword', 'toast', 'unexpectedError', 'An unexpected error occurred. Please try again.');
  const { content: emailLabel } = useContent('forgotPassword', 'form', 'emailLabel', 'Email Address');
  const { content: emailPlaceholder } = useContent('forgotPassword', 'form', 'emailPlaceholder', 'Enter your email address');
  const { content: sendResetLink } = useContent('forgotPassword', 'buttons', 'sendResetLink', 'Send Reset Link');
  const { content: sendingReset } = useContent('forgotPassword', 'buttons', 'sending', 'Sending...');
  const { content: cancelButton } = useContent('forgotPassword', 'buttons', 'cancel', 'Cancel');
  const { content: continueToReset } = useContent('forgotPassword', 'buttons', 'continueToReset', 'Continue to Reset');
  const { content: backButton } = useContent('forgotPassword', 'buttons', 'back', 'Back');
  const { content: resetInstructionsPrefix } = useContent('forgotPassword', 'sent', 'instructionsPrefix', 'Password reset instructions sent to:');

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: toastErrorTitle,
        description: toastEnterEmail,
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
          title: toastResetEmailSentTitle,
          description: toastResetEmailSentDesc,
        });
      } else {
        toast({
          title: toastErrorTitle,
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: toastErrorTitle,
        description: toastUnexpectedError,
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
              {emailSent ? dialogTitleCheckEmail : dialogTitleReset}
            </DialogTitle>
            <DialogDescription>
              {emailSent
                ? dialogDescSent
                : dialogDescInitial}
            </DialogDescription>
          </DialogHeader>

          {!emailSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">
                  <DynamicText page="forgotPassword" section="form" contentKey="emailLabel" fallback="Email Address" />
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder={emailPlaceholder}
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
                  {isLoading ? sendingReset : sendResetLink}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="h-12"
                >
                  {cancelButton}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <Mail className="w-12 h-12 text-[#00AFCE] mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {resetInstructionsPrefix}
                </p>
                <p className="font-medium break-all">{email}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleContinueToReset}
                  className="flex-1 h-12"
                >
                  {continueToReset}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="h-12"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {backButton}
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