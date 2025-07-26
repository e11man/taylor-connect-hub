import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestDatabase = () => {
  const [testResults, setTestResults] = useState<{
    profiles?: any;
    profilesError?: any;
    userRoles?: any;
    userRolesError?: any;
    currentUser?: any;
    authError?: any;
  }>({});

  const runTests = async () => {
    console.log('Running database tests...');
    
    // Test 1: Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user, 'Auth error:', authError);
    
    // Test 2: Query profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    console.log('Profiles query:', profiles, 'Error:', profilesError);
    
    // Test 3: Query user_roles table
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);
    console.log('User roles query:', userRoles, 'Error:', userRolesError);
    
    setTestResults({
      currentUser: user,
      authError,
      profiles,
      profilesError,
      userRoles,
      userRolesError,
    });
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTests}>Re-run Tests</Button>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Current User:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {testResults.currentUser ? JSON.stringify(testResults.currentUser, null, 2) : 'No user'}
                  {testResults.authError && `\nError: ${JSON.stringify(testResults.authError, null, 2)}`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold">Profiles Table:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {testResults.profiles ? `Found ${testResults.profiles.length} profiles:\n${JSON.stringify(testResults.profiles, null, 2)}` : 'No data'}
                  {testResults.profilesError && `\nError: ${JSON.stringify(testResults.profilesError, null, 2)}`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold">User Roles Table:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {testResults.userRoles ? `Found ${testResults.userRoles.length} roles:\n${JSON.stringify(testResults.userRoles, null, 2)}` : 'No data'}
                  {testResults.userRolesError && `\nError: ${JSON.stringify(testResults.userRolesError, null, 2)}`}
                </pre>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                Check the browser console for detailed logs. If you see RLS errors, the database policies may need to be updated.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestDatabase;