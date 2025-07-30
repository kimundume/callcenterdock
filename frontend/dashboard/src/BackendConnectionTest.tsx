import React, { useState, useEffect } from 'react';

const BackendConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      // Test local backend
      const localResponse = await fetch('http://localhost:5001/api/agents/demo-company-uuid');
      if (localResponse.ok) {
        setStatus('✅ Local Backend Connected');
      } else {
        setStatus('❌ Local Backend Error');
        setError(`HTTP ${localResponse.status}: ${localResponse.statusText}`);
      }
    } catch (err) {
      setStatus('❌ Local Backend Connection Failed');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const testRenderBackend = async () => {
    try {
      // Test Render backend (if deployed)
      const renderResponse = await fetch('https://calldocker-backend.onrender.com/api/agents/demo-company-uuid');
      if (renderResponse.ok) {
        setStatus('✅ Render Backend Connected');
      } else {
        setStatus('❌ Render Backend Error');
        setError(`HTTP ${renderResponse.status}: ${renderResponse.statusText}`);
      }
    } catch (err) {
      setStatus('❌ Render Backend Connection Failed');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Backend Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Status: {status}</h3>
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={testBackendConnection}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Test Local Backend
        </button>
        <button 
          onClick={testRenderBackend}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Test Render Backend
        </button>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h4>What to check:</h4>
        <ul>
          <li>✅ <strong>Local Backend</strong>: Should work if running locally on port 5001</li>
          <li>✅ <strong>Render Backend</strong>: Should work if deployed to Render</li>
          <li>❌ <strong>CORS Issues</strong>: If you see CORS errors, backend needs CORS configuration</li>
          <li>❌ <strong>Network Errors</strong>: If you see network errors, backend might be down</li>
        </ul>
      </div>
    </div>
  );
};

export default BackendConnectionTest; 