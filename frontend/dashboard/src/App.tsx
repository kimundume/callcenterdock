import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './style.css';
import AppRoutes from './AppRoutes';
import BackendConnectionTest from './BackendConnectionTest';

function App() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [showBackendTest, setShowBackendTest] = useState<boolean>(true); // Set to true to show test

  return (
    <Router>
      <div className="App">
        {showBackendTest ? (
          <BackendConnectionTest />
        ) : (
          <AppRoutes setCompanyUuid={setCompanyUuid} />
        )}
        
        {/* Toggle button to switch between test and app */}
        <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }}>
          <button 
            onClick={() => setShowBackendTest(!showBackendTest)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: showBackendTest ? '#dc3545' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {showBackendTest ? 'Show App' : 'Show Backend Test'}
          </button>
        </div>
      </div>
    </Router>
  );
}

export default App; 
