import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './style.css';
// import logoLight from '/logo-light.png'; // Removed problematic import
import LandingPage from './LandingPage';
import AdminDashboard from './AdminDashboard';
import AgentDashboard from './AgentDashboard';
import CompanyAuth from './CompanyAuth';
import AgentLogin from './AgentLogin';
import SuperAdminAuth from './SuperAdminAuth';
import EmailVerification from './EmailVerification';
import DemoPage from './DemoPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/company-auth" element={<CompanyAuth />} />
          <Route path="/agent-login" element={<AgentLogin />} />
          <Route path="/super-admin" element={<SuperAdminAuth />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/demo" element={<DemoPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 
