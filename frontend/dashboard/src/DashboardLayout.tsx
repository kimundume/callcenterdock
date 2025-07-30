import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Badge, Dropdown, List, Menu } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import AdminDashboard from './AdminDashboard';
import logoLight from '/logo-light.png';
import logoDark from '/logo-dark.png';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard Overview',
  agents: 'Agent Management',
  calls: 'Call Logs',
  monitoring: 'Real-time Monitoring',
  analytics: 'Analytics & Reports',
  tags: 'Tag/Disposition Management',
  routing: 'Routing Rules / IVR',
  integrations: 'Integrations',
  settings: 'Settings',
  logout: 'Logout',
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'admin' | 'agent';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function DashboardLayout({ children, userType, activeTab, onTabChange, onLogout }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleSelect = (key: string) => {
    if (key === 'logout') {
      onLogout();
    } else {
      // Determine base path
      const basePath = userType === 'admin' ? '/dashboard' : '/agent-dashboard';
      navigate(`${basePath}?tab=${key}`);
      onTabChange(key);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fa', display: 'flex', flexDirection: 'row' }}>
      <Sidebar 
        collapsed={collapsed} 
        onCollapse={() => setCollapsed(c => !c)} 
        selectedKey={activeTab} 
        onSelect={handleSelect}
        userType={userType}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f7fafd', minHeight: 0, height: '100vh', overflowY: 'auto' }}>
        <main className="dashboard-content" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
} 
