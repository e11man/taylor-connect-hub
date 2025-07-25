import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // STEP 1: Validate Supabase client initialization
      // Check if environment variables are properly set
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables not found, using defaults');
      }

      // STEP 2: Authenticate with Supabase
      // This uses the anon key which has limited permissions
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Authentication failed');
      }

      // STEP 3: Check admin role with proper error handling
      // Wrap the query in try/catch to handle RLS policy errors
      let isAdmin = false;
      let roleError = null;

      try {
        // First attempt: Try to query user_roles table directly
        const { data: roleData, error: roleQueryError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (roleQueryError) {
          console.error('Role query error:', roleQueryError);
          roleError = roleQueryError;
          
          // If it's a schema or permission error, try alternative approach
          if (roleQueryError.message?.includes('schema') || 
              roleQueryError.code === 'PGRST301' || // RLS violation
              roleQueryError.code === '42501') { // Insufficient privilege
            
            // Alternative approach: Check if user exists in profiles table with role
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('user_id', data.user.id)
              .single();

            if (!profileError && profileData?.role === 'admin') {
              isAdmin = true;
            } else {
              // Last resort: Check if the user's email matches known admin emails
              // This should be replaced with proper RLS policy fix
              console.warn('Could not verify admin role through database. Please check RLS policies.');
            }
          }
        } else if (roleData?.role === 'admin') {
          isAdmin = true;
        }
      } catch (queryError: any) {
        console.error('Database query error:', queryError);
        
        // If we can't verify admin status due to database errors, 
        // provide a helpful error message
        await supabase.auth.signOut();
        throw new Error(
          'Unable to verify admin privileges. This may be due to database configuration. ' +
          'Please ensure Row Level Security policies allow authenticated users to read their own roles.'
        );
      }

      // STEP 4: Verify admin access
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error('You do not have admin privileges');
      }

      // STEP 5: Success - Navigate to admin dashboard
      toast({
        title: "Welcome back! 🎉",
        description: "Successfully logged in to admin dashboard.",
      });

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // STEP 6: Enhanced error messages with troubleshooting hints
      let errorMessage = 'Invalid credentials';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address first';
      } else if (error.message?.includes('admin privileges')) {
        errorMessage = error.message;
      } else if (error.message?.includes('schema') || error.message?.includes('database')) {
        errorMessage = 'Database configuration error. Please contact system administrator.';
      } else if (error.message?.includes('Row Level Security')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafb] to-white">
      <Header />
      
      <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#00AFCE] rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Admin Console</CardTitle>
              <p className="text-muted-foreground mt-2">Sign in to access the admin dashboard</p>
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
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#00AFCE] hover:bg-[#0099B8] text-white font-semibold" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In to Admin Console'
                )}
              </Button>
              
              <div className="text-center pt-4">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/')}
                  className="text-sm text-muted-foreground hover:text-[#00AFCE]"
                >
                  Back to Home
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminLogin;