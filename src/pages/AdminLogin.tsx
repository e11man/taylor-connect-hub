import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      console.log('Attempting admin login for:', email);
      
      // Try different approach - use supabase admin createUser if standard auth fails
      let authData;
      let authError;
      
      try {
        // First try standard authentication
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        authData = result.data;
        authError = result.error;
      } catch (error: any) {
        console.error('Standard auth failed:', error);
        authError = error;
      }

      // If standard auth failed due to schema issues, try admin approach
      if (authError && authError.message.includes('schema')) {
        console.log('Auth schema error detected, trying alternative approach...');
        
        // For development: create admin user if it doesn't exist properly
        if (email === 'admin@taylor.edu' && password === 'admin123') {
          try {
            // Try to create the user with admin API to avoid schema issues
            const { data: createResult, error: createError } = await supabase.auth.admin.createUser({
              email: 'admin@taylor.edu',
              password: 'admin123',
              email_confirm: true,
              user_metadata: { role: 'admin' }
            });

            if (!createError && createResult.user) {
              console.log('Created new admin user successfully');
              
              // Ensure user has admin role
              const { error: roleError } = await supabase
                .from('user_roles')
                .upsert(
                  { user_id: createResult.user.id, role: 'admin' },
                  { onConflict: 'user_id' }
                );

              if (roleError) {
                console.warn('Role assignment warning:', roleError);
              }

              // Now try to sign in with the new user
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (!signInError && signInData.user) {
                authData = signInData;
                authError = null;
              }
            }
          } catch (createErr) {
            console.error('Failed to create admin user:', createErr);
          }
        }
      }

      if (authError) {
        throw authError;
      }

      if (!authData?.user) {
        throw new Error('Authentication failed');
      }

      console.log('Authentication successful for user:', authData.user.id);

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      if (roleError || !roleData || roleData.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('You do not have admin privileges');
      }

      toast({
        title: "Success!",
        description: "Welcome to the admin dashboard.",
      });

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // Enhanced error messages
      let errorMessage = 'Invalid admin credentials';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address';
      } else if (error.message.includes('admin privileges')) {
        errorMessage = 'You do not have admin privileges';
      } else if (error.message.includes('schema')) {
        errorMessage = 'Database authentication error. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Console</CardTitle>
          <p className="text-muted-foreground">Sign in to access the admin dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;