import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import CompanyAuth from './CompanyAuth';
import AdminDashboard from './AdminDashboard';
import AgentLogin from './AgentLogin';
import AgentDashboard from './AgentDashboard';
import IVRChatWidget from './IVRChatWidget';

function App() {
  const [tab, setTab] = useState<'admin' | 'agent'>('admin');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [agentUsername, setAgentUsername] = useState<string | null>(null);
  // Add activeTab state for admin dashboard
  const [activeTab, setActiveTab] = useState('analytics');
  // Global IVR widget state
  const [widgetOpen, setWidgetOpen] = useState(false);

  // Admin auth handlers
  const handleAdminAuth = (token: string, uuid: string) => {
    setAdminToken(token);
    setCompanyUuid(uuid);
    setAgentToken(null);
    setAgentUsername(null);
  };
  const handleAdminLogout = () => {
    setAdminToken(null);
    setCompanyUuid(null);
  };

  // Agent auth handlers
  const handleAgentAuth = (token: string, uuid: string, username: string) => {
    setAgentToken(token);
    setCompanyUuid(uuid);
    setAdminToken(null);
    setAgentUsername(username);
  };
  const handleAgentLogout = () => {
    setAgentToken(null);
    setCompanyUuid(null);
    setAgentUsername(null);
  };

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={
            <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
              {tab === 'admin' && (!adminToken || !companyUuid) && <CompanyAuth onAuth={handleAdminAuth} />}
              {tab === 'admin' && adminToken && companyUuid && <AdminDashboard adminToken={adminToken} companyUuid={companyUuid} onLogout={handleAdminLogout} tabSwitcher={
                <div style={{ marginTop: 32 }}>
                  <h3>Switch Dashboard Mode</h3>
                  <button onClick={() => setTab('admin')} style={{ marginRight: 12, padding: '8px 24px', background: tab === 'admin' ? '#007bff' : '#eee', color: tab === 'admin' ? '#fff' : '#333', border: 'none', borderRadius: 6, fontWeight: 600 }}>Admin</button>
                  <button onClick={() => setTab('agent')} style={{ padding: '8px 24px', background: tab === 'agent' ? '#007bff' : '#eee', color: tab === 'agent' ? '#fff' : '#333', border: 'none', borderRadius: 6, fontWeight: 600 }}>Agent</button>
                </div>
              } activeTab={activeTab} onTabChange={setActiveTab} />}
              {tab === 'agent' && (!agentToken || !companyUuid || !agentUsername) && <AgentLogin onAuth={handleAgentAuth} />}
              {tab === 'agent' && agentToken && companyUuid && agentUsername && <AgentDashboard agentToken={agentToken} companyUuid={companyUuid} agentUsername={agentUsername} onLogout={handleAgentLogout} tabSwitcher={
                <div style={{ marginTop: 32 }}>
                  <h3>Switch Dashboard Mode</h3>
                  <button onClick={() => setTab('admin')} style={{ marginRight: 12, padding: '8px 24px', background: tab === 'admin' ? '#007bff' : '#eee', color: tab === 'admin' ? '#fff' : '#333', border: 'none', borderRadius: 6, fontWeight: 600 }}>Admin</button>
                  <button onClick={() => setTab('agent')} style={{ padding: '8px 24px', background: tab === 'agent' ? '#007bff' : '#eee', color: tab === 'agent' ? '#fff' : '#333', border: 'none', borderRadius: 6, fontWeight: 600 }}>Agent</button>
                </div>
              } />}
            </div>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      {/* Global IVR Widget Floating Button */}
      <div className="sticky-widget" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 100, animation: 'fadein 1.2s 1.2s both' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', boxShadow: '0 4px 24px #00e6ef33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 32, cursor: 'pointer', border: '4px solid #fff', transition: 'transform 0.2s' }} onClick={() => setWidgetOpen(true)}>
          🤖
        </div>
        <IVRChatWidget open={widgetOpen} onClose={() => setWidgetOpen(false)} companyUuid={companyUuid} />
      </div>
    </>
  );
}

export default App; 