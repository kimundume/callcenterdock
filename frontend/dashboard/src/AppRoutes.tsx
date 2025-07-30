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
import SuperAdminAuth from './SuperAdminAuth';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function AppRoutes({ setCompanyUuid }: { setCompanyUuid: (uuid: string | null) => void }) {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [companyUuid, setLocalCompanyUuid] = useState<string | null>(null);
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [agentUsername, setAgentUsername] = useState<string | null>(null);
  const [superAdminToken, setSuperAdminToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const navigate = useNavigate();

  // Admin auth handlers
  const handleAdminAuth = (token: string, uuid: string) => {
    setAdminToken(token);
    setLocalCompanyUuid(uuid);
    setAgentToken(null);
    setAgentUsername(null);
    setSuperAdminToken(null);
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
    setSuperAdminToken(null);
    setCompanyUuid(uuid);
    navigate('/agent-dashboard');
  };
  const handleAgentLogout = () => {
    setAgentToken(null);
    setLocalCompanyUuid(null);
    setAgentUsername(null);
    setCompanyUuid(null);
  };

  // Super Admin auth handlers
  const handleSuperAdminAuth = (token: string) => {
    setSuperAdminToken(token);
    setAdminToken(null);
    setAgentToken(null);
    setAgentUsername(null);
    setLocalCompanyUuid(null);
    setCompanyUuid(null);
    navigate('/super-admin/dashboard');
  };
  const handleSuperAdminLogout = () => {
    setSuperAdminToken(null);
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      
      {/* Super Admin Routes */}
      <Route path="/super-admin" element={
        !superAdminToken
          ? <SuperAdminAuth onAuth={handleSuperAdminAuth} />
          : <Navigate to="/super-admin/dashboard" />
      } />
      <Route path="/super-admin/dashboard" element={
        !superAdminToken
          ? <Navigate to="/super-admin" />
          : <SuperAdminDashboard onLogout={handleSuperAdminLogout} />
      } />
      
      {/* Regular Admin Routes */}
      <Route path="/dashboard" element={
        (!adminToken || !companyUuid)
          ? <CompanyAuth onAuth={handleAdminAuth} />
          : <AdminDashboard 
              adminToken={adminToken} 
              companyUuid={companyUuid} 
              onLogout={handleAdminLogout} 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              tabSwitcher={setActiveTab}
            />
      } />
      
      {/* Agent Routes */}
      <Route path="/agent-login" element={<AgentLogin onAuth={handleAgentAuth} />} />
      <Route path="/agent-dashboard" element={
        (!agentToken || !companyUuid || !agentUsername)
          ? <Navigate to="/agent-login" />
          : <AgentDashboard agentToken={agentToken} companyUuid={companyUuid} agentUsername={agentUsername} onLogout={handleAgentLogout} />
      } />
      
      {/* Other Routes */}
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/ivr-editor" element={<IVREditor />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
} 
