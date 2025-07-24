import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Avatar, Badge, Dropdown, List } from 'antd';
import { BellOutlined } from '@ant-design/icons';

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
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');

  // Placeholder for navigation logic
  const handleSelect = (key: string) => {
    if (key === 'logout') {
      // TODO: handle logout
      return;
    }
    setSelectedKey(key);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header style={{ height: 64, background: '#0a2239', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo: use image if available, else styled text */}
          {/* <img src={logo} alt="Mindfirm Logo" style={{ height: 36, marginRight: 12 }} /> */}
          <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: 1 }}>
            <span style={{ color: '#00e6ef' }}>Mind</span><span style={{ color: '#fff' }}>firm</span>
          </span>
          <span style={{ fontWeight: 600, fontSize: 18, marginLeft: 24 }}>CallDocker</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Notification Bell Dropdown */}
          <Dropdown
            overlay={
              <div style={{ minWidth: 320, background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: 12 }}>
                <List
                  itemLayout="horizontal"
                  dataSource={[
                    { icon: <BellOutlined style={{ color: '#2E73FF', fontSize: 20 }} />, title: 'Missed Call', desc: 'Agent1 missed a call at 3:42 PM', time: '3 mins ago' },
                    { icon: <BellOutlined style={{ color: '#1CC88A', fontSize: 20 }} />, title: 'New Agent Registered', desc: 'Agent2 joined the team', time: '10 mins ago' },
                  ]}
                  renderItem={item => (
                    <List.Item>
                      <div className="notification-card">
                        {item.icon}
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          <div style={{ fontSize: 13, color: '#888' }}>{item.desc}</div>
                          <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>{item.time}</div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            }
            trigger={['click']}
            placement="bottomRight"
            arrow
          >
            <Badge count={2} offset={[-2, 2]}>
              <BellOutlined style={{ fontSize: 22, color: '#00e6ef', cursor: 'pointer' }} />
            </Badge>
          </Dropdown>
          <Avatar style={{ background: '#00e6ef', color: '#0a2239', fontWeight: 700 }}>AD</Avatar>
          <span style={{ fontWeight: 500 }}>Admin User</span>
        </div>
      </header>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Fixed Sidebar */}
        <div style={{ position: 'fixed', top: 64, left: 0, height: 'calc(100vh - 64px)', zIndex: 50, width: collapsed ? 80 : 220, background: '#142c47' }}>
          <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(c => !c)} selectedKey={selectedKey} onSelect={handleSelect} theme="dark" />
        </div>
        {/* Main Content Area with left margin */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f7fafd', marginLeft: collapsed ? 80 : 220, minHeight: 0, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          <main className="dashboard-content" style={{ flex: 1 }}>{children}</main>
        </div>
      </div>
    </div>
  );
} 