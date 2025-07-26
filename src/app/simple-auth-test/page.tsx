'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/use-auth-zustand';

export default function SimpleAuthTestPage() {
  const { user, status, isInitialized } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<string>('');

  const checkSession = async () => {
    try {
      // Just check if we can access the session without making API calls
      const response = await fetch('/api/simple-session-check');
      const data = await response.json();
      setSessionInfo(JSON.stringify(data, null, 2));
    } catch (error) {
      setSessionInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Simple Auth Test (Safe)</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-green-100 rounded border border-green-300">
          <h2 className="font-semibold text-green-800">Client-Side Auth Status:</h2>
          <p className="text-green-700">Initialized: {isInitialized ? 'Yes' : 'No'}</p>
          <p className="text-green-700">Status: {status}</p>
          <p className="text-green-700">User ID: {user?.id || 'None'}</p>
          <p className="text-green-700">User Email: {user?.email || 'None'}</p>
        </div>

        <button 
          onClick={checkSession}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Check Session (Safe)
        </button>

        {sessionInfo && (
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold">Session Check Result:</h2>
            <pre className="text-sm">{sessionInfo}</pre>
          </div>
        )}

        <div className="p-4 bg-blue-100 rounded border border-blue-300">
          <h2 className="font-semibold text-blue-800">Note:</h2>
          <p className="text-blue-700">This page only checks your current session without making any authentication calls that could interfere with your login.</p>
        </div>
      </div>
    </div>
  );
} 