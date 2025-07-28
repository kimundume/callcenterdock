import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Tabs, Spin, Upload, Tooltip, List, Avatar, Badge, Divider, Tag, Space, Typography, DatePicker, InputNumber, Slider, Dropdown, Menu, Progress, Layout } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  PhoneOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  FileTextOutlined, 
  ShoppingOutlined, 
  CustomerServiceOutlined, 
  CrownOutlined, 
  KeyOutlined, 
  BellOutlined,
  MessageOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  TagOutlined,
  InfoCircleOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  PointElement,
} from 'chart.js';
import SuperAdminSidebar from './SuperAdminSidebar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ChartTitle,
  ChartTooltip,
  Legend
);

const { TabPane } = Tabs;
const { Option } = Select;
const { Text, Title } = Typography;
const { Header, Content } = Layout;
const API_URL = 'http://localhost:5001/api/super-admin';

interface Account {
  id: string;
  companyName: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin: string;
  subscription: string;
  agents: number;
  calls: number;
  revenue: number;
}

// New interfaces for pending registrations and contact messages
interface PendingCompany {
  uuid: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface PendingAgent {
  uuid: string;
  companyUuid: string;
  username: string;
  email?: string;
  registrationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  timestamp: string;
  handled?: boolean;
}

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

// Mock data for company agents (multi-tenant)
const mockAgents = [
  {
    id: '1',
    username: 'john_agent',
    fullName: 'John Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1-555-0101',
    companyId: 'comp-001',
    companyName: 'TechCorp Solutions',
    role: 'senior_agent',
    status: 'active',
    skills: ['customer_service', 'technical_support', 'sales'],
    performance: {
      callsHandled: 156,
      avgRating: 4.8,
      successRate: 95.2
    },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'sarah_agent',
    fullName: 'Sarah Johnson',
    email: 'sarah.johnson@globalservices.com',
    phone: '+1-555-0102',
    companyId: 'comp-002',
    companyName: 'Global Services Ltd',
    role: 'agent',
    status: 'active',
    skills: ['customer_service', 'billing'],
    performance: {
      callsHandled: 89,
      avgRating: 4.6,
      successRate: 92.1
    },
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    username: 'mike_agent',
    fullName: 'Mike Davis',
    email: 'mike.davis@startupxyz.com',
    phone: '+1-555-0103',
    companyId: 'comp-003',
    companyName: 'StartupXYZ',
    role: 'junior_agent',
    status: 'pending_approval',
    skills: ['customer_service'],
    performance: {
      callsHandled: 0,
      avgRating: 0,
      successRate: 0
    },
    createdAt: '2024-01-20T00:00:00Z'
  }
];

// Mock data for CallDocker agents
const mockCallDockerAgents = [
  {
    id: 'cd-1',
    username: 'alex_support',
    fullName: 'Alex Rodriguez',
    email: 'alex.rodriguez@calldocker.com',
    phone: '+1-555-0201',
    role: 'senior_agent',
    status: 'active',
    skills: ['customer_service', 'technical_support', 'sales', 'enquiry_handling'],
    performance: {
      callsHandled: 234,
      avgRating: 4.9,
      successRate: 97.1
    },
    createdAt: '2024-01-01T00:00:00Z',
    password: 'alex2024!',
    companyUUID: 'calldocker-company-uuid',
    loginCredentials: {
      username: 'alex_support',
      password: 'alex2024!',
      companyUUID: 'calldocker-company-uuid'
    }
  },
  {
    id: 'cd-2',
    username: 'emma_support',
    fullName: 'Emma Wilson',
    email: 'emma.wilson@calldocker.com',
    phone: '+1-555-0202',
    role: 'agent',
    status: 'active',
    skills: ['customer_service', 'enquiry_handling', 'billing'],
    performance: {
      callsHandled: 167,
      avgRating: 4.7,
      successRate: 94.3
    },
    createdAt: '2024-01-10T00:00:00Z',
    password: 'emma2024!',
    companyUUID: 'calldocker-company-uuid',
    loginCredentials: {
      username: 'emma_support',
      password: 'emma2024!',
      companyUUID: 'calldocker-company-uuid'
    }
  }
];

// Overview Tab Component
const OverviewTab = ({ onCreateCompany }: { onCreateCompany: () => void }) => {
  return (
    <div className="overview-tab">
      {/* Quick Actions Section */}
      <Card 
        title="Quick Actions" 
        style={{ marginBottom: 16 }}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={onCreateCompany}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Create New Company
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Button 
              type="default" 
              icon={<TeamOutlined />}
              style={{ width: '100%', height: 80, borderRadius: 8 }}
              onClick={onCreateCompany}
            >
              <div style={{ fontSize: 12, marginTop: 4 }}>Add Company</div>
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type="default" 
              icon={<UserAddOutlined />}
              style={{ width: '100%', height: 80, borderRadius: 8 }}
            >
              <div style={{ fontSize: 12, marginTop: 4 }}>Add Agent</div>
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type="default" 
              icon={<PhoneOutlined />}
              style={{ width: '100%', height: 80, borderRadius: 8 }}
            >
              <div style={{ fontSize: 12, marginTop: 4 }}>Test Call</div>
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type="default" 
              icon={<SettingOutlined />}
              style={{ width: '100%', height: 80, borderRadius: 8 }}
            >
              <div style={{ fontSize: 12, marginTop: 4 }}>System Settings</div>
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Companies"
              value={112}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Active Agents"
              value={1,234}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Calls"
              value={45,678}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Revenue"
              value={89,456}
              prefix="$"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Recent Activity" className="activity-card">
            <List
              size="small"
              dataSource={[
                { action: 'New company registered', time: '2 minutes ago' },
                { action: 'Agent approved', time: '5 minutes ago' },
                { action: 'Call completed', time: '10 minutes ago' },
                { action: 'Support ticket resolved', time: '15 minutes ago' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <span>{item.action}</span>
                  <span style={{ color: '#999' }}>{item.time}</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="System Health" className="health-card">
            <Progress percent={95} status="active" />
            <div style={{ marginTop: 16 }}>
              <Tag color="green">Database: Healthy</Tag>
              <Tag color="green">API: Operational</Tag>
              <Tag color="green">WebSocket: Connected</Tag>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Account Management Tab Component
const AccountManagementTab = ({ onCreateCompany }: { onCreateCompany: () => void }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="account-management-tab">
      <Card 
        title="Company Accounts" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={onCreateCompany}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Create New Company
          </Button>
        }
      >
        <Table
          columns={[
            { title: 'Company', dataIndex: 'companyName', key: 'companyName' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: 'Status', dataIndex: 'status', key: 'status' },
            { title: 'Agents', dataIndex: 'agents', key: 'agents' },
            { title: 'Calls', dataIndex: 'calls', key: 'calls' },
            { title: 'Revenue', dataIndex: 'revenue', key: 'revenue' },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button size="small">Edit</Button>
                  <Button size="small" danger>Suspend</Button>
                </Space>
              )
            }
          ]}
          dataSource={accounts}
          loading={loading}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

// Content Management Tab Component
const ContentManagementTab = () => {
  return (
    <div className="content-management-tab">
      <Tabs defaultActiveKey="blog">
        <Tabs.TabPane tab="Blog Posts" key="blog">
          <Card title="Blog Posts" extra={<Button type="primary">New Post</Button>}>
            <Table
              columns={[
                { title: 'Title', dataIndex: 'title', key: 'title' },
                { title: 'Author', dataIndex: 'author', key: 'author' },
                { title: 'Status', dataIndex: 'status', key: 'status' },
                { title: 'Published', dataIndex: 'publishedAt', key: 'publishedAt' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">Edit</Button>
                      <Button size="small" danger>Delete</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={[]}
              rowKey="id"
            />
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Packages" key="packages">
          <Card title="Subscription Packages" extra={<Button type="primary">New Package</Button>}>
            <Table
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Price', dataIndex: 'price', key: 'price' },
                { title: 'Features', dataIndex: 'features', key: 'features' },
                { title: 'Status', dataIndex: 'status', key: 'status' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">Edit</Button>
                      <Button size="small" danger>Delete</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={[]}
              rowKey="id"
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

// Support Tab Component
const SupportTab = () => {
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  return (
    <div className="support-tab">
      <Tabs defaultActiveKey="messages">
        <Tabs.TabPane tab="Contact Messages" key="messages">
          <Card title="Contact Messages">
            <Table
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
                { title: 'Date', dataIndex: 'timestamp', key: 'timestamp' },
                { title: 'Handled', dataIndex: 'handled', key: 'handled' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">View</Button>
                      <Button size="small" type="primary">Mark Handled</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={contactMessages}
              rowKey="_id"
            />
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Support Tickets" key="tickets">
          <Card title="Support Tickets">
            <Table
              columns={[
                { title: 'Ticket ID', dataIndex: 'id', key: 'id' },
                { title: 'Subject', dataIndex: 'subject', key: 'subject' },
                { title: 'Status', dataIndex: 'status', key: 'status' },
                { title: 'Priority', dataIndex: 'priority', key: 'priority' },
                { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">View</Button>
                      <Button size="small" type="primary">Resolve</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={supportTickets}
              rowKey="id"
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

// System Tab Component
const SystemTab = () => {
  return (
    <div className="system-tab">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="System Configuration">
            <Form layout="vertical">
              <Form.Item label="Site Name">
                <Input defaultValue="CallDocker" />
              </Form.Item>
              <Form.Item label="Contact Email">
                <Input defaultValue="support@calldocker.com" />
              </Form.Item>
              <Form.Item label="Maintenance Mode">
                <Switch defaultChecked={false} />
              </Form.Item>
              <Form.Item>
                <Button type="primary">Save Configuration</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="API Keys">
            <Table
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Key', dataIndex: 'key', key: 'key', ellipsis: true },
                { title: 'Status', dataIndex: 'status', key: 'status' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">Regenerate</Button>
                      <Button size="small" danger>Revoke</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={[]}
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Pending Registrations" style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="companies">
          <Tabs.TabPane tab="Companies" key="companies">
            <Table
              columns={[
                { title: 'Company Name', dataIndex: 'name', key: 'name' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Status', dataIndex: 'status', key: 'status' },
                { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small" type="primary">Approve</Button>
                      <Button size="small" danger>Reject</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={[]}
              rowKey="uuid"
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Agents" key="agents">
            <Table
              columns={[
                { title: 'Username', dataIndex: 'username', key: 'username' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Company', dataIndex: 'companyName', key: 'companyName' },
                { title: 'Status', dataIndex: 'registrationStatus', key: 'registrationStatus' },
                { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small" type="primary">Approve</Button>
                      <Button size="small" danger>Reject</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={[]}
              rowKey="uuid"
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

// Call Management Tab Component
const CallManagementTab = () => {
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [callAnalytics, setCallAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);

  const fetchActiveCalls = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/widget/calls/active');
      if (response.ok) {
        const data = await response.json();
        setActiveCalls(data.calls || []);
      } else {
        console.error('Failed to fetch active calls');
        // Fallback to mock data
        setActiveCalls([
          {
            id: 'call-001',
            visitorId: 'visitor-123',
            pageUrl: 'https://example.com/contact',
            status: 'waiting',
            callType: 'chat',
            priority: 'normal',
            routingType: 'public',
            startTime: new Date().toISOString(),
            assignedAgent: null,
            companyId: null
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching active calls:', error);
      // Fallback to mock data
      setActiveCalls([
        {
          id: 'call-001',
          visitorId: 'visitor-123',
          pageUrl: 'https://example.com/contact',
          status: 'waiting',
          callType: 'chat',
          priority: 'normal',
          routingType: 'public',
          startTime: new Date().toISOString(),
          assignedAgent: null,
          companyId: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallHistory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/widget/calls/history?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data.calls || []);
        setTotalCalls(data.total || 0);
        setCurrentPage(data.page || 1);
      } else {
        console.error('Failed to fetch call history');
        // Fallback to mock data
        setCallHistory([
          {
            id: 'call-001',
            visitorId: 'visitor-123',
            pageUrl: 'https://example.com/contact',
            status: 'ended',
            callType: 'chat',
            priority: 'normal',
            routingType: 'public',
            startTime: new Date(Date.now() - 3600000).toISOString(),
            endTime: new Date().toISOString(),
            duration: 3600,
            assignedAgent: 'alex_support',
            companyId: null
          }
        ]);
        setTotalCalls(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
      // Fallback to mock data
      setCallHistory([
        {
          id: 'call-001',
          visitorId: 'visitor-123',
          pageUrl: 'https://example.com/contact',
          status: 'ended',
          callType: 'chat',
          priority: 'normal',
          routingType: 'public',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date().toISOString(),
          duration: 3600,
          assignedAgent: 'alex_support',
          companyId: null
        }
      ]);
      setTotalCalls(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/widget/calls/analytics?period=7d');
      if (response.ok) {
        const data = await response.json();
        setCallAnalytics(data.analytics || {});
      } else {
        console.error('Failed to fetch call analytics');
        // Fallback to mock data with proper structure
        setCallAnalytics({
          totalCalls: 156,
          avgDuration: 1800,
          satisfaction: 4.8,
          responseTime: 45,
          callsByStatus: {
            active: 5,
            waiting: 2,
            ended: 149,
            missed: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching call analytics:', error);
      // Fallback to mock data with proper structure
      setCallAnalytics({
        totalCalls: 156,
        avgDuration: 1800,
        satisfaction: 4.8,
        responseTime: 45,
        callsByStatus: {
          active: 5,
          waiting: 2,
          ended: 149,
          missed: 0
        }
      });
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/widget/agents/online');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      } else {
        console.error('Failed to fetch agents');
        setAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    }
  };

  const assignCallToAgent = async (callId: string, agentId: string) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`http://localhost:5001/api/super-admin/calls/${callId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId })
      });
      const data = await response.json();
      if (data.success) {
        message.success('Call assigned successfully');
        fetchActiveCalls();
        setAssignModalVisible(false);
      } else {
        message.error(data.error || 'Failed to assign call');
      }
    } catch (error) {
      console.error('Error assigning call:', error);
      message.error('Failed to assign call');
    }
  };

  const updateCallStatus = async (callId: string, status: string, notes?: string) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`http://localhost:5001/api/super-admin/calls/${callId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });
      const data = await response.json();
      if (data.success) {
        message.success('Call status updated successfully');
        fetchActiveCalls();
        fetchCallHistory();
        setCallModalVisible(false);
      } else {
        message.error(data.error || 'Failed to update call status');
      }
    } catch (error) {
      console.error('Error updating call status:', error);
      message.error('Failed to update call status');
    }
  };

  useEffect(() => {
    fetchActiveCalls();
    fetchCallHistory();
    fetchCallAnalytics();
    fetchAgents();
    
    // Set up real-time refresh every 5 seconds
    const interval = setInterval(() => {
      fetchActiveCalls();
      fetchCallHistory();
      fetchAgents();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'orange';
      case 'connecting': return 'blue';
      case 'active': return 'green';
      case 'ended': return 'gray';
      case 'missed': return 'red';
      default: return 'default';
    }
  };

  const activeCallsColumns = [
    {
      title: 'Visitor ID',
      dataIndex: 'visitorId',
      key: 'visitorId',
      render: (visitorId: string) => visitorId.substring(0, 8) + '...',
    },
    {
      title: 'Type',
      dataIndex: 'callType',
      key: 'callType',
      render: (type: string) => (
        <Tag color={type === 'chat' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Assigned Agent',
      dataIndex: 'assignedAgent',
      key: 'assignedAgent',
      render: (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        return agent ? agent.username : 'Unassigned';
      },
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedCall(record);
              setCallModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'waiting' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => {
                setSelectedCall(record);
                setAssignModalVisible(true);
              }}
            >
              Assign
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const callHistoryColumns = [
    {
      title: 'Visitor ID',
      dataIndex: 'visitorId',
      key: 'visitorId',
      render: (visitorId: string) => visitorId.substring(0, 8) + '...',
    },
    {
      title: 'Type',
      dataIndex: 'callType',
      key: 'callType',
      render: (type: string) => (
        <Tag color={type === 'chat' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : 'N/A',
    },
    {
      title: 'Assigned Agent',
      dataIndex: 'assignedAgent',
      key: 'assignedAgent',
      render: (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        return agent ? agent.username : 'Unassigned';
      },
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedCall(record);
            setCallModalVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Analytics Cards */}
      {callAnalytics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF22', background: 'linear-gradient(120deg, #2E73FF 0%, #00e6ef 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'column' }}>
              <PhoneOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <Statistic
                  title={<span style={{ color: '#fff', fontSize: 14 }}>Total Calls</span>}
                  value={callAnalytics.totalCalls || 0}
                  valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}
                />
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'column' }}>
              <ClockCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <Statistic
                  title={<span style={{ color: '#fff', fontSize: 14 }}>Avg Duration</span>}
                  value={callAnalytics.avgDuration ? Math.floor(callAnalytics.avgDuration / 60) : 0}
                  suffix="min"
                  valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}
                />
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #F6C23E22', background: 'linear-gradient(120deg, #F6C23E 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'column' }}>
              <TagOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <Statistic
                  title={<span style={{ color: '#fff', fontSize: 14 }}>Satisfaction</span>}
                  value={callAnalytics.satisfaction || 0}
                  precision={1}
                  valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}
                />
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #E74A3B22', background: 'linear-gradient(120deg, #E74A3B 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'column' }}>
              <UserOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <Statistic
                  title={<span style={{ color: '#fff', fontSize: 14 }}>Missed Calls</span>}
                  value={callAnalytics.callsByStatus?.missed || 0}
                  valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs defaultActiveKey="active-calls">
        <TabPane tab={`Active Calls (${activeCalls.length})`} key="active-calls">
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 24 }}>
            <Table
              dataSource={activeCalls}
              columns={activeCallsColumns}
              loading={loading}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="Call History" key="call-history">
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', padding: 24 }}>
            <Table
              dataSource={callHistory}
              columns={callHistoryColumns}
              loading={loading}
              rowKey="id"
              pagination={{
                current: currentPage,
                total: totalCalls,
                pageSize: 10,
                onChange: (page) => fetchCallHistory(page),
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Call Details Modal */}
      <Modal
        title={<span style={{ fontWeight: 700, fontSize: 18 }}>Call Details</span>}
        open={callModalVisible}
        onCancel={() => setCallModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCallModalVisible(false)} style={{ borderRadius: 8 }}>
            Close
          </Button>,
          selectedCall && selectedCall.status !== 'ended' && (
            <Button 
              key="end" 
              type="primary" 
              danger
              onClick={() => updateCallStatus(selectedCall.id, 'ended')}
              style={{ borderRadius: 8 }}
            >
              End Call
            </Button>
          ),
        ]}
        width={600}
        style={{ top: 20 }}
        bodyStyle={{ padding: 24 }}
      >
        {selectedCall && (
          <div>
            <p><strong>Visitor ID:</strong> {selectedCall.visitorId}</p>
            <p><strong>Page URL:</strong> {selectedCall.pageUrl}</p>
            <p><strong>Call Type:</strong> {selectedCall.callType}</p>
            <p><strong>Status:</strong> 
              <Tag color={getStatusColor(selectedCall.status)} style={{ marginLeft: 8 }}>
                {selectedCall.status.toUpperCase()}
              </Tag>
            </p>
            <p><strong>Start Time:</strong> {new Date(selectedCall.startTime).toLocaleString()}</p>
            {selectedCall.endTime && (
              <p><strong>End Time:</strong> {new Date(selectedCall.endTime).toLocaleString()}</p>
            )}
            {selectedCall.duration && (
              <p><strong>Duration:</strong> {Math.floor(selectedCall.duration / 60)}:{(selectedCall.duration % 60).toString().padStart(2, '0')}</p>
            )}
            <p><strong>Assigned Agent:</strong> {
              agents.find(a => a.id === selectedCall.assignedAgent)?.username || 'Unassigned'
            }</p>
            {selectedCall.notes && (
              <p><strong>Notes:</strong> {selectedCall.notes}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Assign Call Modal */}
      <Modal
        title={<span style={{ fontWeight: 700, fontSize: 18 }}>Assign Call to Agent</span>}
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAssignModalVisible(false)} style={{ borderRadius: 8 }}>
            Cancel
          </Button>,
        ]}
        width={600}
        style={{ top: 20 }}
        bodyStyle={{ padding: 24 }}
      >
        {selectedCall && (
          <div>
            <p><strong>Call ID:</strong> {selectedCall.id}</p>
            <p><strong>Visitor ID:</strong> {selectedCall.visitorId}</p>
            <p><strong>Available Agents:</strong></p>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {agents.filter(agent => agent.status === 'online').map(agent => (
                <Card 
                  key={agent.id} 
                  size="small" 
                  style={{ marginBottom: 8, cursor: 'pointer', borderRadius: 8 }}
                  onClick={() => assignCallToAgent(selectedCall.id, agent.id)}
                >
                  <div>
                    <strong>{agent.username}</strong>
                    <Tag color="green" style={{ marginLeft: 8 }}>Online</Tag>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Company: {agent.companyName} | Current Calls: {agent.currentCalls}/{agent.maxCalls}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Agent Management Tab Component
const AgentManagementTab = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [callDockerAgents, setCallDockerAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [callDockerAgentModalVisible, setCallDockerAgentModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedCallDockerAgent, setSelectedCallDockerAgent] = useState<any>(null);
  const [agentForm] = Form.useForm();
  const [callDockerAgentForm] = Form.useForm();

  // Fetch CallDocker agents from backend
  const fetchCallDockerAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/widget/calldocker-agents');
      if (response.ok) {
        const data = await response.json();
        setCallDockerAgents(data.agents || []);
      } else {
        console.error('Failed to fetch CallDocker agents');
        setCallDockerAgents([]); // No fallback to mock data
      }
    } catch (error) {
      console.error('Error fetching CallDocker agents:', error);
      setCallDockerAgents([]); // No fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  // Fetch company agents from backend
  const fetchCompanyAgents = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/widget/company-agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      } else {
        console.error('Failed to fetch company agents');
        setAgents([]); // No fallback to mock data
      }
    } catch (error) {
      console.error('Error fetching company agents:', error);
      setAgents([]); // No fallback to mock data
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCallDockerAgents();
    fetchCompanyAgents();
  }, []);

  const handleApproveAgent = async (agentId: string) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'active' }
        : agent
    ));
    message.success('Agent approved successfully!');
  };

  const handleRejectAgent = async (agentId: string) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'rejected' }
        : agent
    ));
    message.success('Agent rejected successfully!');
  };

  const handleSuspendAgent = async (agentId: string) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'suspended' }
        : agent
    ));
    message.success('Agent suspended successfully!');
  };

  const handleCreateCallDockerAgent = async (values: any) => {
    try {
      // Ensure we have default values for optional fields
      const formData = {
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        role: values.role || 'agent', // Default to 'agent' if not selected
        skills: values.skills || ['enquiry_handling'] // Default to enquiry_handling if not selected
      };

      console.log('Creating CallDocker agent with data:', formData);

      // Call backend API to create CallDocker agent
      const response = await fetch('http://localhost:5001/api/widget/calldocker-agent/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show success message with credentials
        Modal.info({
          title: 'CallDocker Agent Created Successfully!',
          content: (
            <div>
              <p><strong>Username:</strong> {data.agent.username}</p>
              <p><strong>Password:</strong> {data.agent.password}</p>
              <p><strong>Company UUID:</strong> {data.agent.companyUuid}</p>
              <p><strong>Login URL:</strong> <a href={`/agent-login?username=${data.agent.username}&password=${data.agent.password}&companyUuid=${data.agent.companyUuid}`} target="_blank">Click here to login</a></p>
              <Button
                type="primary"
                onClick={() => {
                  navigator.clipboard.writeText(`Username: ${data.agent.username}\nPassword: ${data.agent.password}\nCompany UUID: ${data.agent.companyUuid}`);
                  message.success('Credentials copied to clipboard!');
                }}
                style={{ marginTop: 10 }}
              >
                Copy Credentials
              </Button>
            </div>
          ),
          width: 500,
        });

        // Close modal and reset form
        setCallDockerAgentModalVisible(false);
        callDockerAgentForm.resetFields();
        
        // Refresh the CallDocker agents list
        fetchCallDockerAgents();
        
        message.success('CallDocker agent created successfully!');
      } else {
        const errorData = await response.json();
        message.error(`Error creating CallDocker agent: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating CallDocker agent:', error);
      message.error('Error creating CallDocker agent: Server error');
    }
  };

  const handleSuspendCallDockerAgent = async (agentId: string) => {
    setCallDockerAgents(callDockerAgents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'suspended' }
        : agent
    ));
    message.success('CallDocker agent suspended successfully!');
  };

  const handleActivateCallDockerAgent = async (agentId: string) => {
    setCallDockerAgents(callDockerAgents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'active' }
        : agent
    ));
    message.success('CallDocker agent activated successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending_approval': return 'orange';
      case 'suspended': return 'red';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'senior_agent': return 'red';
      case 'agent': return 'blue';
      case 'junior_agent': return 'green';
      default: return 'default';
    }
  };

  const agentColumns = [
    {
      title: 'Agent',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar style={{ marginRight: 8 }}>{name.charAt(0)}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>@{record.username}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (companyName: string) => (
        <Tag color="blue">{companyName}</Tag>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record: any) => (
        <div>
          <div>{record.email}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.phone}</div>
        </div>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {role.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={getStatusColor(status) as any} text={status.replace('_', ' ').toUpperCase()} />
      )
    },
    {
      title: 'Skills',
      key: 'skills',
      render: (_, record: any) => (
        <div>
          {record.skills.map((skill: string) => (
            <Tag key={skill} color="green" style={{ marginBottom: 4 }}>
              {skill.replace('_', ' ')}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record: any) => (
        <div>
          <div>Calls: {record.performance.callsHandled}</div>
          <div>Rating: {record.performance.avgRating}/5</div>
          <div>Success: {record.performance.successRate}%</div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => {
            setSelectedAgent(record);
            setAgentModalVisible(true);
          }}>
            View Details
          </Button>
          {record.status === 'pending_approval' && (
            <>
              <Button type="link" size="small" onClick={() => handleApproveAgent(record.id)}>
                Approve
              </Button>
              <Button type="link" size="small" danger onClick={() => handleRejectAgent(record.id)}>
                Reject
              </Button>
            </>
          )}
          {record.status === 'active' && (
            <Button type="link" size="small" danger onClick={() => handleSuspendAgent(record.id)}>
              Suspend
            </Button>
          )}
          {record.status === 'suspended' && (
            <Button type="link" size="small" onClick={() => handleApproveAgent(record.id)}>
              Activate
            </Button>
          )}
        </Space>
      )
    }
  ];

  const handleViewCallDockerAgentCredentials = (agent: any) => {
    Modal.info({
      title: `Login Credentials for ${agent.fullName}`,
      content: (
        <div>
          <p><strong>Agent Details:</strong></p>
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginTop: 8 }}>
            <p><strong>Full Name:</strong> {agent.fullName}</p>
            <p><strong>Username:</strong> {agent.username}</p>
            <p><strong>Password:</strong> {agent.password || 'Not set'}</p>
            <p><strong>Company UUID:</strong> {agent.companyUUID || 'calldocker-company-uuid'}</p>
            <p><strong>Email:</strong> {agent.email}</p>
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
            Use these credentials to log in to the agent portal.
          </p>
        </div>
      ),
      width: 500,
      okText: 'Copy Credentials',
      onOk: () => {
        const credentials = `Username: ${agent.username}\nPassword: ${agent.password || 'Not set'}\nCompany UUID: ${agent.companyUUID || 'calldocker-company-uuid'}`;
        navigator.clipboard.writeText(credentials);
        message.success('Credentials copied to clipboard!');
      }
    });
  };

  const callDockerAgentColumns = [
    {
      title: 'Agent',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar style={{ marginRight: 8 }}>{name.charAt(0)}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>@{record.username}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record: any) => (
        <div>
          <div>{record.email}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.phone}</div>
        </div>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {role.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={getStatusColor(status) as any} text={status.replace('_', ' ').toUpperCase()} />
      )
    },
    {
      title: 'Skills',
      key: 'skills',
      render: (_, record: any) => (
        <div>
          {record.skills.map((skill: string) => (
            <Tag key={skill} color="green" style={{ marginBottom: 4 }}>
              {skill.replace('_', ' ')}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record: any) => (
        <div>
          <div>Calls: {record.performance.callsHandled}</div>
          <div>Rating: {record.performance.avgRating}/5</div>
          <div>Success: {record.performance.successRate}%</div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => {
            setSelectedCallDockerAgent(record);
            setAgentModalVisible(true);
          }}>
            View Details
          </Button>
          <Button type="link" size="small" onClick={() => handleViewCallDockerAgentCredentials(record)}>
            View Credentials
          </Button>
          {record.status === 'active' && (
            <Button type="link" size="small" danger onClick={() => handleSuspendCallDockerAgent(record.id)}>
              Suspend
            </Button>
          )}
          {record.status === 'suspended' && (
            <Button type="link" size="small" onClick={() => handleActivateCallDockerAgent(record.id)}>
              Activate
            </Button>
          )}
        </Space>
      )
    }
  ];

  // Add a test agent creation button and handler
  const handleCreateTestCallDockerAgent = async () => {
    const testAgent = {
      username: `testagent${Math.floor(Math.random() * 10000)}`,
      fullName: 'Test Agent',
      email: `test${Math.floor(Math.random() * 10000)}@calldocker.com`,
      phone: '1234567890',
      role: 'agent',
      skills: ['enquiry_handling']
    };
    try {
      const response = await fetch('http://localhost:5001/api/widget/calldocker-agent/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAgent)
      });
      if (response.ok) {
        const data = await response.json();
        Modal.info({
          title: 'Test CallDocker Agent Created!',
          content: (
            <div>
              <p><strong>Username:</strong> {data.agent.username}</p>
              <p><strong>Password:</strong> {data.agent.password}</p>
              <p><strong>Company UUID:</strong> {data.agent.companyUuid}</p>
              <p><strong>Login URL:</strong> <a href={`/agent-login?username=${data.agent.username}&password=${data.agent.password}&companyUuid=${data.agent.companyUuid}`} target="_blank">Click here to login</a></p>
              <Button
                type="primary"
                onClick={() => {
                  navigator.clipboard.writeText(`Username: ${data.agent.username}\nPassword: ${data.agent.password}\nCompany UUID: ${data.agent.companyUuid}`);
                  message.success('Credentials copied to clipboard!');
                }}
                style={{ marginTop: 10 }}
              >
                Copy Credentials
              </Button>
            </div>
          ),
          width: 500,
        });
        fetchCallDockerAgents();
      } else {
        const errorData = await response.json();
        message.error(`Error creating test agent: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      message.error('Error creating test agent: Server error');
    }
  };

  return (
    <div>
      {/* CallDocker Agents Section */}
      <Card 
        title={<span style={{ fontWeight: 700, fontSize: 20 }}>CallDocker Agents (Landing Page Enquiries)</span>}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCallDockerAgentModalVisible(true)} style={{ borderRadius: 8 }}>
              Create CallDocker Agent
            </Button>
            <Button onClick={handleCreateTestCallDockerAgent} style={{ borderRadius: 8 }}>
              Test CallDocker Agent
            </Button>
          </div>
        }
        style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic title="Total CallDocker Agents" value={callDockerAgents.length} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Active CallDocker Agents" value={callDockerAgents.filter(a => a.status === 'active').length} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Total Enquiries Handled" value={callDockerAgents.reduce((sum, a) => sum + a.performance.callsHandled, 0)} />
          </Col>
        </Row>
      </Card>

      {/* CallDocker Agents Table */}
      <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', marginBottom: 24 }}>
        <Table
          columns={callDockerAgentColumns}
          dataSource={callDockerAgents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true
          }}
        />
      </Card>

      {/* Company Agents Section */}
      <Card 
        title={<span style={{ fontWeight: 700, fontSize: 20 }}>Company Agent Management</span>}
        style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic title="Total Company Agents" value={agents.length} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Active Company Agents" value={agents.filter(a => a.status === 'active').length} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Pending Approval" value={agents.filter(a => a.status === 'pending_approval').length} />
          </Col>
        </Row>
      </Card>

      {/* Company Agents Table */}
      <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11' }}>
        <Table
          columns={agentColumns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true
          }}
        />
      </Card>

      {/* Agent Details Modal */}
      <Modal
        title={<span style={{ fontWeight: 700, fontSize: 18 }}>
          Agent Details
        </span>}
        open={agentModalVisible}
        onCancel={() => {
          setAgentModalVisible(false);
          setSelectedAgent(null);
          setSelectedCallDockerAgent(null);
        }}
        footer={null}
        width={600}
        style={{ top: 20 }}
        bodyStyle={{ padding: 24 }}
      >
        {(selectedAgent || selectedCallDockerAgent) && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div>
                  <Text strong>Full Name:</Text>
                  <div>{selectedAgent?.fullName || selectedCallDockerAgent?.fullName}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Username:</Text>
                  <div>@{selectedAgent?.username || selectedCallDockerAgent?.username}</div>
                </div>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <div>
                  <Text strong>Email:</Text>
                  <div>{selectedAgent?.email || selectedCallDockerAgent?.email}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Phone:</Text>
                  <div>{selectedAgent?.phone || selectedCallDockerAgent?.phone}</div>
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <div>
                  <Text strong>Company:</Text>
                  <div>{selectedAgent?.companyName || 'CallDocker'}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Role:</Text>
                  <div>{(selectedAgent?.role || selectedCallDockerAgent?.role).replace('_', ' ').toUpperCase()}</div>
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <div>
                  <Text strong>Status:</Text>
                  <div>
                    <Badge status={getStatusColor(selectedAgent?.status || selectedCallDockerAgent?.status) as any} text={(selectedAgent?.status || selectedCallDockerAgent?.status).replace('_', ' ').toUpperCase()} />
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Created:</Text>
                  <div>{new Date(selectedAgent?.createdAt || selectedCallDockerAgent?.createdAt).toLocaleDateString()}</div>
                </div>
              </Col>
            </Row>

            <div style={{ marginTop: 16 }}>
              <Text strong>Skills:</Text>
              <div style={{ marginTop: 8 }}>
                {(selectedAgent?.skills || selectedCallDockerAgent?.skills).map((skill: string) => (
                  <Tag key={skill} color="green" style={{ marginBottom: 4 }}>
                    {skill.replace('_', ' ')}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>Performance:</Text>
              <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <Statistic title="Calls Handled" value={(selectedAgent?.performance?.callsHandled || selectedCallDockerAgent?.performance?.callsHandled)} />
                </Col>
                <Col span={8}>
                  <Statistic title="Avg Rating" value={(selectedAgent?.performance?.avgRating || selectedCallDockerAgent?.performance?.avgRating)} suffix="/5" />
                </Col>
                <Col span={8}>
                  <Statistic title="Success Rate" value={(selectedAgent?.performance?.successRate || selectedCallDockerAgent?.performance?.successRate)} suffix="%" />
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>

      {/* NEW: CallDocker Agent Creation Modal */}
      <Modal
        title={<span style={{ fontWeight: 700, fontSize: 18 }}>Create New CallDocker Agent</span>}
        open={callDockerAgentModalVisible}
        onCancel={() => {
          setCallDockerAgentModalVisible(false);
          callDockerAgentForm.resetFields();
        }}
        footer={null}
        width={600}
        style={{ top: 20 }}
        bodyStyle={{ padding: 24 }}
      >
        <Form form={callDockerAgentForm} layout="vertical" onFinish={handleCreateCallDockerAgent}>
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please enter username' }]}>
                <Input placeholder="e.g., alex_support" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Please enter full name' }]}>
                <Input placeholder="e.g., Alex Rodriguez" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter email' }, { type: 'email', message: 'Please enter a valid email' }]}>
                <Input placeholder="alex.rodriguez@calldocker.com" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Please enter phone number' }]}>
                <Input placeholder="+1-555-0201" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Form.Item label="Role" name="role">
                <Select placeholder="Select role (optional)" allowClear showSearch>
                  <Option value="senior_agent">Senior Agent</Option>
                  <Option value="agent">Agent</Option>
                  <Option value="junior_agent">Junior Agent</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="Skills" name="skills">
                <Select mode="multiple" placeholder="Select skills (optional)" allowClear showSearch>
                  <Option value="customer_service">Customer Service</Option>
                  <Option value="technical_support">Technical Support</Option>
                  <Option value="sales">Sales</Option>
                  <Option value="billing">Billing</Option>
                  <Option value="enquiry_handling">Enquiry Handling</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Button onClick={() => { setCallDockerAgentModalVisible(false); callDockerAgentForm.resetFields(); }} style={{ marginRight: 8, borderRadius: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ borderRadius: 8 }}>Create CallDocker Agent</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

// Package Management Tab Component
const PackageManagementTab = () => {
  return (
    <div className="package-management-tab">
      <Card title="Subscription Packages" extra={<Button type="primary">New Package</Button>}>
        <Table
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Price', dataIndex: 'price', key: 'price' },
            { title: 'Features', dataIndex: 'features', key: 'features' },
            { title: 'Status', dataIndex: 'status', key: 'status' },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">Edit</Button>
                  <Button size="small" danger>Delete</Button>
                </Space>
              )
            }
          ]}
          dataSource={[]}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = () => {
  return (
    <div className="analytics-tab">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Call Analytics">
            <div style={{ height: 300 }}>
              <Bar
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'Total Calls',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: 'rgba(0, 230, 239, 0.8)',
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Revenue Analytics">
            <div style={{ height: 300 }}>
              <Line
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'Revenue',
                    data: [65, 59, 80, 81, 56, 55],
                    borderColor: 'rgba(46, 115, 255, 1)',
                    backgroundColor: 'rgba(46, 115, 255, 0.1)',
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// User Management Tab Component
const UserManagementTab = () => {
  return (
    <div className="user-management-tab">
      <Card title="User Management" extra={<Button type="primary">Add User</Button>}>
        <Table
          columns={[
            { title: 'Username', dataIndex: 'username', key: 'username' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: 'Role', dataIndex: 'role', key: 'role' },
            { title: 'Status', dataIndex: 'status', key: 'status' },
            { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">Edit</Button>
                  <Button size="small" danger>Suspend</Button>
                </Space>
              )
            }
          ]}
          dataSource={[]}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

// API Management Tab Component
const ApiManagementTab = () => {
  return (
    <div className="api-management-tab">
      <Card title="API Keys" extra={<Button type="primary">Generate New Key</Button>}>
        <Table
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Key', dataIndex: 'key', key: 'key', ellipsis: true },
            { title: 'Status', dataIndex: 'status', key: 'status' },
            { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">Regenerate</Button>
                  <Button size="small" danger>Revoke</Button>
                </Space>
              )
            }
          ]}
          dataSource={[]}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

// Pending Registrations Tab Component
const PendingRegistrationsTab = ({ onCreateCompany }: { onCreateCompany: () => void }) => {
  return (
    <div className="pending-registrations-tab">
      <Tabs defaultActiveKey="companies">
        <Tabs.TabPane tab="Companies" key="companies">
          <Card 
            title="Pending Company Registrations"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={onCreateCompany}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Create New Company
              </Button>
            }
          >
            <Table
              columns={[
                { title: 'Company Name', dataIndex: 'name', key: 'name' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Status', dataIndex: 'status', key: 'status' },
                { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small" type="primary">Approve</Button>
                      <Button size="small" danger>Reject</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={[]}
              rowKey="uuid"
            />
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Agents" key="agents">
          <Card title="Pending Agent Registrations">
            <Table
              columns={[
                { title: 'Username', dataIndex: 'username', key: 'username' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Company', dataIndex: 'companyName', key: 'companyName' },
                { title: 'Status', dataIndex: 'registrationStatus', key: 'registrationStatus' },
                { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small" type="primary">Approve</Button>
                      <Button size="small" danger>Reject</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={[]}
              rowKey="uuid"
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

// Contact Messages Tab Component
const ContactMessagesTab = () => {
  return (
    <div className="contact-messages-tab">
      <Card title="Contact Messages">
        <Table
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
            { title: 'Date', dataIndex: 'timestamp', key: 'timestamp' },
            { title: 'Handled', dataIndex: 'handled', key: 'handled' },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">View</Button>
                  <Button size="small" type="primary">Mark Handled</Button>
                </Space>
              )
            }
          ]}
          dataSource={[]}
          rowKey="_id"
        />
      </Card>
    </div>
  );
};

// System Health Tab Component
const SystemHealthTab = () => {
  return (
    <div className="system-health-tab">
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Database Status">
            <Progress percent={95} status="active" />
            <Tag color="green" style={{ marginTop: 8 }}>Healthy</Tag>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="API Status">
            <Progress percent={98} status="active" />
            <Tag color="green" style={{ marginTop: 8 }}>Operational</Tag>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="WebSocket Status">
            <Progress percent={100} status="active" />
            <Tag color="green" style={{ marginTop: 8 }}>Connected</Tag>
          </Card>
        </Col>
      </Row>
      
      <Card title="System Logs" style={{ marginTop: 16 }}>
        <List
          size="small"
          dataSource={[
            { message: 'System backup completed successfully', time: '2 minutes ago', level: 'info' },
            { message: 'New user registration: john@example.com', time: '5 minutes ago', level: 'info' },
            { message: 'API rate limit warning for IP 192.168.1.1', time: '10 minutes ago', level: 'warning' },
            { message: 'Database connection restored', time: '15 minutes ago', level: 'info' }
          ]}
          renderItem={(item) => (
            <List.Item>
              <Tag color={item.level === 'warning' ? 'orange' : 'blue'}>{item.level.toUpperCase()}</Tag>
              <span>{item.message}</span>
              <span style={{ color: '#999', marginLeft: 'auto' }}>{item.time}</span>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = () => {
  return (
    <div className="settings-tab">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="General Settings">
            <Form layout="vertical">
              <Form.Item label="Site Name">
                <Input defaultValue="CallDocker" />
              </Form.Item>
              <Form.Item label="Contact Email">
                <Input defaultValue="support@calldocker.com" />
              </Form.Item>
              <Form.Item label="Maintenance Mode">
                <Switch defaultChecked={false} />
              </Form.Item>
              <Form.Item>
                <Button type="primary">Save Settings</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Security Settings">
            <Form layout="vertical">
              <Form.Item label="Session Timeout (minutes)">
                <InputNumber defaultValue={30} min={5} max={120} />
              </Form.Item>
              <Form.Item label="Enable Two-Factor Authentication">
                <Switch defaultChecked={true} />
              </Form.Item>
              <Form.Item label="Password Policy">
                <Select defaultValue="strong">
                  <Option value="weak">Weak</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="strong">Strong</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary">Save Security Settings</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Company Creation Modal Component
const CompanyCreationModal = ({ visible, onCancel, onSuccess }: { visible: boolean; onCancel: () => void; onSuccess: () => void }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCreateCompany = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch('http://localhost:5001/api/super-admin/create-company', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Company created successfully!');
        form.resetFields();
        onSuccess();
        onCancel();
      } else {
        message.error(data.error || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      message.error('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span style={{ fontWeight: 700, fontSize: 18 }}>Create New Company</span>}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      style={{ top: 20 }}
      bodyStyle={{ padding: 24 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateCompany}
        initialValues={{
          displayName: '',
          adminEmail: ''
        }}
      >
        <Form.Item
          label="Company Name"
          name="companyName"
          rules={[{ required: true, message: 'Company name is required' }]}
        >
          <Input placeholder="Enter company name" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          label="Display Name (Optional)"
          name="displayName"
        >
          <Input placeholder="Enter display name" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          label="Company Email"
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="Enter company email" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          label="Admin Username"
          name="adminUsername"
          rules={[{ required: true, message: 'Admin username is required' }]}
        >
          <Input placeholder="Enter admin username" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          label="Admin Email (Optional)"
          name="adminEmail"
        >
          <Input placeholder="Enter admin email (uses company email if empty)" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          label="Admin Password"
          name="adminPassword"
          rules={[
            { required: true, message: 'Password is required' },
            { min: 8, message: 'Password must be at least 8 characters' }
          ]}
        >
          <Input.Password placeholder="Enter admin password" style={{ borderRadius: 8 }} />
        </Form.Item>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <Button onClick={onCancel} style={{ borderRadius: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ borderRadius: 8, fontWeight: 600 }}>
            Create Company
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  // State for modals and forms
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [companyCreationModalVisible, setCompanyCreationModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Forms
  const [accountForm] = Form.useForm();
  const [contentForm] = Form.useForm();
  const [packageForm] = Form.useForm();
  const [agentForm] = Form.useForm();

  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [frontpageContent, setFrontpageContent] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [systemConfig, setSystemConfig] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const handleTabChange = (key: string) => {
    if (key === 'logout') {
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdminUser');
      onLogout();
    } else {
      setActiveTab(key);
    }
  };

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
    fetchBlogPosts();
    fetchPackages();
    fetchSupportTickets();
    fetchFrontpageContent();
    fetchAnalytics();
    fetchSystemConfig();
    fetchUsers();
    fetchApiKeys();
    fetchPendingRegistrations();
    fetchContactMessages();

    // Initialize mock data for restored tabs
    setUsers([
      {
        id: '1',
        name: 'John Admin',
        email: 'john@company.com',
        role: 'admin',
        status: 'active',
        lastLogin: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Sarah Manager',
        email: 'sarah@company.com',
        role: 'manager',
        status: 'active',
        lastLogin: '2024-01-15T09:15:00Z'
      },
      {
        id: '3',
        name: 'Mike Agent',
        email: 'mike@company.com',
        role: 'agent',
        status: 'active',
        lastLogin: '2024-01-15T08:45:00Z'
      }
    ]);

    setApiKeys([
      {
        id: '1',
        key: 'sk_test_1234567890abcdef',
        name: 'Production API Key',
        permissions: ['read', 'write', 'delete'],
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        key: 'sk_test_0987654321fedcba',
        name: 'Development API Key',
        permissions: ['read'],
        status: 'active',
        createdAt: '2024-01-10T00:00:00Z'
      }
    ]);

    setAnalytics({
      totalCalls: 1234,
      successRate: 98.5,
      avgDuration: 4.5,
      activeAgents: 15,
      callVolumeData: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Calls',
          data: [65, 59, 80, 81, 56, 55, 40],
          borderColor: '#2E73FF',
          backgroundColor: 'rgba(46, 115, 255, 0.1)',
          tension: 0.4
        }]
      },
      agentPerformanceData: {
        labels: ['Agent 1', 'Agent 2', 'Agent 3', 'Agent 4', 'Agent 5'],
        datasets: [{
          label: 'Calls Handled',
          data: [12, 19, 15, 25, 22],
          backgroundColor: 'rgba(0, 230, 239, 0.8)',
          borderColor: '#00e6ef',
          borderWidth: 1
        }]
      }
    });

    setPendingCompanies([
      {
        uuid: 'comp-001',
        name: 'Tech Solutions Inc',
        email: 'contact@techsolutions.com',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        uuid: 'comp-002',
        name: 'Global Services Ltd',
        email: 'info@globalservices.com',
        status: 'pending',
        createdAt: '2024-01-14T15:30:00Z'
      }
    ]);

    setPendingAgents([
      {
        uuid: 'agent-001',
        companyUuid: 'comp-001',
        username: 'jane_agent',
        email: 'jane@techsolutions.com',
        registrationStatus: 'pending',
        createdAt: '2024-01-15T11:00:00Z'
      },
      {
        uuid: 'agent-002',
        companyUuid: 'comp-002',
        username: 'bob_agent',
        email: 'bob@globalservices.com',
        registrationStatus: 'pending',
        createdAt: '2024-01-14T16:00:00Z'
      }
    ]);

    setContactMessages([
      {
        _id: 'msg-001',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1-555-0123',
        message: 'I need help with my account setup. Can someone assist me?',
        timestamp: '2024-01-15T12:00:00Z',
        handled: false
      },
      {
        _id: 'msg-002',
        name: 'Bob Smith',
        email: 'bob@example.com',
        message: 'Great service! Just wanted to say thank you.',
        timestamp: '2024-01-15T10:30:00Z',
        handled: true
      },
      {
        _id: 'msg-003',
        name: 'Carol Davis',
        email: 'carol@example.com',
        phone: '+1-555-0456',
        message: 'I have a billing question regarding my subscription.',
        timestamp: '2024-01-15T09:15:00Z',
        handled: false
      }
    ]);

    // Mock accounts data
    setAccounts([
      {
        id: '1',
        companyName: 'TechCorp Solutions',
        email: 'admin@techcorp.com',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-01-15T10:30:00Z',
        subscription: 'premium',
        agents: 2,
        calls: 1250,
        revenue: 15000
      },
      {
        id: '2',
        companyName: 'Global Services Ltd',
        email: 'contact@globalservices.com',
        status: 'active',
        createdAt: '2024-01-05T00:00:00Z',
        lastLogin: '2024-01-15T09:15:00Z',
        subscription: 'enterprise',
        agents: 1,
        calls: 890,
        revenue: 25000
      },
      {
        id: '3',
        companyName: 'StartupXYZ',
        email: 'hello@startupxyz.com',
        status: 'pending',
        createdAt: '2024-01-10T00:00:00Z',
        lastLogin: '2024-01-12T14:20:00Z',
        subscription: 'basic',
        agents: 0,
        calls: 0,
        revenue: 0
      }
    ]);
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch accounts');
      
      const data = await response.json();
      setAccounts(data.accounts);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_URL}/content/blog-posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      
      const data = await response.json();
      setBlogPosts(data.posts);
    } catch (error: any) {
      console.error('Failed to fetch blog posts:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_URL}/packages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch packages');
      
      const data = await response.json();
      setPackages(data.packages);
    } catch (error: any) {
      console.error('Failed to fetch packages:', error);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_URL}/support/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch support tickets');
      
      const data = await response.json();
      setSupportTickets(data.tickets);
    } catch (error: any) {
      console.error('Failed to fetch support tickets:', error);
    }
  };

  const fetchFrontpageContent = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_URL}/content/frontpage`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch frontpage content');
      
      const data = await response.json();
      setFrontpageContent(data.content);
    } catch (error: any) {
      console.error('Failed to fetch frontpage content:', error);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_URL}/analytics/advanced`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_URL}/system/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch system config');
      
      const data = await response.json();
      setSystemConfig(data.config);
    } catch (error: any) {
      console.error('Failed to fetch system config:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`${API_URL}/api-keys`);
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      message.error('Failed to fetch API keys');
    }
  };

  // Fetch pending registrations
  const fetchPendingRegistrations = async () => {
    setPendingLoading(true);
    try {
      const response = await fetch(`${API_URL}/pending-registrations`);
      if (response.ok) {
        const data = await response.json();
        setPendingCompanies(data.companies || []);
        setPendingAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      message.error('Failed to fetch pending registrations');
    } finally {
      setPendingLoading(false);
    }
  };

  // Fetch contact messages
  const fetchContactMessages = async () => {
    setContactLoading(true);
    try {
      const response = await fetch(`${API_URL}/contact-messages`);
      if (response.ok) {
        const data = await response.json();
        setContactMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      message.error('Failed to fetch contact messages');
    } finally {
      setContactLoading(false);
    }
  };

  const handleAccountAction = async (accountId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      const response = await fetch(`${API_URL}/accounts/${accountId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`Account ${action}d successfully`);
        fetchAccounts();
      } else {
        message.error(`Failed to ${action} account`);
      }
    } catch (error) {
      console.error(`Error ${action}ing account:`, error);
      message.error(`Failed to ${action} account`);
    }
  };

  // Handle pending registration approval/rejection
  const handlePendingAction = async (type: 'company' | 'agent', id: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`${API_URL}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id })
      });
      
      if (response.ok) {
        message.success(`${type} ${action}d successfully`);
        fetchPendingRegistrations();
      } else {
        message.error(`Failed to ${action} ${type}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing ${type}:`, error);
      message.error(`Failed to ${action} ${type}`);
    }
  };

  // Handle contact message actions
  const handleContactMessageAction = async (messageId: string, action: 'mark-handled' | 'delete') => {
    try {
      const response = await fetch(`${API_URL}/contact-messages/${messageId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`Message ${action === 'mark-handled' ? 'marked as handled' : 'deleted'} successfully`);
        fetchContactMessages();
      } else {
        message.error(`Failed to ${action} message`);
      }
    } catch (error) {
      console.error(`Error ${action}ing message:`, error);
      message.error(`Failed to ${action} message`);
    }
  };

  // Handle API key actions
  const handleApiKeyAction = async (keyId: string, action: 'revoke' | 'regenerate') => {
    try {
      const response = await fetch(`${API_URL}/api-keys/${keyId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`API key ${action}d successfully`);
        fetchApiKeys();
      } else {
        message.error(`Failed to ${action} API key`);
      }
    } catch (error) {
      console.error(`Error ${action}ing API key:`, error);
      message.error(`Failed to ${action} API key`);
    }
  };

  // Handle blog post actions
  const handleBlogPostAction = async (postId: string, action: 'publish' | 'unpublish' | 'delete') => {
    try {
      const response = await fetch(`${API_URL}/blog-posts/${postId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`Blog post ${action}d successfully`);
        fetchBlogPosts();
      } else {
        message.error(`Failed to ${action} blog post`);
      }
    } catch (error) {
      console.error(`Error ${action}ing blog post:`, error);
      message.error(`Failed to ${action} blog post`);
    }
  };

  // Handle package actions
  const handlePackageAction = async (packageId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      const response = await fetch(`${API_URL}/packages/${packageId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`Package ${action}d successfully`);
        fetchPackages();
      } else {
        message.error(`Failed to ${action} package`);
      }
    } catch (error) {
      console.error(`Error ${action}ing package:`, error);
      message.error(`Failed to ${action} package`);
    }
  };

  // Handle support ticket actions
  const handleSupportTicketAction = async (ticketId: string, action: 'resolve' | 'close' | 'delete') => {
    try {
      const response = await fetch(`${API_URL}/support-tickets/${ticketId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`Support ticket ${action}d successfully`);
        fetchSupportTickets();
      } else {
        message.error(`Failed to ${action} support ticket`);
      }
    } catch (error) {
      console.error(`Error ${action}ing support ticket:`, error);
      message.error(`Failed to ${action} support ticket`);
    }
  };

  // Handle frontpage content actions
  const handleFrontpageContentAction = async (contentId: string, action: 'update' | 'delete') => {
    try {
      const response = await fetch(`${API_URL}/frontpage-content/${contentId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`Frontpage content ${action}d successfully`);
        fetchFrontpageContent();
      } else {
        message.error(`Failed to ${action} frontpage content`);
      }
    } catch (error) {
      console.error(`Error ${action}ing frontpage content:`, error);
      message.error(`Failed to ${action} frontpage content`);
    }
  };

  // Handle system config actions
  const handleSystemConfigAction = async (configKey: string, action: 'update' | 'reset') => {
    try {
      const response = await fetch(`${API_URL}/system-config/${configKey}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`System config ${action}d successfully`);
        fetchSystemConfig();
      } else {
        message.error(`Failed to ${action} system config`);
      }
    } catch (error) {
      console.error(`Error ${action}ing system config:`, error);
      message.error(`Failed to ${action} system config`);
    }
  };

  // Handle user actions
  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        message.success(`User ${action}d successfully`);
        fetchUsers();
      } else {
        message.error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      message.error(`Failed to ${action} user`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    onLogout();
  };

  return (
    <div className="super-admin-dashboard" style={{ display: 'flex', height: '100vh' }}>
      <SuperAdminSidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        selectedKey={activeTab}
        onSelect={(key) => {
          if (key === 'logout') {
            handleLogout();
          } else {
            setActiveTab(key);
          }
        }}
      />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        background: '#f5f5f5',
        overflow: 'hidden'
      }}>
        <div style={{ 
          background: '#fff', 
          padding: '16px 24px', 
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#142c47' }}>
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'accounts' && 'Account Management'}
            {activeTab === 'calls' && 'Call Management'}
            {activeTab === 'agents' && 'Agent Management'}
            {activeTab === 'content' && 'Content Management'}
            {activeTab === 'packages' && 'Package Management'}
            {activeTab === 'support' && 'Customer Care'}
            {activeTab === 'analytics' && 'Advanced Analytics'}
            {activeTab === 'system' && 'System Management'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'api' && 'API Management'}
            {activeTab === 'pending' && 'Pending Registrations'}
            {activeTab === 'contact' && 'Contact Messages'}
            {activeTab === 'health' && 'System Health'}
            {activeTab === 'settings' && 'Settings'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="primary" onClick={handleLogout} icon={<LogoutOutlined />}>
              Logout
            </Button>
          </div>
        </div>
        
        <div style={{ 
          flex: 1, 
          padding: 24, 
          overflow: 'auto',
          background: '#f5f5f5'
        }}>
          {activeTab === 'overview' && <OverviewTab onCreateCompany={() => setCompanyCreationModalVisible(true)} />}
          {activeTab === 'accounts' && <AccountManagementTab onCreateCompany={() => setCompanyCreationModalVisible(true)} />}
          {activeTab === 'calls' && <CallManagementTab />}
          {activeTab === 'agents' && <AgentManagementTab />}
          {activeTab === 'content' && <ContentManagementTab />}
          {activeTab === 'packages' && <PackageManagementTab />}
          {activeTab === 'support' && <SupportTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'system' && <SystemTab />}
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'api' && <ApiManagementTab />}
          {activeTab === 'pending' && <PendingRegistrationsTab onCreateCompany={() => setCompanyCreationModalVisible(true)} />}
          {activeTab === 'contact' && <ContactMessagesTab />}
          {activeTab === 'health' && <SystemHealthTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>

      {/* Company Creation Modal */}
      <CompanyCreationModal
        visible={companyCreationModalVisible}
        onCancel={() => setCompanyCreationModalVisible(false)}
        onSuccess={() => {
          // Refresh data after company creation
          fetchPendingRegistrations();
          fetchAccounts();
        }}
      />
    </div>
  );
}