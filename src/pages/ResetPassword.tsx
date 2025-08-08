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
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { DynamicText } from '@/components/content/DynamicText';

const ResetPassword = () => {
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

  useEffect(() => {
    // Check if we have the required tokens from the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError('Invalid or missing reset link. Please request a new password reset.');
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
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
        title: "Password updated successfully!",
        description: "You can now sign in with your new password.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to update password. Please try again.');
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
                <DynamicText
                  page="resetPassword"
                  section="success"
                  contentKey="title"
                  fallback="Password Updated!"
                  as="span"
                />
              </h2>
              <p className="text-muted-foreground mb-4">
                <DynamicText
                  page="resetPassword"
                  section="success"
                  contentKey="description"
                  fallback="Your password has been successfully updated. You will be redirected to the login page shortly."
                  as="span"
                />
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                <DynamicText
                  page="resetPassword"
                  section="success"
                  contentKey="homeButton"
                  fallback="Go to Home"
                  as="span"
                />
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
              <DynamicText
                page="resetPassword"
                section="main"
                contentKey="title"
                fallback="Reset Your Password"
                as="span"
              />
            </CardTitle>
            <p className="text-muted-foreground">
              <DynamicText
                page="resetPassword"
                section="main"
                contentKey="subtitle"
                fallback="Enter your new password below"
                as="span"
              />
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
                  <DynamicText
                    page="resetPassword"
                    section="form"
                    contentKey="new_password_label"
                    fallback="New Password"
                    as="span"
                  />
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
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
                  <DynamicText
                    page="resetPassword"
                    section="form"
                    contentKey="password_requirements"
                    fallback="Password must be at least 6 characters long"
                    as="span"
                  />
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  <DynamicText
                    page="resetPassword"
                    section="form"
                    contentKey="confirm_password_label"
                    fallback="Confirm New Password"
                    as="span"
                  />
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
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
                {loading ? (
                  <DynamicText
                    page="resetPassword"
                    section="form"
                    contentKey="updating"
                    fallback="Updating Password..."
                    as="span"
                  />
                ) : (
                  <DynamicText
                    page="resetPassword"
                    section="form"
                    contentKey="update_button"
                    fallback="Update Password"
                    as="span"
                  />
                )}
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