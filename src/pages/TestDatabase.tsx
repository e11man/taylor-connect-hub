import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TestDatabase = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);
  const [contentData, setContentData] = useState<any[]>([]);
  const [envInfo, setEnvInfo] = useState<any>({});

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('TestDatabase: Testing Supabase connection...');
        setStatus('Testing Supabase connection...');
        
        // Check environment variables
        const envData = {
          VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
          NODE_ENV: import.meta.env.NODE_ENV,
          MODE: import.meta.env.MODE
        };
        setEnvInfo(envData);
        console.log('TestDatabase: Environment info:', envData);
        
        // Test basic connection
        const { data, error } = await supabase
          .from('content')
          .select('*')
          .limit(5);

        console.log('TestDatabase: Supabase response:', { data, error });

        if (error) {
          console.error('TestDatabase: Supabase error:', error);
          setError(error.message);
          setStatus('Connection failed');
          return;
        }

        console.log('TestDatabase: Connection successful, data:', data);
        setContentData(data || []);
        setStatus('Connection successful!');
      } catch (err) {
        console.error('TestDatabase: Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            <p><strong>VITE_SUPABASE_URL:</strong> {envInfo.VITE_SUPABASE_URL || 'Not set'}</p>
            <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {envInfo.VITE_SUPABASE_ANON_KEY || 'Not set'}</p>
            <p><strong>NODE_ENV:</strong> {envInfo.NODE_ENV || 'Not set'}</p>
            <p><strong>MODE:</strong> {envInfo.MODE || 'Not set'}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className="text-lg mb-2">
            <span className="font-medium">Status:</span> {status}
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {contentData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Content Data (First 5 items)</h2>
            <div className="space-y-2">
              {contentData.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-3">
                  <p><strong>ID:</strong> {item.id}</p>
                  <p><strong>Page:</strong> {item.page}</p>
                  <p><strong>Section:</strong> {item.section}</p>
                  <p><strong>Key:</strong> {item.key}</p>
                  <p><strong>Value:</strong> {item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>Local Storage Available:</strong> {typeof localStorage !== 'undefined' ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default TestDatabase;