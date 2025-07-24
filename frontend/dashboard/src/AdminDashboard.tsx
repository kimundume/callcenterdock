import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, Row, Col, Empty, Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Tabs, Spin } from 'antd';
import { Line } from 'react-chartjs-2'; // For analytics chart stub
import { BellOutlined, ReloadOutlined, StopOutlined, BarChartOutlined, TeamOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons'; // For notifications and controls
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = 'http://localhost:5000/api/widget';

const roleOptions = [
  { label: 'Agent', value: 'agent' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Admin', value: 'admin' },
];

export default function AdminDashboard({ adminToken, companyUuid, tabSwitcher }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();
  const [callLogs, setCallLogs] = useState([]);
  const [callLoading, setCallLoading] = useState(false);
  const [callSearch, setCallSearch] = useState('');

  // Widget customization state
  const [widgetText, setWidgetText] = useState('Call Us');
  const [widgetColor, setWidgetColor] = useState('#00e6ef');
  const [widgetShape, setWidgetShape] = useState('round');
  const [widgetImage, setWidgetImage] = useState(null);
  const [widgetImageUrl, setWidgetImageUrl] = useState('https://via.placeholder.com/24');
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetAnimation, setWidgetAnimation] = useState('none');
  const [widgetDarkMode, setWidgetDarkMode] = useState(false);
  const [widgetLoading, setWidgetLoading] = useState(false);

  // Fetch widget settings on mount
  useEffect(() => {
    if (!companyUuid) return;
    setWidgetLoading(true);
    fetch(`${API_URL}/settings/${companyUuid}`)
      .then(res => res.json())
      .then(settings => {
        setWidgetText(settings.text || 'Call Us');
        setWidgetColor(settings.color || '#00e6ef');
        setWidgetShape(settings.shape || 'round');
        setWidgetImageUrl(settings.img || 'https://via.placeholder.com/24');
        setWidgetPosition(settings.position || 'bottom-right');
        setWidgetAnimation(settings.animation || 'none');
        setWidgetDarkMode(!!settings.dark);
      })
      .finally(() => setWidgetLoading(false));
  }, [companyUuid]);

  // Handle image upload (simulate upload, just use local URL)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setWidgetImage(file);
      setWidgetImageUrl(url);
    }
  };

  // Save widget settings to backend
  const handleSaveWidget = async () => {
    setWidgetLoading(true);
    try {
      const res = await fetch(`${API_URL}/settings/${companyUuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: adminToken,
          text: widgetText,
          color: widgetColor,
          shape: widgetShape,
          img: widgetImageUrl,
          position: widgetPosition,
          animation: widgetAnimation,
          dark: widgetDarkMode,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      message.success('Widget settings saved!');
    } catch (err) {
      message.error(err.message);
    } finally {
      setWidgetLoading(false);
    }
  };

  // Generate widget script with customization
  const script = `<script src=\"https://calldocker.com/widget.js?uuid=${companyUuid || 'YOUR_COMPANY_UUID'}&text=${encodeURIComponent(widgetText)}&color=${encodeURIComponent(widgetColor)}&shape=${widgetShape}${widgetImage ? `&img=${encodeURIComponent(widgetImageUrl)}` : ''}&position=${widgetPosition}&animation=${widgetAnimation}&dark=${widgetDarkMode ? '1' : '0'}\"></script>`;

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(script.replace(/\\"/g, '"'));
    message.success('Widget embed code copied!');
  };

  // Fetch agents
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/${companyUuid}`);
      const data = await res.json();
      setAgents(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAgents(); }, [companyUuid]);

  // Add agent
  const handleAdd = async (values) => {
    try {
      const res = await fetch(`${API_URL}/agent/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: adminToken, agentUsername: values.username, agentPassword: values.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add agent');
      message.success('Agent added!');
      setAddModal(false);
      form.resetFields();
      fetchAgents();
    } catch (err) {
      message.error(err.message);
    }
  };

  // Remove agent
  const handleRemove = async (username) => {
    await fetch(`${API_URL}/agent/${companyUuid}/${username}`, { method: 'DELETE' });
    fetchAgents();
  };

  // Update agent role/active
  const handleUpdate = async (username, role, active) => {
    await fetch(`${API_URL}/agent/${companyUuid}/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, active })
    });
    fetchAgents();
  };

  // Fetch call logs
  const fetchCallLogs = async () => {
    setCallLoading(true);
    try {
      const res = await fetch(`${API_URL}/call/logs/${companyUuid}`);
      const data = await res.json();
      setCallLogs(data);
    } finally {
      setCallLoading(false);
    }
  };
  useEffect(() => { fetchCallLogs(); }, [companyUuid]);

  const filteredLogs = callLogs.filter(log =>
    (!callSearch ||
      (log.agent && log.agent.toLowerCase().includes(callSearch.toLowerCase())) ||
      (log.disposition && log.disposition.toLowerCase().includes(callSearch.toLowerCase())) ||
      (log.notes && log.notes.toLowerCase().includes(callSearch.toLowerCase()))
    )
  );

  const callColumns = [
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Agent', dataIndex: 'agent', key: 'agent' },
    { title: 'Duration', dataIndex: 'duration', key: 'duration' },
    { title: 'Disposition', dataIndex: 'disposition', key: 'disposition' },
    { title: 'Tags', dataIndex: 'tags', key: 'tags', render: tags => tags?.map(tag => <span key={tag} style={{ background: '#007bff', color: '#fff', borderRadius: 4, padding: '2px 8px', marginRight: 4 }}>{tag}</span>) },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: notes => <span style={{ whiteSpace: 'pre-wrap' }}>{notes}</span> },
    { title: 'Session ID', dataIndex: 'sessionId', key: 'sessionId' },
  ];

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Role', dataIndex: 'role', key: 'role',
      render: (role, record) => (
        <Select
          value={role}
          options={roleOptions}
          onChange={val => handleUpdate(record.username, val, record.online)}
          style={{ width: 120 }}
        />
      )
    },
    { title: 'Status', dataIndex: 'online', key: 'online',
      render: (online, record) => (
        <Switch
          checked={online}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={val => handleUpdate(record.username, record.role, val)}
        />
      )
    },
    { title: 'Actions', key: 'actions',
      render: (_, record) => (
        <span>
          <Popconfirm title="Remove agent?" onConfirm={() => handleRemove(record.username)}>
            <Button danger size="small">Remove</Button>
          </Popconfirm>
          <Button icon={<ReloadOutlined />} size="small" style={{ marginLeft: 8 }} onClick={() => {/* TODO: Reset password logic */}}>Reset Password</Button>
          <Button icon={<StopOutlined />} size="small" style={{ marginLeft: 8 }} onClick={() => {/* TODO: Deactivate/reactivate logic */}}>{record.online ? 'Deactivate' : 'Reactivate'}</Button>
        </span>
      )
    }
  ];

  return (
    <DashboardLayout>
      {/* Place stats cards grid at the top */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: 24,
        marginBottom: 32,
      }}
      className="metric-card-grid"
      >
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BarChartOutlined style={{ fontSize: 32, color: '#2E73FF' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Total Calls</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>6,750</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <TeamOutlined style={{ fontSize: 32, color: '#00e6ef' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Active Agents</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{agents.filter(a => a.online).length}</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <UserOutlined style={{ fontSize: 32, color: '#1CC88A' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Total Agents</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{agents.length}</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PhoneOutlined style={{ fontSize: 32, color: '#F6C23E' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Total Users</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>5,845</div>
          </div>
        </Card>
      </div>
      <Tabs defaultActiveKey="analytics" style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
        <Tabs.TabPane tab="Analytics" key="analytics">
          {/* Analytics content: chart and notifications */}
          <Row gutter={[24, 24]}>
            <Col xs={24} md={16}><Card title="Call Volume Analytics">
              {/* TODO: Replace with real data */}
              <Line data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                  label: 'Calls',
                  data: [12, 19, 3, 5, 2, 3, 7],
                  backgroundColor: 'rgba(0,123,255,0.2)',
                  borderColor: '#007bff',
                }],
              }} options={{ maintainAspectRatio: false }} height={120} />
            </Card></Col>
            <Col xs={24} md={8}><Card title="Notifications" extra={<BellOutlined />}>
              {/* TODO: Connect to real notifications */}
              <ul style={{ paddingLeft: 16 }}>
                <li>New agent registered (demo)</li>
                <li>Call missed by agent1 (demo)</li>
              </ul>
            </Card></Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Agent Management" key="agents">
          {/* Agent management table, add/invite/bulk actions */}
          <Card title="Agent Management" extra={<Button type="primary" onClick={() => setAddModal(true)}>Add Agent</Button>}>
            <Table columns={columns} dataSource={agents} rowKey="username" loading={loading} pagination={false} />
          </Card>
          <Modal open={addModal} onCancel={() => setAddModal(false)} title="Add Agent" onOk={() => form.submit()} okText="Add">
            <Form form={form} layout="vertical" onFinish={handleAdd}>
              <Form.Item name="username" label="Username" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true }]}><Input.Password /></Form.Item>
            </Form>
          </Modal>
          <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
            <Col xs={24} md={12}>
              <Card title="Invite Agent by Email">
                {/* TODO: Implement agent invitation by email */}
                <Input.Search placeholder="Enter agent email..." enterButton="Send Invite" onSearch={() => { /* TODO */ }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Export/Download Call Logs">
                {/* TODO: Implement export/download functionality */}
                <Button type="primary" onClick={() => { /* TODO */ }}>Export as CSV</Button>
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
            <Col xs={24} md={12}>
              <Card title="Bulk Actions for Agents">
                {/* TODO: Implement bulk actions (remove, activate, deactivate) */}
                <Button danger style={{ marginRight: 8 }} onClick={() => { /* TODO */ }}>Remove Selected</Button>
                <Button style={{ marginRight: 8 }} onClick={() => { /* TODO */ }}>Activate Selected</Button>
                <Button onClick={() => { /* TODO */ }}>Deactivate Selected</Button>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Call Logs" key="logs">
          {/* Call logs table and advanced filtering */}
          <Card title="Call Logs">
            <Input.Search
              placeholder="Search by agent, disposition, or notes"
              value={callSearch}
              onChange={e => setCallSearch(e.target.value)}
              style={{ marginBottom: 16, maxWidth: 320 }}
              allowClear
            />
            <Table columns={callColumns} dataSource={filteredLogs} rowKey={(_, i) => i} loading={callLoading} pagination={{ pageSize: 10 }} />
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Settings" key="settings">
          {/* Company profile, widget embed/customization */}
          <Card title="Company Profile / Settings">
            {/* TODO: Implement company profile/settings management */}
            <Button type="primary" onClick={() => { /* TODO */ }}>Edit Profile</Button>
            <div style={{ marginTop: 24 }}>
              <h4>Embed Widget on Your Website</h4>
              <Input.TextArea
                value={script}
                readOnly
                autoSize
                style={{ fontFamily: 'monospace', marginBottom: 12 }}
              />
              <Button onClick={handleCopy} style={{ marginBottom: 16 }}>Copy to Clipboard</Button>
              <div style={{ marginBottom: 12 }}>
                <strong>Customize Widget:</strong>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Input value={widgetText} onChange={e => setWidgetText(e.target.value)} placeholder="Button Text (e.g., Call Us)" style={{ marginBottom: 8, maxWidth: 180 }} />
                  <Input type="color" value={widgetColor} onChange={e => setWidgetColor(e.target.value)} style={{ width: 40, marginRight: 8 }} />
                  <Select style={{ width: 120, marginRight: 8 }} value={widgetShape} onChange={setWidgetShape}>
                    <Select.Option value="round">Round</Select.Option>
                    <Select.Option value="square">Square</Select.Option>
                  </Select>
                  <Select style={{ width: 140, marginRight: 8 }} value={widgetPosition} onChange={setWidgetPosition}>
                    <Select.Option value="bottom-right">Bottom Right</Select.Option>
                    <Select.Option value="bottom-left">Bottom Left</Select.Option>
                    <Select.Option value="top-right">Top Right</Select.Option>
                    <Select.Option value="top-left">Top Left</Select.Option>
                  </Select>
                  <Select style={{ width: 120, marginRight: 8 }} value={widgetAnimation} onChange={setWidgetAnimation}>
                    <Select.Option value="none">No Animation</Select.Option>
                    <Select.Option value="bounce">Bounce</Select.Option>
                    <Select.Option value="fade">Fade</Select.Option>
                  </Select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                    <Switch checked={widgetDarkMode} onChange={setWidgetDarkMode} /> Dark Mode
                  </label>
                  <Input type="file" accept="image/*" style={{ width: 200 }} onChange={handleImageUpload} />
                </div>
                <Button type="primary" onClick={handleSaveWidget} loading={widgetLoading} style={{ marginTop: 8 }}>Save Settings</Button>
              </div>
              <strong>Live Preview:</strong>
              <div style={{ minHeight: 80, minWidth: 180, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin spinning={widgetLoading}>
                  <div style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: widgetDarkMode ? '#222' : widgetColor,
                    color: widgetDarkMode ? '#fff' : '#fff',
                    borderRadius: widgetShape === 'round' ? 24 : 6,
                    fontWeight: 600,
                    boxShadow: widgetAnimation === 'bounce' ? '0 4px 16px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.10)',
                    minWidth: 120,
                    border: '1.5px solid #e5e7eb',
                    transition: widgetAnimation === 'fade' ? 'opacity 0.6s' : 'none',
                    opacity: widgetAnimation === 'fade' ? 0.7 : 1,
                    position: 'relative',
                  }}>
                    <img src={widgetImageUrl} alt="Widget Icon" style={{ width: 24, height: 24, marginRight: 8, verticalAlign: 'middle', borderRadius: 4 }} />
                    {widgetText}
                    <span style={{
                      position: 'absolute',
                      [widgetPosition.includes('bottom') ? 'bottom' : 'top']: -40,
                      [widgetPosition.includes('right') ? 'right' : 'left']: 0,
                      fontSize: 12,
                      color: '#888',
                      opacity: 0.7,
                    }}>
                      {widgetPosition.replace('-', ' ')}
                    </span>
                  </div>
                </Spin>
              </div>
            </div>
            {tabSwitcher}
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Integrations" key="integrations">
          {/* Integration management */}
          <Card title="Integration Management">
            {/* TODO: Implement integration management (webhooks, CRM, etc.) */}
            <Button onClick={() => { /* TODO */ }}>Add Integration</Button>
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Audit Log" key="audit">
          {/* Audit log/activity history */}
          <Card title="Audit Log / Activity History">
            {/* TODO: Implement audit log/activity history */}
            <ul>
              <li>Agent1 logged in (demo)</li>
              <li>Agent2 removed (demo)</li>
            </ul>
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </DashboardLayout>
  );
} 