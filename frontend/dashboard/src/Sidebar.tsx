import React from 'react';
import { Menu, Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined, TeamOutlined, PhoneOutlined, BarChartOutlined, SettingOutlined, LogoutOutlined, AppstoreOutlined, TagsOutlined, ShareAltOutlined, ClusterOutlined, MessageOutlined, BellOutlined, ContactsOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import logoLight from '/logo-light.png';

const adminItems = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { key: 'agents', icon: <TeamOutlined />, label: 'Agents' },
  { key: 'calls', icon: <PhoneOutlined />, label: 'Calls/Logs' },
  { key: 'chat', icon: <MessageOutlined />, label: 'Chat Management' },
  { key: 'canned', icon: <MessageOutlined />, label: 'Canned Responses' },
  { key: 'crm', icon: <ContactsOutlined />, label: 'CRM & Contacts' },
  { key: 'monitoring', icon: <UserOutlined />, label: 'Real-time Monitoring' },
  { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics & Reports' },
  { key: 'tags', icon: <TagsOutlined />, label: 'Tag/Disposition Mgmt' },
  { key: 'routing', icon: <ClusterOutlined />, label: 'Routing Rules / IVR' },
  { key: 'integrations', icon: <ShareAltOutlined />, label: 'Integrations' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Logout' },
];

const agentItems = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { key: 'calls', icon: <PhoneOutlined />, label: 'Call History' },
  { key: 'chat', icon: <MessageOutlined />, label: 'Chat Sessions' },
  { key: 'notifications', icon: <BellOutlined />, label: 'Notifications' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Logout' },
];

export default function Sidebar({ collapsed, onCollapse, selectedKey, onSelect, userType = 'admin', theme = 'dark' }: {
  collapsed: boolean,
  onCollapse: () => void,
  selectedKey: string,
  onSelect: (key: string) => void,
  userType?: 'admin' | 'agent',
  theme?: 'dark' | 'light',
}) {
  const items = userType === 'admin' ? adminItems : agentItems;

  return (
    <div className={classNames('sidebar', { collapsed })} style={{ height: '100vh', background: '#142c47', borderRight: 'none', transition: 'width 0.2s', width: collapsed ? 80 : 220, position: 'relative', color: '#fff', boxShadow: '2px 0 8px rgba(10,34,57,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottom: '1px solid #1e3a5c', background: '#142c47' }}>
        <img src={logoLight} alt="CallDocker Logo" style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', padding: 4, boxShadow: '0 2px 8px rgba(0,230,239,0.08)' }} />
        <Button type="text" icon={collapsed ? <MenuUnfoldOutlined style={{ color: '#00e6ef' }} /> : <MenuFoldOutlined style={{ color: '#00e6ef' }} />} onClick={onCollapse} style={{ fontSize: 20, marginLeft: 16, color: '#00e6ef' }} />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => onSelect(key as string)}
        style={{ border: 'none', background: 'transparent', fontSize: 16, color: '#fff', transition: 'width 0.2s' }}
        items={items.map(item => ({
          ...item,
          label: collapsed ? null : item.label,
          style: {
            color: selectedKey === item.key ? '#00e6ef' : '#fff',
            background: selectedKey === item.key ? 'rgba(0,230,239,0.08)' : 'transparent',
            borderRadius: 8,
            margin: '4px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s',
          },
          icon: React.cloneElement(item.icon, { style: { color: selectedKey === item.key ? '#00e6ef' : '#fff', fontSize: 20, marginRight: collapsed ? 0 : 12, transition: 'margin 0.2s' } })
        }))}
      />
    </div>
  );
} 