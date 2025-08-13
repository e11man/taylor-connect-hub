import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { DynamicText } from '@/components/content/DynamicText';
import { useContent } from '@/hooks/useContent';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Get error messages from content
  const { content: errorInvalidCredentials } = useContent('admin', 'login', 'errorInvalidCredentials', 'Invalid email or password');
  const { content: errorEmailNotConfirmed } = useContent('admin', 'login', 'errorEmailNotConfirmed', 'Please confirm your email address first');
  const { content: errorNoPrivileges } = useContent('admin', 'login', 'errorNoPrivileges', 'You do not have admin privileges');
  const { content: errorDatabase } = useContent('admin', 'login', 'errorDatabase', 'Database configuration error. Please contact system administrator.');
  const { content: successMessage } = useContent('admin', 'login', 'successMessage', 'Welcome back! 🎉');
  const { content: successDescription } = useContent('admin', 'login', 'successDescription', 'Successfully logged in to admin dashboard.');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use AuthContext's signIn function
      const result = await signIn(email, password);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Check if user has admin role
      if (result.data?.session?.user?.role !== 'admin') {
        throw new Error('You do not have admin privileges');
      }
      
      // Check if user status is active
      if (result.data?.session?.user?.status !== 'active') {
        throw new Error('Account not active. Please contact support.');
      }

      // If we got here, user is authenticated and authorized
      toast({
        title: successMessage,
        description: successDescription,
      });
      
      // Redirection is now handled automatically in AuthContext
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      let errorMessage = errorInvalidCredentials;
      
      if (error.message?.includes('Invalid credentials') || error.message?.includes('Invalid login')) {
        errorMessage = errorInvalidCredentials;
      } else if (error.message?.includes('admin privileges')) {
        errorMessage = errorNoPrivileges;
      } else if (error.message?.includes('Account blocked')) {
        errorMessage = 'Your account has been blocked. Please contact support.';
      } else if (error.message?.includes('Account pending')) {
        errorMessage = 'Your account is pending approval. Please contact support.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-secondary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                <DynamicText 
                  page="admin" 
                  section="login" 
                  contentKey="title"
                  fallback="Admin Console"
                  as="span"
                />
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                <DynamicText 
                  page="admin" 
                  section="login" 
                  contentKey="subtitle"
                  fallback="Sign in to access the admin dashboard"
                  as="span"
                />
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <DynamicText 
                    page="admin" 
                    section="login" 
                    contentKey="emailLabel"
                    fallback="Email"
                    as="span"
                  />
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={useContent('admin', 'login', 'emailPlaceholder', 'admin@example.com').content}
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <DynamicText 
                    page="admin" 
                    section="login" 
                    contentKey="passwordLabel"
                    fallback="Password"
                    as="span"
                  />
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={useContent('admin', 'login', 'passwordPlaceholder', '••••••••').content}
                  required
                  className="h-12"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <DynamicText 
                    page="admin" 
                    section="login" 
                    contentKey="signingIn"
                    fallback="Signing in..."
                    as="span"
                  />
                ) : (
                  <DynamicText 
                    page="admin" 
                    section="login" 
                    contentKey="submitButton"
                    fallback="Sign In"
                    as="span"
                  />
                )}
              </Button>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                <DynamicText 
                  page="admin" 
                  section="login" 
                  contentKey="testCredentialsNote"
                  fallback="Test credentials: admin@taylor.edu / admin123"
                  as="span"
                />
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminLogin;