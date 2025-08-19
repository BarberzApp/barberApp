'use client';

import { useEffect, useState } from 'react';

export default function TestDeepLink() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDeepLink = (type: 'return' | 'refresh') => {
    const accountId = 'test_account_123';
    const deepLink = `bocm://stripe-connect/${type}?account_id=${accountId}`;
    
    addResult(`Testing deep link: ${deepLink}`);
    
    // Try to open the deep link
    window.location.href = deepLink;
    
    // Add a fallback message
    setTimeout(() => {
      addResult('Deep link test completed. Check if mobile app opened.');
    }, 1000);
  };

  const testWebRedirect = () => {
    addResult('Testing web redirect to mobile app...');
    window.location.href = 'bocm://stripe-connect/return?account_id=test_web_redirect';
  };

  useEffect(() => {
    addResult('Deep link test page loaded');
    addResult('Click the buttons below to test deep links');
  }, []);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#272a2f',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Deep Link Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => testDeepLink('return')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f59e0b',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Return Deep Link
        </button>
        
        <button 
          onClick={() => testDeepLink('refresh')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f59e0b',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Refresh Deep Link
        </button>
        
        <button 
          onClick={testWebRedirect}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Test Web Redirect
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '8px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginBottom: '10px' }}>Test Results:</h3>
        {testResults.map((result, index) => (
          <div key={index} style={{ 
            padding: '5px 0', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            fontSize: '14px'
          }}>
            {result}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.8 }}>
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Click "Test Return Deep Link" to simulate a successful Stripe completion</li>
          <li>Click "Test Refresh Deep Link" to simulate a retry scenario</li>
          <li>Click "Test Web Redirect" to test direct deep link opening</li>
          <li>Check your mobile app to see if it opens and handles the deep links</li>
        </ul>
      </div>
    </div>
  );
}
