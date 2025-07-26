import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import CompanyAuth from './CompanyAuth';
import AdminDashboard from './AdminDashboard';
import AgentLogin from './AgentLogin';
import AgentDashboard from './AgentDashboard';
import IVRChatWidget from './IVRChatWidget';
import AppRoutes from './AppRoutes';
import logoLight from '/logo-light.png';

function App() {
  // Only keep widget state if needed globally
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  return (
    <>
      <Router>
        <AppRoutes setCompanyUuid={setCompanyUuid} />
      </Router>
      {/* Global IVR Widget Floating Button */}
      <div className="sticky-widget" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 100, animation: 'fadein 1.2s 1.2s both' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', boxShadow: '0 4px 24px #00e6ef33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 32, cursor: 'pointer', border: '4px solid #fff', transition: 'transform 0.2s' }} onClick={() => setWidgetOpen(true)}>
          🤖
        </div>
        <IVRChatWidget open={widgetOpen} onClose={() => setWidgetOpen(false)} companyUuid={companyUuid} logoSrc={logoLight} />
      </div>
    </>
  );
}

export default App; 