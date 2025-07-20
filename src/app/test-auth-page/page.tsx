'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/use-auth-zustand';

export default function TestAuthPage() {
  const { user, status, isInitialized } = useAuth();
  const [apiResult, setApiResult] = useState<string>('');

  const testAuth = async () => {
    try {
      const response = await fetch('/api/test-auth');
      const data = await response.json();
      setApiResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Client-Side Auth Status:</h2>
          <p>Initialized: {isInitialized ? 'Yes' : 'No'}</p>
          <p>Status: {status}</p>
          <p>User ID: {user?.id || 'None'}</p>
          <p>User Email: {user?.email || 'None'}</p>
        </div>

        <button 
          onClick={testAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test API Authentication
        </button>

        {apiResult && (
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold">API Response:</h2>
            <pre className="text-sm">{apiResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 