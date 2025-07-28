import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined } from '@ant-design/icons';
import logoLight from '/logo-light.png';

const { Title, Text } = Typography;
const API_URL = 'http://localhost:5001/api/super-admin';

interface SuperAdminAuthProps {
  onAuth: (token: string) => void;
}

export default function SuperAdminAuth({ onAuth }: SuperAdminAuthProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store super admin token
      localStorage.setItem('superAdminToken', data.token);
      localStorage.setItem('superAdminUser', JSON.stringify(data.user));
      
      // Call the onAuth callback
      onAuth(data.token);
      
      message.success('Super Admin login successful!');
      
    } catch (error: any) {
      message.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(120deg, #2E73FF 0%, #00e6ef 100%)',
      padding: 20
    }}>
      <div style={{ width: 420, maxWidth: '97vw', background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px #2E73FF22, 0 2px 8px #F6C23E22', border: '2.5px solid #F6C23E', padding: '40px 32px 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
          <img src={logoLight} alt="Calldock Logo" style={{ height: 64, width: 64, borderRadius: '50%', border: '3px solid #F6C23E', background: '#fff', boxShadow: '0 2px 12px #F6C23E22' }} />
        </div>
        <Title level={2} style={{ margin: 0, color: '#2E73FF', fontWeight: 900, letterSpacing: 1 }}>
          <CrownOutlined style={{ marginRight: 8, color: '#F6C23E' }} />
          Super Admin
        </Title>
        <Text type="secondary">System Administration Portal</Text>

        <Form
          name="super-admin-login"
          onFinish={handleLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Super Admin Username" 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password" 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ 
                width: '100%', 
                height: 48, 
                borderRadius: 8,
                background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)',
                border: 'none',
                fontWeight: 600
              }}
            >
              {loading ? 'Signing In...' : 'Sign In as Super Admin'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ⚠️ This portal is for system administrators only
          </Text>
        </div>
      </div>
    </div>
  );
} 
