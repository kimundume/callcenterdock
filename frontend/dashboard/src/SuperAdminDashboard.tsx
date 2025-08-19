import React, { useState, useEffect } from 'react';
import SystemDiagnostics from './components/SystemDiagnostics';
import { 
  Layout, 
  Menu, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Tag, 
  Space,
  Tabs,
  List,
  Avatar,
  Badge,
  Tooltip,
  Switch,
  InputNumber,
  DatePicker,
  Divider,
  Alert,
  Descriptions,
  Steps,
  Timeline,
  Rate,
  Upload,
  Image,
  Carousel,
  Collapse,
  Tree,
  Transfer,
  Cascader,
  Slider,
  Radio,
  Checkbox,
  TimePicker,
  Calendar,
  Mentions,
  AutoComplete,
  TreeSelect,
  Drawer,
  Popconfirm,
  Skeleton,
  Empty,
  Result,
  Breadcrumb,
  Dropdown,
  notification,
  ConfigProvider,
  theme,
  App
} from 'antd';
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
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  KeyOutlined,
  CrownOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  HeartOutlined,
  LikeOutlined,
  DislikeOutlined,
  MessageOutlined,
  BellOutlined,
  CalendarOutlined,
  HomeOutlined,
  ShopOutlined,
  GiftOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  BulbOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  SecurityScanOutlined,
  LockOutlined,
  UnlockOutlined,
  DatabaseOutlined,
  CloudOutlined,
  ApiOutlined,
  CodeOutlined,
  BugOutlined,
  ToolOutlined,
  BuildOutlined,
  CompassOutlined,
  AimOutlined,
  FlagOutlined,
  TagOutlined
} from '@ant-design/icons';
import { API_ENDPOINTS, getBackendUrl } from './config';
import SuperAdminSidebar from './SuperAdminSidebar';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  PointElement
);

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

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
              icon={<UserOutlined />}
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
      const response = await fetch('${API_ENDPOINTS.WIDGET}/calls/active');
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
      const response = await fetch(`${API_ENDPOINTS.WIDGET}/calls/history?page=${page}&limit=10`);
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
      const response = await fetch('${API_ENDPOINTS.WIDGET}/calls/analytics?period=7d');
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
      const response = await fetch('${API_ENDPOINTS.WIDGET}/agents/online');
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/calls/${callId}/assign`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/calls/${callId}/status`, {
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

  // Hardcoded CallDocker agent that will handle all calls from the landing page
  const hardcodedCallDockerAgent = {
    id: 'calldocker-main-agent',
    username: 'calldocker_agent',
    fullName: 'CallDocker Main Agent',
    email: 'agent@calldocker.com',
    phone: '+1-555-CALL-DOCKER',
    role: 'senior_agent',
    status: 'active',
    skills: ['customer_service', 'technical_support', 'sales', 'enquiry_handling', 'billing'],
    performance: {
      callsHandled: 1250,
      avgRating: 4.9,
      successRate: 98.5
    },
    createdAt: '2024-01-01T00:00:00Z',
    password: 'CallDocker2024!',
    companyUUID: 'calldocker-company-uuid',
    loginCredentials: {
      username: 'calldocker_agent',
      password: 'CallDocker2024!',
      companyUUID: 'calldocker-company-uuid'
    },
    description: 'Main CallDocker agent responsible for handling all incoming calls from the CallDocker landing page. This agent is always available and ready to assist customers.'
  };

  // Mock data for fallback when API fails
  const mockCallDockerAgents = [
    hardcodedCallDockerAgent,
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

  const mockCompanyAgents = [
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
    }
  ];

  // Get backend URL from environment or global variable
  const getBackendUrl = () => {
    return window.ENV?.backendUrl || 'http://localhost:5001';
  };

  // Safe string operations
  const safeCharAt = (str: any, index: number = 0) => {
    return str && typeof str === 'string' && str.charAt ? str.charAt(index) : '?';
  };

  const safeReplace = (str: any, search: string, replace: string) => {
    return str && typeof str === 'string' && str.replace ? str.replace(search, replace) : 'N/A';
  };

  const safeUpperCase = (str: any) => {
    return str && typeof str === 'string' && str.toUpperCase ? str.toUpperCase() : 'N/A';
  };

  // Fetch CallDocker agents with fallback
  const fetchCallDockerAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBackendUrl()}/api/super-admin/agents/status`);
      if (response.ok) {
        const data = await response.json();
        setCallDockerAgents(data.agents || mockCallDockerAgents);
      } else {
        console.log('API failed, using mock data for CallDocker agents');
        setCallDockerAgents(mockCallDockerAgents);
      }
    } catch (error) {
      console.log('Error fetching CallDocker agents, using mock data:', error);
      setCallDockerAgents(mockCallDockerAgents);
    } finally {
      setLoading(false);
    }
  };

  // Fetch company agents with fallback
  const fetchCompanyAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBackendUrl()}/api/super-admin/agents/status`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || mockCompanyAgents);
      } else {
        console.log('API failed, using mock data for company agents');
        setAgents(mockCompanyAgents);
      }
    } catch (error) {
      console.log('Error fetching company agents, using mock data:', error);
      setAgents(mockCompanyAgents);
    } finally {
      setLoading(false);
    }
  };

  // Agent action handlers
  const handleApproveAgent = async (agentId: string) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/super-admin/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agent', id: agentId })
      });
      if (response.ok) {
        message.success('Agent approved successfully');
        fetchCompanyAgents();
      } else {
        message.error('Failed to approve agent');
      }
    } catch (error) {
      console.error('Error approving agent:', error);
      message.error('Error approving agent');
    }
  };

  const handleRejectAgent = async (agentId: string) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/super-admin/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agent', id: agentId })
      });
      if (response.ok) {
        message.success('Agent rejected successfully');
        fetchCompanyAgents();
      } else {
        message.error('Failed to reject agent');
      }
    } catch (error) {
      console.error('Error rejecting agent:', error);
      message.error('Error rejecting agent');
    }
  };

  const handleSuspendAgent = async (agentId: string) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/super-admin/agents/${agentId}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        message.success('Agent suspended successfully');
        fetchCompanyAgents();
      } else {
        message.error('Failed to suspend agent');
      }
    } catch (error) {
      console.error('Error suspending agent:', error);
      message.error('Error suspending agent');
    }
  };

  // Create CallDocker agent with fallback
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
      const response = await fetch(`${getBackendUrl()}/api/super-admin/calldocker-agent/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        message.success('CallDocker agent created successfully!');
        console.log('CallDocker agent created:', data);
        setCallDockerAgentModalVisible(false);
        callDockerAgentForm.resetFields();
        fetchCallDockerAgents(); // Refresh the list
      } else {
        // If API fails, add to mock data for demo purposes
        const newAgent = {
          id: `cd-${Date.now()}`,
          ...formData,
          status: 'active',
          performance: {
            callsHandled: 0,
            avgRating: 0,
            successRate: 0
          },
          createdAt: new Date().toISOString(),
          password: 'default2024!',
          companyUUID: 'calldocker-company-uuid',
          loginCredentials: {
            username: formData.username,
            password: 'default2024!',
            companyUUID: 'calldocker-company-uuid'
          }
        };
        
        setCallDockerAgents(prev => [...prev, newAgent]);
        message.success('CallDocker agent created successfully (demo mode)!');
        setCallDockerAgentModalVisible(false);
        callDockerAgentForm.resetFields();
      }
    } catch (error) {
      console.error('Error creating CallDocker agent:', error);
      message.error('Failed to create CallDocker agent. Please try again.');
    }
  };

  // Suspend CallDocker agent
  const handleSuspendCallDockerAgent = async (agentId: string) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/super-admin/calldocker-agent/${agentId}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        message.success('CallDocker agent suspended successfully');
        fetchCallDockerAgents();
      } else {
        message.error('Failed to suspend CallDocker agent');
      }
    } catch (error) {
      console.error('Error suspending CallDocker agent:', error);
      message.error('Error suspending CallDocker agent');
    }
  };

  // Activate CallDocker agent
  const handleActivateCallDockerAgent = async (agentId: string) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/super-admin/calldocker-agent/${agentId}/activate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        message.success('CallDocker agent activated successfully');
        fetchCallDockerAgents();
      } else {
        message.error('Failed to activate CallDocker agent');
      }
    } catch (error) {
      console.error('Error activating CallDocker agent:', error);
      message.error('Error activating CallDocker agent');
    }
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'pending': return 'processing';
      default: return 'default';
    }
  };

  // Role color helper
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'senior_agent': return 'blue';
      case 'agent': return 'green';
      case 'supervisor': return 'purple';
      default: return 'default';
    }
  };

  // View CallDocker agent credentials
  const handleViewCallDockerAgentCredentials = (agent: any) => {
    if (agent?.loginCredentials) {
      const credentials = agent.loginCredentials;
      Modal.info({
        title: 'CallDocker Agent Login Credentials',
        content: (
          <div>
            <p><strong>Username:</strong> {credentials.username}</p>
            <p><strong>Password:</strong> {credentials.password}</p>
            <p><strong>Company UUID:</strong> {credentials.companyUUID}</p>
            <p><strong>Login URL:</strong> /agent-login</p>
            <Alert
              message="Important"
              description="These credentials can be used to log in as this agent. Keep them secure!"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        ),
        width: 500
      });
    } else {
      message.error('No credentials available for this agent');
    }
  };

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
      const response = await fetch(`${getBackendUrl()}/api/super-admin/calldocker-agent/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAgent)
      });
      if (response.ok) {
        const data = await response.json();
        message.success('Test CallDocker agent created successfully!');
        fetchCallDockerAgents();
      } else {
        // If API fails, add to mock data
        const newTestAgent = {
          id: `cd-test-${Date.now()}`,
          ...testAgent,
          status: 'active',
          performance: {
            callsHandled: 0,
            avgRating: 0,
            successRate: 0
          },
          createdAt: new Date().toISOString(),
          password: 'test2024!',
          companyUUID: 'calldocker-company-uuid',
          loginCredentials: {
            username: testAgent.username,
            password: 'test2024!',
            companyUUID: 'calldocker-company-uuid'
          }
        };
        
        setCallDockerAgents(prev => [...prev, newTestAgent]);
        message.success('Test CallDocker agent created successfully (demo mode)!');
      }
    } catch (error) {
      console.error('Error creating test agent:', error);
      message.error('Failed to create test agent');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCallDockerAgents();
    fetchCompanyAgents();
  }, []);

  // Company agents table columns with safe rendering
  const companyAgentColumns = [
    {
      title: 'Agent',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar style={{ marginRight: 8 }}>
            {safeCharAt(name, 0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name || 'Unknown'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              @{record?.username || 'unknown'}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (companyName: any) => (
        <Tag color="blue">{companyName || 'N/A'}</Tag>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: any) => (
        <div>
          <div>{record?.email || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record?.phone || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: any) => (
        <Tag color={getRoleColor(role)}>
          {safeUpperCase(safeReplace(role, '_', ' '))}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: any) => (
        <Badge 
          status={getStatusColor(status) as any} 
          text={safeUpperCase(safeReplace(status, '_', ' '))} 
        />
      )
    },
    {
      title: 'Skills',
      key: 'skills',
      render: (_: any, record: any) => (
        <div>
          {record?.skills && Array.isArray(record.skills) ? 
            record.skills.map((skill: any) => (
              <Tag key={skill} color="green" style={{ marginBottom: 4 }}>
                {safeReplace(skill, '_', ' ')}
              </Tag>
            )) : 
            <span>No skills</span>
          }
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_: any, record: any) => (
        <div>
          <div>Calls: {record?.performance?.callsHandled || 0}</div>
          <div>Rating: {record?.performance?.avgRating || 0}/5</div>
          <div>Success: {record?.performance?.successRate || 0}%</div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => {
            setSelectedAgent(record);
            setAgentModalVisible(true);
          }}>
            View Details
          </Button>
          {record?.status === 'pending_approval' && (
            <>
              <Button type="link" size="small" onClick={() => handleApproveAgent(record?.id)}>
                Approve
              </Button>
              <Button type="link" size="small" danger onClick={() => handleRejectAgent(record?.id)}>
                Reject
              </Button>
            </>
          )}
          {record?.status === 'active' && (
            <Button type="link" size="small" danger onClick={() => handleSuspendAgent(record?.id)}>
              Suspend
            </Button>
          )}
        </Space>
      )
    }
  ];

  // CallDocker agents table columns with safe rendering
  const callDockerAgentColumns = [
    {
      title: 'Agent',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar style={{ marginRight: 8 }}>{safeCharAt(name, 0)}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name || 'Unknown'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>@{record?.username || 'unknown'}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: any) => (
        <div>
          <div>{record?.email || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record?.phone || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: any) => (
        <Tag color={getRoleColor(role)}>
          {safeUpperCase(safeReplace(role, '_', ' '))}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: any) => (
        <Badge status={getStatusColor(status) as any} text={safeUpperCase(safeReplace(status, '_', ' '))} />
      )
    },
    {
      title: 'Skills',
      key: 'skills',
      render: (_: any, record: any) => (
        <div>
          {record?.skills && Array.isArray(record.skills) ? 
            record.skills.map((skill: any) => (
              <Tag key={skill} color="green" style={{ marginBottom: 4 }}>
                {safeReplace(skill, '_', ' ')}
              </Tag>
            )) : 
            <span>No skills</span>
          }
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_: any, record: any) => (
        <div>
          <div>Calls: {record?.performance?.callsHandled || 0}</div>
          <div>Rating: {record?.performance?.avgRating || 0}/5</div>
          <div>Success: {record?.performance?.successRate || 0}%</div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
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
          {record?.status === 'active' && (
            <Button type="link" size="small" danger onClick={() => handleSuspendCallDockerAgent(record?.id)}>
              Suspend
            </Button>
          )}
          {record?.status === 'suspended' && (
            <Button type="link" size="small" onClick={() => handleActivateCallDockerAgent(record?.id)}>
              Activate
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="agent-management-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card title="CallDocker Agents" extra={
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCallDockerAgentModalVisible(true)}>
                Add CallDocker Agent
              </Button>
              <Button onClick={handleCreateTestCallDockerAgent}>
                Create Test Agent
              </Button>
            </Space>
          }>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic title="Total CallDocker Agents" value={callDockerAgents.length} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Active CallDocker Agents" value={callDockerAgents.filter(a => a.status === 'active').length} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Total Enquiries Handled" value={callDockerAgents.reduce((sum, a) => sum + (a.performance?.callsHandled || 0), 0)} />
              </Col>
            </Row>
            <Table
              columns={callDockerAgentColumns}
              dataSource={callDockerAgents}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12}>
          <Card title="Company Agents" extra={
            <Button type="primary" icon={<PlusOutlined />}>
              Add Company Agent
            </Button>
          }>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic title="Total Company Agents" value={agents.length} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Active Company Agents" value={agents.filter(a => a.status === 'active').length} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Pending Approvals" value={agents.filter(a => a.status === 'pending_approval').length} />
              </Col>
            </Row>
            <Table
              columns={companyAgentColumns}
              dataSource={agents}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* CallDocker Agent Creation Modal */}
      <Modal
        title="Create New CallDocker Agent"
        visible={callDockerAgentModalVisible}
        onCancel={() => { setCallDockerAgentModalVisible(false); callDockerAgentForm.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form
          form={callDockerAgentForm}
          layout="vertical"
          onFinish={handleCreateCallDockerAgent}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="agent">Agent</Option>
                  <Option value="senior_agent">Senior Agent</Option>
                  <Option value="supervisor">Supervisor</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="skills"
                label="Skills"
                rules={[{ required: true, message: 'Please select skills' }]}
              >
                <Select mode="multiple" placeholder="Select skills">
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

      {/* Agent Details Modal */}
      <Modal
        title="Agent Details"
        visible={agentModalVisible}
        onCancel={() => { setAgentModalVisible(false); setSelectedAgent(null); setSelectedCallDockerAgent(null); }}
        footer={[
          <Button key="close" onClick={() => { setAgentModalVisible(false); setSelectedAgent(null); setSelectedCallDockerAgent(null); }}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedAgent && (
          <Descriptions column={2}>
            <Descriptions.Item label="Full Name">{selectedAgent.fullName}</Descriptions.Item>
            <Descriptions.Item label="Username">{selectedAgent.username}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedAgent.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{selectedAgent.phone}</Descriptions.Item>
            <Descriptions.Item label="Company">{selectedAgent.companyName}</Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag color={getRoleColor(selectedAgent.role)}>
                {safeUpperCase(safeReplace(selectedAgent.role, '_', ' '))}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge status={getStatusColor(selectedAgent.status) as any} text={safeUpperCase(safeReplace(selectedAgent.status, '_', ' '))} />
            </Descriptions.Item>
            <Descriptions.Item label="Skills">
              {selectedAgent.skills && Array.isArray(selectedAgent.skills) ? 
                selectedAgent.skills.map((skill: any) => (
                  <Tag key={skill} color="green" style={{ marginBottom: 4 }}>
                    {safeReplace(skill, '_', ' ')}
                  </Tag>
                )) : 
                <span>No skills</span>
              }
            </Descriptions.Item>
            <Descriptions.Item label="Calls Handled">{selectedAgent.performance?.callsHandled || 0}</Descriptions.Item>
            <Descriptions.Item label="Average Rating">{selectedAgent.performance?.avgRating || 0}/5</Descriptions.Item>
            <Descriptions.Item label="Success Rate">{selectedAgent.performance?.successRate || 0}%</Descriptions.Item>
          </Descriptions>
        )}
        
        {selectedCallDockerAgent && (
          <Descriptions column={2}>
            <Descriptions.Item label="Full Name">{selectedCallDockerAgent.fullName}</Descriptions.Item>
            <Descriptions.Item label="Username">{selectedCallDockerAgent.username}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedCallDockerAgent.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{selectedCallDockerAgent.phone}</Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag color={getRoleColor(selectedCallDockerAgent.role)}>
                {safeUpperCase(safeReplace(selectedCallDockerAgent.role, '_', ' '))}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge status={getStatusColor(selectedCallDockerAgent.status) as any} text={safeUpperCase(safeReplace(selectedCallDockerAgent.status, '_', ' '))} />
            </Descriptions.Item>
            <Descriptions.Item label="Skills">
              {selectedCallDockerAgent.skills && Array.isArray(selectedCallDockerAgent.skills) ? 
                selectedCallDockerAgent.skills.map((skill: any) => (
                  <Tag key={skill} color="green" style={{ marginBottom: 4 }}>
                    {safeReplace(skill, '_', ' ')}
                  </Tag>
                )) : 
                <span>No skills</span>
              }
            </Descriptions.Item>
            <Descriptions.Item label="Calls Handled">{selectedCallDockerAgent.performance?.callsHandled || 0}</Descriptions.Item>
            <Descriptions.Item label="Average Rating">{selectedCallDockerAgent.performance?.avgRating || 0}/5</Descriptions.Item>
            <Descriptions.Item label="Success Rate">{selectedCallDockerAgent.performance?.successRate || 0}%</Descriptions.Item>
            {selectedCallDockerAgent.description && (
              <Descriptions.Item label="Description" span={2}>
                {selectedCallDockerAgent.description}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
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
      <SystemDiagnostics />
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/create-company`, {
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
  // Get token from localStorage
  const token = localStorage.getItem('superAdminToken');

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
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
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

  // Fetch accounts data
  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  // Fetch blog posts
  const fetchBlogPosts = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/content/blog-posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    }
  };

  // Fetch packages
  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/packages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  };

  // Fetch support tickets
  const fetchSupportTickets = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/support/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSupportTickets(data);
      }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
    }
  };

  // Fetch frontpage content
  const fetchFrontpageContent = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/content/frontpage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFrontpageContent(data);
      }
    } catch (error) {
      console.error('Failed to fetch frontpage content:', error);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/analytics/advanced`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  // Fetch system config
  const fetchSystemConfig = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/system/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch system config:', error);
    }
  };

  // Fetch API keys
  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  // Fetch pending registrations
  const fetchPendingRegistrations = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/pending-registrations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRegistrations(data);
      }
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Fetch contact messages
  const fetchContactMessages = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/contact-messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setContactMessages(data);
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    }
  };

  const handleAccountAction = async (accountId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/accounts/${accountId}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/contact-messages/${messageId}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/api-keys/${keyId}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/blog-posts/${postId}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/packages/${packageId}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/support-tickets/${ticketId}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/frontpage-content/${contentId}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/system-config/${configKey}/${action}`, {
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
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN}/users/${userId}/${action}`, {
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
