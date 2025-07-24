import React, { useState } from 'react';
import CompanyAuth from './CompanyAuth';
import AdminDashboard from './AdminDashboard';
import AgentLogin from './AgentLogin';
import AgentDashboard from './AgentDashboard';

function App() {
  const [tab, setTab] = useState<'admin' | 'agent'>('admin');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [agentUsername, setAgentUsername] = useState<string | null>(null);

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

  // Tab switcher UI
  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      {tab === 'admin' && (!adminToken || !companyUuid) && <CompanyAuth onAuth={handleAdminAuth} />}
      {tab === 'admin' && adminToken && companyUuid && <AdminDashboard adminToken={adminToken} companyUuid={companyUuid} onLogout={handleAdminLogout} tabSwitcher={
        <div style={{ marginTop: 32 }}>
          <h3>Switch Dashboard Mode</h3>
          <button onClick={() => setTab('admin')} style={{ marginRight: 12, padding: '8px 24px', background: tab === 'admin' ? '#007bff' : '#eee', color: tab === 'admin' ? '#fff' : '#333', border: 'none', borderRadius: 6, fontWeight: 600 }}>Admin</button>
          <button onClick={() => setTab('agent')} style={{ padding: '8px 24px', background: tab === 'agent' ? '#007bff' : '#eee', color: tab === 'agent' ? '#fff' : '#333', border: 'none', borderRadius: 6, fontWeight: 600 }}>Agent</button>
        </div>
      } />}
      {tab === 'agent' && (!agentToken || !companyUuid || !agentUsername) && <AgentLogin onAuth={handleAgentAuth} />}
      {tab === 'agent' && agentToken && companyUuid && agentUsername && <AgentDashboard agentToken={agentToken} companyUuid={companyUuid} agentUsername={agentUsername} onLogout={handleAgentLogout} tabSwitcher={
        <div style={{ marginTop: 32 }}>
          <h3>Switch Dashboard Mode</h3>
          <button onClick={() => setTab('admin')} style={{ marginRight: 12, padding: '8px 24px', background: tab === 'admin' ? '#007bff' : '#eee', color: tab === 'admin' ? '#fff' : '#333', border: 'none', borderRadius: 6, fontWeight: 600 }}>Admin</button>
          <button onClick={() => setTab('agent')} style={{ padding: '8px 24px', background: tab === 'agent' ? '#007bff' : '#eee', color: tab === 'agent' ? '#fff' : '#333', border: 'none', borderRadius: 6, fontWeight: 600 }}>Agent</button>
        </div>
      } />}
    </div>
  );
}

export default App; 