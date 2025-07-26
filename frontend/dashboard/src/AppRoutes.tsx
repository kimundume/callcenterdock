import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import CompanyAuth from './CompanyAuth';
import AdminDashboard from './AdminDashboard';
import AgentLogin from './AgentLogin';
import AgentDashboard from './AgentDashboard';
import DemoPage from './DemoPage';
import IVREditor from './IVREditor';
import EmailVerification from './EmailVerification';

export default function AppRoutes({ setCompanyUuid }: { setCompanyUuid: (uuid: string | null) => void }) {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [companyUuid, setLocalCompanyUuid] = useState<string | null>(null);
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [agentUsername, setAgentUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const navigate = useNavigate();

  // Admin auth handlers
  const handleAdminAuth = (token: string, uuid: string) => {
    setAdminToken(token);
    setLocalCompanyUuid(uuid);
    setAgentToken(null);
    setAgentUsername(null);
    setCompanyUuid(uuid);
    navigate('/dashboard');
  };
  const handleAdminLogout = () => {
    setAdminToken(null);
    setLocalCompanyUuid(null);
    setCompanyUuid(null);
  };

  // Agent auth handlers
  const handleAgentAuth = (token: string, uuid: string, username: string) => {
    setAgentToken(token);
    setLocalCompanyUuid(uuid);
    setAdminToken(null);
    setAgentUsername(username);
    setCompanyUuid(uuid);
    navigate('/agent-dashboard');
  };
  const handleAgentLogout = () => {
    setAgentToken(null);
    setLocalCompanyUuid(null);
    setAgentUsername(null);
    setCompanyUuid(null);
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/dashboard" element={
        (!adminToken || !companyUuid)
          ? <CompanyAuth onAuth={handleAdminAuth} />
          : <AdminDashboard adminToken={adminToken} companyUuid={companyUuid} onLogout={handleAdminLogout} activeTab={activeTab} onTabChange={setActiveTab} />
      } />
      <Route path="/agent-login" element={<AgentLogin onAuth={handleAgentAuth} />} />
      <Route path="/agent-dashboard" element={
        (!agentToken || !companyUuid || !agentUsername)
          ? <Navigate to="/agent-login" />
          : <AgentDashboard agentToken={agentToken} companyUuid={companyUuid} agentUsername={agentUsername} onLogout={handleAgentLogout} />
      } />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/ivr-editor" element={<IVREditor />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
} 