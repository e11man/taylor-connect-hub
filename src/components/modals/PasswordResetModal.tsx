import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { verifyResetCode, updatePasswordWithResetCode } from '@/utils/passwordResetService';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { DynamicText } from '@/components/content/DynamicText';
import { useContent } from '@/hooks/useContent';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const PasswordResetModal = ({ isOpen, onClose, email }: PasswordResetModalProps) => {
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'password' | 'success'>('code');
  const { toast } = useToast();
  // Dynamic content
  const { content: passwordMinLength } = useContent('passwordResetModal', 'validation', 'passwordMinLength', 'Password must be at least 6 characters long');
  const { content: errorTitle } = useContent('passwordResetModal', 'toast', 'errorTitle', 'Error');
  const { content: enterResetCode } = useContent('passwordResetModal', 'toast', 'enterResetCode', 'Please enter the reset code');
  const { content: codeVerifiedTitle } = useContent('passwordResetModal', 'toast', 'codeVerifiedTitle', 'Code verified');
  const { content: codeVerifiedDesc } = useContent('passwordResetModal', 'toast', 'codeVerifiedDescription', 'Please enter your new password');
  const { content: unexpectedError } = useContent('passwordResetModal', 'toast', 'unexpectedError', 'An unexpected error occurred. Please try again.');
  const { content: fillAllFields } = useContent('passwordResetModal', 'toast', 'fillAllFields', 'Please fill in all fields');
  const { content: passwordsDoNotMatch } = useContent('passwordResetModal', 'toast', 'passwordsDoNotMatch', 'Passwords do not match');
  const { content: updatedSuccessTitle } = useContent('passwordResetModal', 'toast', 'updatedSuccessTitle', 'Password updated successfully!');
  const { content: updatedSuccessDesc } = useContent('passwordResetModal', 'toast', 'updatedSuccessDescription', 'You can now sign in with your new password.');
  const { content: dialogTitleCode } = useContent('passwordResetModal', 'dialog', 'titleCode', 'Enter Reset Code');
  const { content: dialogTitlePassword } = useContent('passwordResetModal', 'dialog', 'titlePassword', 'Set New Password');
  const { content: dialogTitleSuccess } = useContent('passwordResetModal', 'dialog', 'titleSuccess', 'Password Updated!');
  const { content: dialogDescCode } = useContent('passwordResetModal', 'dialog', 'descriptionCode', 'Enter the 6-digit code sent to your email.');
  const { content: dialogDescPassword } = useContent('passwordResetModal', 'dialog', 'descriptionPassword', 'Enter your new password below.');
  const { content: dialogDescSuccess } = useContent('passwordResetModal', 'dialog', 'descriptionSuccess', 'Your password has been successfully updated.');
  const { content: resetCodeLabel } = useContent('passwordResetModal', 'form', 'resetCodeLabel', 'Reset Code');
  const { content: resetCodePlaceholder } = useContent('passwordResetModal', 'form', 'resetCodePlaceholder', 'Enter 6-digit code');
  const { content: verifyingButton } = useContent('passwordResetModal', 'buttons', 'verifying', 'Verifying...');
  const { content: verifyCodeButton } = useContent('passwordResetModal', 'buttons', 'verifyCode', 'Verify Code');
  const { content: cancelButton } = useContent('passwordResetModal', 'buttons', 'cancel', 'Cancel');
  const { content: newPasswordLabel } = useContent('passwordResetModal', 'form', 'newPasswordLabel', 'New Password');
  const { content: newPasswordPlaceholder } = useContent('passwordResetModal', 'form', 'newPasswordPlaceholder', 'Enter your new password');
  const { content: helperMinLength } = useContent('passwordResetModal', 'form', 'helperMinLength', 'Password must be at least 6 characters long');
  const { content: confirmNewPasswordLabel } = useContent('passwordResetModal', 'form', 'confirmNewPasswordLabel', 'Confirm New Password');
  const { content: confirmNewPasswordPlaceholder } = useContent('passwordResetModal', 'form', 'confirmNewPasswordPlaceholder', 'Confirm your new password');
  const { content: updatingButton } = useContent('passwordResetModal', 'buttons', 'updating', 'Updating...');
  const { content: updatePasswordButton } = useContent('passwordResetModal', 'buttons', 'updatePassword', 'Update Password');
  const { content: backButton } = useContent('passwordResetModal', 'buttons', 'back', 'Back');
  const { content: successUpdatedText } = useContent('passwordResetModal', 'success', 'updatedText', 'Your password has been successfully updated!');
  const { content: backToLogin } = useContent('passwordResetModal', 'buttons', 'backToLogin', 'Back to Login');

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return passwordMinLength;
    }
    return null;
  };

  const handleVerifyCode = async () => {
    if (!resetCode) {
      toast({
        title: errorTitle,
        description: enterResetCode,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyResetCode(email, resetCode);

      if (result.success) {
        setStep('password');
        toast({
          title: codeVerifiedTitle,
          description: codeVerifiedDesc,
        });
      } else {
        toast({
          title: errorTitle,
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: errorTitle,
        description: unexpectedError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: errorTitle,
        description: fillAllFields,
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: errorTitle,
        description: passwordsDoNotMatch,
        variant: "destructive",
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: errorTitle,
        description: passwordError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updatePasswordWithResetCode(email, resetCode, newPassword);

      if (result.success) {
        setStep('success');
        toast({
          title: updatedSuccessTitle,
          description: updatedSuccessDesc,
        });
      } else {
        toast({
          title: errorTitle,
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: errorTitle,
        description: unexpectedError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsLoading(false);
    setStep('code');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Lock className="w-5 h-5 text-[#00AFCE]" />
            )}
            {step === 'code' && dialogTitleCode}
            {step === 'password' && dialogTitlePassword}
            {step === 'success' && dialogTitleSuccess}
          </DialogTitle>
          <DialogDescription>
            {step === 'code' && dialogDescCode}
            {step === 'password' && dialogDescPassword}
            {step === 'success' && dialogDescSuccess}
          </DialogDescription>
        </DialogHeader>

        {step === 'code' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-code">
                <DynamicText page="passwordResetModal" section="form" contentKey="resetCodeLabel" fallback="Reset Code" />
              </Label>
              <Input
                id="reset-code"
                type="text"
                placeholder={resetCodePlaceholder}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-12 text-center text-lg tracking-widest font-mono"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleVerifyCode}
                disabled={isLoading || resetCode.length !== 6}
                className="flex-1 h-12"
              >
                {isLoading ? verifyingButton : verifyCodeButton}
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
        )}

        {step === 'password' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">
                <DynamicText page="passwordResetModal" section="form" contentKey="newPasswordLabel" fallback="New Password" />
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={newPasswordPlaceholder}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                <DynamicText page="passwordResetModal" section="form" contentKey="helperMinLength" fallback="Password must be at least 6 characters long" />
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                <DynamicText page="passwordResetModal" section="form" contentKey="confirmNewPasswordLabel" fallback="Confirm New Password" />
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={confirmNewPasswordPlaceholder}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdatePassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="flex-1 h-12"
              >
                {isLoading ? updatingButton : updatePasswordButton}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('code')}
                className="h-12"
              >
                {backButton}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {successUpdatedText}
              </p>
            </div>

            <Button
              onClick={handleClose}
              className="w-full h-12 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {backToLogin}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 