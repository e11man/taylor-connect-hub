import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DynamicText } from '@/components/content/DynamicText';
import { useContent } from '@/hooks/useContent';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { usePageTitle } from '@/hooks/usePageTitle';

const ResetPassword = () => {
  usePageTitle("Reset Password");
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Dynamic content
  const { content: invalidLinkError } = useContent('resetPassword', 'errors', 'invalidLink', 'Invalid or missing reset link. Please request a new password reset.');
  const { content: passwordMinLengthMsg } = useContent('resetPassword', 'validation', 'passwordMinLength', 'Password must be at least 6 characters long');
  const { content: fillAllFieldsError } = useContent('resetPassword', 'errors', 'fillAllFields', 'Please fill in all fields');
  const { content: passwordsDoNotMatch } = useContent('resetPassword', 'errors', 'passwordsDoNotMatch', 'Passwords do not match');
  const { content: updatePasswordToastTitle } = useContent('resetPassword', 'toast', 'successTitle', 'Password updated successfully!');
  const { content: updatePasswordToastDesc } = useContent('resetPassword', 'toast', 'successDescription', 'You can now sign in with your new password.');
  const { content: updatePasswordFailed } = useContent('resetPassword', 'errors', 'updateFailed', 'Failed to update password. Please try again.');
  const { content: successHeading } = useContent('resetPassword', 'success', 'heading', 'Password Updated!');
  const { content: successDescription } = useContent('resetPassword', 'success', 'description', 'Your password has been successfully updated. You will be redirected to the login page shortly.');
  const { content: goHomeButton } = useContent('resetPassword', 'success', 'goHomeButton', 'Go to Home');
  const { content: pageTitle } = useContent('resetPassword', 'page', 'title', 'Reset Your Password');
  const { content: pageSubtitle } = useContent('resetPassword', 'page', 'subtitle', 'Enter your new password below');
  const { content: newPasswordLabel } = useContent('resetPassword', 'form', 'newPasswordLabel', 'New Password');
  const { content: newPasswordPlaceholder } = useContent('resetPassword', 'form', 'newPasswordPlaceholder', 'Enter your new password');
  const { content: helperPasswordMin } = useContent('resetPassword', 'form', 'helperPasswordMin', 'Password must be at least 6 characters long');
  const { content: confirmNewPasswordLabel } = useContent('resetPassword', 'form', 'confirmNewPasswordLabel', 'Confirm New Password');
  const { content: confirmNewPasswordPlaceholder } = useContent('resetPassword', 'form', 'confirmNewPasswordPlaceholder', 'Confirm your new password');
  const { content: updatePasswordButton } = useContent('resetPassword', 'buttons', 'updatePassword', 'Update Password');
  const { content: updatingPasswordButton } = useContent('resetPassword', 'buttons', 'updatingPassword', 'Updating Password...');

  useEffect(() => {
    // Check if we have the required tokens from the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError(invalidLinkError);
      return;
    }

    // Set the session with the tokens from the URL
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return passwordMinLengthMsg;
    }
    return null;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError(fillAllFieldsError);
      return;
    }

    if (password !== confirmPassword) {
      setError(passwordsDoNotMatch);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      toast({
        title: updatePasswordToastTitle,
        description: updatePasswordToastDesc,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      setError(error.message || updatePasswordFailed);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-primary mb-2">
                <DynamicText page="resetPassword" section="success" contentKey="heading" fallback=<DynamicText page="messages" section="success" contentKey="password_updated" fallback=<DynamicText page="resetPassword" section="success" contentKey="heading" fallback="Password Updated!" /> /> />
              </h2>
              <p className="text-muted-foreground mb-4">
                <DynamicText page="resetPassword" section="success" contentKey="description" fallback=<DynamicText page="messages" section="success" contentKey="password_update_description" fallback=<DynamicText page="resetPassword" section="success" contentKey="description" fallback="Your password has been successfully updated. You will be redirected to the login page shortly." /> /> />
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                <DynamicText page="resetPassword" section="success" contentKey="goHomeButton" fallback=<DynamicText page="messages" section="success" contentKey="go_home" fallback="Go to Home" /> />
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">
              <DynamicText page="resetPassword" section="page" contentKey="title" fallback="Reset Your Password" />
            </CardTitle>
            <p className="text-muted-foreground">
              <DynamicText page="resetPassword" section="page" contentKey="subtitle" fallback="Enter your new password below" />
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">
                  <DynamicText page="resetPassword" section="form" contentKey="newPasswordLabel" fallback=<DynamicText page="modals" section="updatePassword" contentKey="new_password_label" fallback="New Password" /> />
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={newPasswordPlaceholder}
                    className="pr-12"
                    required
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
                  <DynamicText page="resetPassword" section="form" contentKey="helperPasswordMin" fallback=<DynamicText page="forms" section="validation" contentKey="password_too_short" fallback=<DynamicText page="modals" section="updatePassword" contentKey="password_min_requirement" fallback="Password must be at least 6 characters long" /> /> />
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  <DynamicText page="resetPassword" section="form" contentKey="confirmNewPasswordLabel" fallback=<DynamicText page="modals" section="updatePassword" contentKey="confirm_password_label" fallback="Confirm New Password" /> />
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={confirmNewPasswordPlaceholder}
                    className="pr-12"
                    required
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
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? updatingPasswordButton : updatePasswordButton}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;