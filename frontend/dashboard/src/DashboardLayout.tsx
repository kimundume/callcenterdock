import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Avatar, Badge, Dropdown, List, Menu } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import AdminDashboard from './AdminDashboard';

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  // Map sidebar keys to tab keys
  const tabKeyMap = {
    dashboard: 'dashboard',
    agents: 'agents',
    calls: 'calls',
    monitoring: 'monitoring',
    analytics: 'analytics',
    tags: 'tags',
    routing: 'routing',
    integrations: 'integrations',
    settings: 'settings',
    audit: 'audit',
  };
  const [activeTab, setActiveTab] = useState('dashboard');
  // When sidebar selection changes, update tab
  const handleSelect = (key: string) => {
    if (key === 'logout') {
      // TODO: handle logout
      return;
    }
    setSelectedKey(key);
    if (tabKeyMap[key]) {
      setActiveTab(tabKeyMap[key]);
    }
  };
  // When tab changes, update sidebar selection
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const sidebarKey = Object.keys(tabKeyMap).find(k => tabKeyMap[k] === key);
    if (sidebarKey) setSelectedKey(sidebarKey);
  };
  // Navigation items for horizontal menu
  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'agents', label: 'Agents' },
    { key: 'calls', label: 'Calls/Logs' },
    { key: 'monitoring', label: 'Real-time Monitoring' },
    { key: 'analytics', label: 'Analytics & Reports' },
    { key: 'tags', label: 'Tag/Disposition Mgmt' },
    { key: 'routing', label: 'Routing Rules / IVR' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'settings', label: 'Settings' },
    { key: 'audit', label: 'Audit Log' },
    { key: 'logout', label: 'Logout' },
  ];
  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fa', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar with horizontal menu */}
      <header style={{ height: 64, background: '#0a2239', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: 1 }}>
            <span style={{ color: '#00e6ef' }}>Mind</span><span style={{ color: '#fff' }}>firm</span>
          </span>
          <span style={{ fontWeight: 600, fontSize: 18, marginLeft: 24 }}>CallDocker</span>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => handleSelect(key as string)}
          style={{ background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 16, flex: 1, marginLeft: 48 }}
          items={navItems.map(item => ({
            ...item,
            style: {
              color: selectedKey === item.key ? '#00e6ef' : '#fff',
              background: selectedKey === item.key ? 'rgba(0,230,239,0.08)' : 'transparent',
              borderRadius: 8,
              margin: '0 4px',
              padding: '0 16px',
              transition: 'all 0.2s',
            },
          }))}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Badge count={2} offset={[-2, 2]}>
            <BellOutlined style={{ fontSize: 22, color: '#00e6ef', cursor: 'pointer' }} />
          </Badge>
          <Avatar style={{ background: '#00e6ef', color: '#0a2239', fontWeight: 700 }}>AD</Avatar>
          <span style={{ fontWeight: 500 }}>Admin User</span>
        </div>
      </header>
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f7fafd', minHeight: 0, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
        <main className="dashboard-content" style={{ flex: 1 }}>
          {React.isValidElement(children) && children.type === AdminDashboard
            ? React.cloneElement(children, { activeTab, onTabChange: handleTabChange })
            : children}
        </main>
      </div>
    </div>
  );
} 