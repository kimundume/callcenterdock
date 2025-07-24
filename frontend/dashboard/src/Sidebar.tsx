import React from 'react';
import { Menu, Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined, TeamOutlined, PhoneOutlined, BarChartOutlined, SettingOutlined, LogoutOutlined, AppstoreOutlined, TagsOutlined, ShareAltOutlined, ClusterOutlined } from '@ant-design/icons';
import classNames from 'classnames';

const items = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { key: 'agents', icon: <TeamOutlined />, label: 'Agents' },
  { key: 'calls', icon: <PhoneOutlined />, label: 'Calls/Logs' },
  { key: 'monitoring', icon: <UserOutlined />, label: 'Real-time Monitoring' },
  { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics & Reports' },
  { key: 'tags', icon: <TagsOutlined />, label: 'Tag/Disposition Mgmt' },
  { key: 'routing', icon: <ClusterOutlined />, label: 'Routing Rules / IVR' },
  { key: 'integrations', icon: <ShareAltOutlined />, label: 'Integrations' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Logout' },
];

export default function Sidebar({ collapsed, onCollapse, selectedKey, onSelect, theme = 'dark' }: {
  collapsed: boolean,
  onCollapse: () => void,
  selectedKey: string,
  onSelect: (key: string) => void,
  theme?: 'dark' | 'light',
}) {
  return (
    <div className={classNames('sidebar', { collapsed })} style={{ height: '100vh', background: '#142c47', borderRight: 'none', transition: 'width 0.2s', width: collapsed ? 80 : 220, position: 'relative', color: '#fff', boxShadow: '2px 0 8px rgba(10,34,57,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', padding: 16, borderBottom: '1px solid #1e3a5c', background: '#142c47' }}>
        {!collapsed && (
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>
            <span style={{ color: '#00e6ef' }}>Mind</span><span style={{ color: '#fff' }}>firm</span>
          </span>
        )}
        <Button type="text" icon={collapsed ? <MenuUnfoldOutlined style={{ color: '#00e6ef' }} /> : <MenuFoldOutlined style={{ color: '#00e6ef' }} />} onClick={onCollapse} style={{ fontSize: 20, marginLeft: collapsed ? 0 : 16, color: '#00e6ef' }} />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => onSelect(key as string)}
        style={{ border: 'none', background: 'transparent', fontSize: 16, color: '#fff' }}
        items={items.map(item => ({
          ...item,
          style: {
            color: selectedKey === item.key ? '#00e6ef' : '#fff',
            background: selectedKey === item.key ? 'rgba(0,230,239,0.08)' : 'transparent',
            borderRadius: 8,
            margin: '4px 0',
          },
          icon: React.cloneElement(item.icon, { style: { color: selectedKey === item.key ? '#00e6ef' : '#fff' } })
        }))}
      />
    </div>
  );
} 