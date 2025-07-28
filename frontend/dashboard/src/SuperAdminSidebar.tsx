import React from 'react';
import { Menu, Button } from 'antd';
import { 
  MenuUnfoldOutlined, 
  MenuFoldOutlined, 
  AppstoreOutlined, 
  TeamOutlined, 
  PhoneOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  ShoppingOutlined, 
  CustomerServiceOutlined, 
  CrownOutlined, 
  KeyOutlined, 
  BellOutlined,
  MessageOutlined,
  DatabaseOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import classNames from 'classnames';
import logoLight from '/logo-light.png';

const superAdminItems = [
  { key: 'overview', icon: <AppstoreOutlined />, label: 'Overview' },
  { key: 'accounts', icon: <UserOutlined />, label: 'Account Management' },
  { key: 'calls', icon: <PhoneOutlined />, label: 'Call Management' },
  { key: 'agents', icon: <TeamOutlined />, label: 'Agent Management' },
  { key: 'content', icon: <FileTextOutlined />, label: 'Content Management' },
  { key: 'packages', icon: <ShoppingOutlined />, label: 'Package Management' },
  { key: 'support', icon: <CustomerServiceOutlined />, label: 'Customer Care' },
  { key: 'analytics', icon: <BarChartOutlined />, label: 'Advanced Analytics' },
  { key: 'system', icon: <DatabaseOutlined />, label: 'System Management' },
  { key: 'users', icon: <TeamOutlined />, label: 'User Management' },
  { key: 'api', icon: <KeyOutlined />, label: 'API Management' },
  { key: 'pending', icon: <BellOutlined />, label: 'Pending Registrations' },
  { key: 'contact', icon: <MessageOutlined />, label: 'Contact Messages' },
  { key: 'health', icon: <GlobalOutlined />, label: 'System Health' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Logout' },
];

export default function SuperAdminSidebar({ collapsed, onCollapse, selectedKey, onSelect, theme = 'dark' }: {
  collapsed: boolean,
  onCollapse: () => void,
  selectedKey: string,
  onSelect: (key: string) => void,
  theme?: 'dark' | 'light',
}) {
  return (
    <div className={classNames('sidebar', { collapsed })} style={{ 
      height: '100vh', 
      background: '#142c47', 
      borderRight: 'none', 
      transition: 'width 0.2s', 
      width: collapsed ? 80 : 220, 
      position: 'relative', 
      color: '#fff', 
      boxShadow: '2px 0 8px rgba(10,34,57,0.04)' 
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 16, 
        borderBottom: '1px solid #1e3a5c', 
        background: '#142c47' 
      }}>
        <img src={logoLight} alt="CallDocker Logo" style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 12, 
          background: '#fff', 
          padding: 4, 
          boxShadow: '0 2px 8px rgba(0,230,239,0.08)' 
        }} />
        <Button 
          type="text" 
          icon={collapsed ? <MenuUnfoldOutlined style={{ color: '#00e6ef' }} /> : <MenuFoldOutlined style={{ color: '#00e6ef' }} />} 
          onClick={onCollapse} 
          style={{ fontSize: 20, marginLeft: 16, color: '#00e6ef' }} 
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => onSelect(key as string)}
        style={{ 
          border: 'none', 
          background: 'transparent', 
          fontSize: 16, 
          color: '#fff', 
          transition: 'width 0.2s' 
        }}
        items={superAdminItems.map(item => ({
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
          icon: React.cloneElement(item.icon, { 
            style: { 
              color: selectedKey === item.key ? '#00e6ef' : '#fff', 
              fontSize: 20, 
              marginRight: collapsed ? 0 : 12, 
              transition: 'margin 0.2s' 
            } 
          })
        }))}
      />
    </div>
  );
} 