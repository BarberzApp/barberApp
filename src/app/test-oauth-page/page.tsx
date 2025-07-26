'use client';

import { useState } from 'react';

export default function TestOAuthPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testOAuth = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await fetch('/api/test-oauth');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleOAuth = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // Test the actual OAuth flow
      const response = await fetch('/api/auth/google-calendar');
      const data = await response.json();
      
      if (data.url) {
        setResult(`OAuth URL generated successfully. Click the link below to test:\n\n${data.url}`);
      } else {
        setResult(`Error: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">OAuth Test Page</h1>
          
          <div className="space-y-4">
            <button
              onClick={testOAuth}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test OAuth Configuration'}
            </button>
            
            <button
              onClick={testGoogleOAuth}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Google OAuth Flow'}
            </button>
          </div>
          
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 