// Force Netlify rebuild - Authentication completely disabled, test endpoints added for all failing routes
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './style.css';
import AppRoutes from './AppRoutes';
import config from './config.ts';

// Set the backend URL based on environment
const BACKEND_URL = config.backendUrl;

// Make it available globally
(window as any).BACKEND_URL = BACKEND_URL;

// Test component to verify backend connectivity
const BackendTest = () => {
  const [status, setStatus] = useState('Testing...');
  const [data, setData] = useState(null);

  useEffect(() => {
    const testBackend = async () => {
      try {
        console.log('🧪 Testing backend connectivity...');
        const response = await fetch(`${BACKEND_URL}/api/super-admin/debug/accounts`);
        const result = await response.json();
        setStatus('✅ Backend connected');
        setData(result);
        console.log('✅ Backend test successful:', result);
      } catch (error) {
        setStatus('❌ Backend connection failed');
        console.error('❌ Backend test failed:', error);
      }
    };

    testBackend();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: status.includes('✅') ? '#4CAF50' : '#f44336',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      {status}
    </div>
  );
};

function App() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);

  return (
    <Router>
      <div className="App">
        <BackendTest />
        <AppRoutes setCompanyUuid={setCompanyUuid} />
      </div>
    </Router>
  );
}

export default App; 
