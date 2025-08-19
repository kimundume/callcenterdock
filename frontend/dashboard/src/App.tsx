// CallDocker Dashboard Application
// SYNC SYSTEM v2.1.1 - Complete call synchronization deployed - 2025-08-19 15:10
import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './style.css';
import AppRoutes from './AppRoutes';

// Set the backend URL based on environment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5001' 
    : 'https://callcenterdock.onrender.com');

// Make it available globally
(window as any).BACKEND_URL = BACKEND_URL;

function App() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);

  return (
    <Router>
      <div className="App">
        <AppRoutes setCompanyUuid={setCompanyUuid} />
      </div>
    </Router>
  );
}

export default App; 
