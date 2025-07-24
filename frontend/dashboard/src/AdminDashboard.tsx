import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, Row, Col, Empty, Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Tabs, Spin, Upload, Tooltip, Switch as AntSwitch, Select as AntSelect, Slider } from 'antd';
import { Line } from 'react-chartjs-2'; // For analytics chart stub
import { BellOutlined, ReloadOutlined, StopOutlined, BarChartOutlined, TeamOutlined, UserOutlined, PhoneOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, InboxOutlined, PlayCircleOutlined, PauseCircleOutlined, AudioOutlined, UserSwitchOutlined, BranchesOutlined, FileTextOutlined, PoweroffOutlined, PlusCircleOutlined, DownloadOutlined, CopyOutlined, CheckCircleOutlined, InfoCircleOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons'; // For notifications and controls
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend
} from 'chart.js';
import { io } from 'socket.io-client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend
);

const API_URL = 'http://localhost:5000/api/widget';

const roleOptions = [
  { label: 'Agent', value: 'agent' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Admin', value: 'admin' },
];

export default function AdminDashboard({ adminToken, companyUuid, tabSwitcher, activeTab = 'analytics', onTabChange }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();
  const [callLogs, setCallLogs] = useState([]);
  const [callLoading, setCallLoading] = useState(false);
  const [callSearch, setCallSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

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
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testCallLoading, setTestCallLoading] = useState(false);
  const [testCallResult, setTestCallResult] = useState(null);
  const [testCallWarning, setTestCallWarning] = useState(false);

  const [resetModal, setResetModal] = useState(false);
  const [resetAgent, setResetAgent] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('agent');
  const [editLoading, setEditLoading] = useState(false);

  // IVR state (extended)
  const [ivrSteps, setIvrSteps] = useState([
    { key: 1, digit: '1', label: 'Sales', action: 'Forward to Sales Agent', type: 'route' },
    { key: 2, digit: '2', label: 'Support', action: 'Forward to Support Agent', type: 'route' },
  ]);
  const [editingStep, setEditingStep] = useState(null);
  const [newStep, setNewStep] = useState({ digit: '', label: '', action: '', type: 'route' });
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [ttsVoice, setTtsVoice] = useState('female');
  const [musicOnHold, setMusicOnHold] = useState(false);
  const [timeout, setTimeout] = useState(8);
  const [fallback, setFallback] = useState('loop');
  const [language, setLanguage] = useState('en');
  const [dtmfType, setDtmfType] = useState('RFC2833');
  const [keypressDelay, setKeypressDelay] = useState(0.2);
  const [allowVoiceInput, setAllowVoiceInput] = useState(false);
  const [publishStatus, setPublishStatus] = useState('Draft');
  // Audio upload handlers
  const handleAudioUpload = info => {
    if (info.file.status === 'done' || info.file.status === 'uploading') {
      const url = URL.createObjectURL(info.file.originFileObj);
      setAudioFile(info.file.originFileObj);
      setAudioUrl(url);
      message.success('Audio uploaded!');
    }
  };
  // TTS preview (stub)
  const handleTtsPreview = () => message.info('TTS preview (stub)');
  // Add IVR step
  const handleAddIvrStep = () => {
    if (!newStep.digit || !newStep.label || !newStep.action) return;
    setIvrSteps([...ivrSteps, { ...newStep, key: Date.now() }]);
    setNewStep({ digit: '', label: '', action: '', type: 'route' });
  };
  // IVR handlers
  const handleEditIvrStep = (step) => setEditingStep(step);
  const handleSaveEditIvrStep = () => {
    setIvrSteps(ivrSteps.map(s => s.key === editingStep.key ? editingStep : s));
    setEditingStep(null);
  };
  const handleDeleteIvrStep = (key) => setIvrSteps(ivrSteps.filter(s => s.key !== key));

  const socketRef = useRef(null);
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Test Widget click handler
  const handleTestWidgetClick = async () => {
    // Check if any agent is online
    if (!agents || agents.filter(a => a.online).length === 0) {
      setTestCallWarning(true);
      return;
    }
    setTestCallLoading(true);
    setTestCallResult(null);
    console.log('Test call: emitting to backend...');
    socketRef.current.emit('test-call-request', { uuid: companyUuid });
    socketRef.current.once('test-call-result', (result) => {
      console.log('Test call result:', result);
      setTestCallLoading(false);
      setTestCallResult(result);
      if (result.success) {
        message.success('Test call sent to agent!');
      } else {
        message.error(result.reason || 'Test call failed');
      }
    });
  };

  const handleCloseTestModal = () => {
    setTestModalOpen(false);
    setTestCallLoading(false); // Reset loading state
    setTestCallResult(null); // Clear result
  };

  // Open Test Modal and reset state
  const openTestModal = () => {
    setTestCallLoading(false);
    setTestCallResult(null);
    setTestModalOpen(true);
  };

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

  // Determine widget base URL dynamically
  const getWidgetBaseUrl = () => {
    // Use env variable if set (for Vercel/production)
    if (import.meta && import.meta.env && import.meta.env.VITE_WIDGET_BASE_URL) {
      return import.meta.env.VITE_WIDGET_BASE_URL;
    }
    // Use window.location.origin for local/dev
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    // Fallback to production domain
    return 'https://calldocker.com';
  };

  // Generate widget script with customization and dynamic base URL
  const script = `<script src=\"${getWidgetBaseUrl()}/widget.js?uuid=${companyUuid || 'YOUR_COMPANY_UUID'}&text=${encodeURIComponent(widgetText)}&color=${encodeURIComponent(widgetColor)}&shape=${widgetShape}${widgetImage ? `&img=${encodeURIComponent(widgetImageUrl)}` : ''}&position=${widgetPosition}&animation=${widgetAnimation}&dark=${widgetDarkMode ? '1' : '0'}\"></script>`;

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
      setAuditLog(log => [{ time: new Date().toLocaleString(), action: `Agent ${values.username} added` }, ...log]);
    } catch (err) {
      message.error(err.message);
    }
  };

  // Remove agent
  const handleRemove = async (username) => {
    await fetch(`${API_URL}/agent/${companyUuid}/${username}`, { method: 'DELETE' });
    fetchAgents();
    setAuditLog(log => [{ time: new Date().toLocaleString(), action: `Agent ${username} removed` }, ...log]);
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

  // Reset password handler
  const handleResetPassword = async () => {
    if (!resetAgent || !resetPassword) return;
    setResetLoading(true);
    try {
      const res = await fetch(`${API_URL}/agent/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: adminToken, companyUuid, agentUsername: resetAgent.username, newPassword: resetPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      message.success('Password reset!');
      setResetModal(false);
      setResetPassword('');
      setResetAgent(null);
    } catch (err) {
      message.error(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  // Deactivate/reactivate agent
  const handleToggleActive = async (agent) => {
    await handleUpdate(agent.username, agent.role, !agent.active);
    message.success(agent.active ? 'Agent deactivated' : 'Agent reactivated');
  };

  // Edit agent handler
  const handleEditAgent = (agent) => {
    setEditAgent(agent);
    setEditUsername(agent.username);
    setEditRole(agent.role);
    setEditModal(true);
  };
  const handleSaveEdit = async () => {
    if (!editAgent) return;
    setEditLoading(true);
    try {
      await handleUpdate(editAgent.username, editRole, editAgent.active);
      // If username changed, remove old and add new (simulate, since backend may not support username change directly)
      if (editUsername !== editAgent.username) {
        await handleRemove(editAgent.username);
        await handleAdd({ username: editUsername, password: 'changeme123' }); // Set a temp password
        message.info('Username changed. Temp password: changeme123');
      }
      setEditModal(false);
      setEditAgent(null);
      setEditUsername('');
      setEditRole('agent');
      fetchAgents();
      message.success('Agent updated!');
    } catch (err) {
      message.error('Failed to update agent');
    } finally {
      setEditLoading(false);
    }
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
          <Button icon={<ReloadOutlined />} size="small" style={{ marginLeft: 8 }} onClick={() => { setResetAgent(record); setResetModal(true); }}>Reset Password</Button>
          <Button icon={<StopOutlined />} size="small" style={{ marginLeft: 8 }} onClick={() => handleToggleActive(record)}>{record.active ? 'Deactivate' : 'Reactivate'}</Button>
          <Button size="small" style={{ marginLeft: 8 }} onClick={() => handleEditAgent(record)}>Edit</Button>
        </span>
      )
    }
  ];

  // Bulk actions
  const handleBulkRemove = async () => {
    if (selectedRowKeys.length === 0) return;
    for (const username of selectedRowKeys) {
      await handleRemove(username);
    }
    setSelectedRowKeys([]);
    message.success('Selected agents removed');
  };
  const handleBulkActivate = async () => {
    if (selectedRowKeys.length === 0) return;
    for (const username of selectedRowKeys) {
      const agent = agents.find(a => a.username === username);
      if (agent && !agent.active) await handleUpdate(agent.username, agent.role, true);
    }
    setSelectedRowKeys([]);
    message.success('Selected agents activated');
  };
  const handleBulkDeactivate = async () => {
    if (selectedRowKeys.length === 0) return;
    for (const username of selectedRowKeys) {
      const agent = agents.find(a => a.username === username);
      if (agent && agent.active) await handleUpdate(agent.username, agent.role, false);
    }
    setSelectedRowKeys([]);
    message.success('Selected agents deactivated');
  };

  // Invite agent by email (stub)
  const handleInviteAgent = (email) => {
    if (!email || !email.includes('@')) {
      message.error('Please enter a valid email address');
      return;
    }
    message.success(`Invitation sent to ${email} (stub)`);
  };

  // Add New Action modal (stub)
  const [showAddAction, setShowAddAction] = useState(false);
  const [showEmbedHelp, setShowEmbedHelp] = useState(false);

  const [ivrSaving, setIvrSaving] = useState(false);

  function exportCallLogsToCSV() {
    if (!callLogs || callLogs.length === 0) return;
    const headers = Object.keys(callLogs[0]);
    const rows = callLogs.map(log => headers.map(h => JSON.stringify(log[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call_logs_${companyUuid}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    message.success('Call logs exported as CSV!');
  }

  const [auditLog, setAuditLog] = useState([
    { time: new Date().toLocaleString(), action: 'Admin dashboard loaded' }
  ]);

  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState('');

  return (
    <DashboardLayout>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        style={{ background: '#fff', borderRadius: 8, padding: 16 }}
      >
        <Tabs.TabPane tab="Dashboard Overview" key="dashboard">
          {/* Place stats cards grid here so it only shows on Dashboard tab */}
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
          <Card>Welcome to the Admin Dashboard. Select a section from the sidebar.</Card>
        </Tabs.TabPane>
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
            <Table
              columns={columns}
              dataSource={agents}
              rowKey="username"
              loading={loading}
              pagination={false}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
            />
          </Card>
          <Modal open={addModal} onCancel={() => setAddModal(false)} title="Add Agent" onOk={() => form.submit()} okText="Add">
            <Form form={form} layout="vertical" onFinish={handleAdd}>
              <Form.Item name="username" label="Username" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true }]}><Input.Password /></Form.Item>
            </Form>
          </Modal>
          <Modal open={resetModal} onCancel={() => { setResetModal(false); setResetPassword(''); setResetAgent(null); }} title={`Reset Password for ${resetAgent?.username || ''}`} onOk={handleResetPassword} okText="Reset" confirmLoading={resetLoading}>
            <Input.Password value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="New Password" />
          </Modal>
          <Modal open={editModal} onCancel={() => { setEditModal(false); setEditAgent(null); setEditUsername(''); setEditRole('agent'); }} title={`Edit Agent ${editAgent?.username || ''}`} onOk={handleSaveEdit} okText="Save" confirmLoading={editLoading}>
            <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Username" style={{ marginBottom: 12 }} />
            <Select value={editRole} onChange={setEditRole} style={{ width: '100%' }}>
              {roleOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Modal>
          <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
            <Col xs={24} md={12}>
              <Card title="Invite Agent by Email">
                <Input.Search placeholder="Enter agent email..." enterButton="Send Invite" onSearch={handleInviteAgent} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Export/Download Call Logs">
                {/* TODO: Implement export/download functionality */}
                <Button type="primary" onClick={exportCallLogsToCSV}>Export as CSV</Button>
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
            <Col xs={24} md={12}>
              <Card title="Bulk Actions for Agents">
                <Button danger style={{ marginRight: 8 }} onClick={handleBulkRemove} disabled={selectedRowKeys.length === 0}>Remove Selected</Button>
                <Button style={{ marginRight: 8 }} onClick={handleBulkActivate} disabled={selectedRowKeys.length === 0}>Activate Selected</Button>
                <Button onClick={handleBulkDeactivate} disabled={selectedRowKeys.length === 0}>Deactivate Selected</Button>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Call Logs" key="calls">
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
        <Tabs.TabPane tab="Real-time Monitoring" key="monitoring">
          <Card title="Real-time Monitoring (Stub)">Live call/agent monitoring coming soon.</Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Tag/Disposition Mgmt" key="tags">
          <Card title="Tag/Disposition Management (Stub)">Manage call tags and dispositions here (coming soon).</Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Routing Rules / IVR" key="routing">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'flex-start', marginBottom: 32 }}>
            {/* Welcome & Waiting Audio Section */}
            <Card title={<span><AudioOutlined /> Welcome & Waiting Audio</span>} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <Upload.Dragger
                name="audio"
                accept="audio/*"
                showUploadList={false}
                customRequest={({ file, onSuccess }) => { setTimeout(() => { onSuccess('ok'); }, 500); }}
                onChange={handleAudioUpload}
                style={{ marginBottom: 16 }}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">Click or drag audio file to upload (MP3/WAV)</p>
                {audioUrl && <audio src={audioUrl} controls style={{ width: '100%', marginTop: 8 }} />}
              </Upload.Dragger>
              <div style={{ margin: '16px 0' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Text-to-Speech (TTS)</div>
                <Input.TextArea rows={2} value={ttsText} onChange={e => setTtsText(e.target.value)} placeholder="Paste welcome message for TTS..." style={{ marginBottom: 8 }} />
                <AntSelect value={ttsVoice} onChange={setTtsVoice} style={{ width: 140, marginRight: 8 }}>
                  <AntSelect.Option value="female">Female (US)</AntSelect.Option>
                  <AntSelect.Option value="male">Male (US)</AntSelect.Option>
                  <AntSelect.Option value="uk">Female (UK)</AntSelect.Option>
                </AntSelect>
                <Button icon={<PlayCircleOutlined />} onClick={handleTtsPreview}>Preview</Button>
                <Button icon={<DownloadOutlined />} style={{ marginLeft: 8 }}>Download</Button>
              </div>
              <div style={{ margin: '16px 0' }}>
                <AntSwitch checked={musicOnHold} onChange={setMusicOnHold} /> <span style={{ marginLeft: 8 }}>Play background music while on hold</span>
              </div>
            </Card>
            {/* IVR Settings Panel */}
            <Card title={<span><SettingOutlined /> IVR Settings</span>} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Timeout Duration (sec):</span>
                <Slider min={2} max={30} step={1} value={timeout} onChange={setTimeout} style={{ width: 180, marginLeft: 16 }} />
                <span style={{ marginLeft: 12 }}>{timeout}s</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Fallback Action:</span>
                <AntSelect value={fallback} onChange={setFallback} style={{ width: 160, marginLeft: 16 }}>
                  <AntSelect.Option value="loop">Loop</AntSelect.Option>
                  <AntSelect.Option value="disconnect">Disconnect</AntSelect.Option>
                  <AntSelect.Option value="transfer">Transfer</AntSelect.Option>
                </AntSelect>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Default Language:</span>
                <AntSelect value={language} onChange={setLanguage} style={{ width: 120, marginLeft: 16 }}>
                  <AntSelect.Option value="en">English</AntSelect.Option>
                  <AntSelect.Option value="es">Spanish</AntSelect.Option>
                  <AntSelect.Option value="fr">French</AntSelect.Option>
                </AntSelect>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>DTMF Tone Type:</span>
                <AntSelect value={dtmfType} onChange={setDtmfType} style={{ width: 140, marginLeft: 16 }}>
                  <AntSelect.Option value="RFC2833">RFC2833</AntSelect.Option>
                  <AntSelect.Option value="SIP INFO">SIP INFO</AntSelect.Option>
                </AntSelect>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Keypress Delay:</span>
                <Slider min={0.1} max={2} step={0.1} value={keypressDelay} onChange={setKeypressDelay} style={{ width: 120, marginLeft: 16 }} />
                <span style={{ marginLeft: 12 }}>{keypressDelay}s</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <AntSwitch checked={allowVoiceInput} onChange={setAllowVoiceInput} /> <span style={{ marginLeft: 8 }}>Allow voice input</span>
              </div>
            </Card>
          </div>
          {/* Routing Rule Builder */}
          <Card title={<span><BranchesOutlined /> Routing Rule Builder</span>} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 32 }} extra={<Button icon={<PlusCircleOutlined />} onClick={() => setShowAddAction(true)}>Add New Action</Button>}>
            <Table
              dataSource={ivrSteps}
              columns={[
                { title: 'Digit', dataIndex: 'digit', key: 'digit', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
                { title: 'Label', dataIndex: 'label', key: 'label', render: (v) => <span style={{ color: '#2E73FF' }}>{v}</span> },
                { title: 'Action', dataIndex: 'action', key: 'action', render: (v, r) => <span><UserSwitchOutlined /> {v}</span> },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <span>
                      <Tooltip title="Edit"><Button icon={<EditOutlined />} size="small" style={{ marginRight: 8 }} onClick={() => handleEditIvrStep(record)} /></Tooltip>
                      <Tooltip title="Delete"><Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDeleteIvrStep(record.key)} /></Tooltip>
                      <Tooltip title="Duplicate"><Button icon={<CopyOutlined />} size="small" style={{ marginLeft: 8 }} onClick={() => setIvrSteps([...ivrSteps, { ...record, key: Date.now() }])} /></Tooltip>
                    </span>
                  )
                }
              ]}
              rowKey="key"
              pagination={false}
              style={{ borderRadius: 8 }}
            />
            {editingStep && (
              <Modal open={!!editingStep} title="Edit IVR Step" onOk={handleSaveEditIvrStep} onCancel={() => setEditingStep(null)} okText="Save">
                <Input style={{ marginBottom: 8 }} placeholder="Digit" value={editingStep.digit} onChange={e => setEditingStep({ ...editingStep, digit: e.target.value })} maxLength={1} />
                <Input style={{ marginBottom: 8 }} placeholder="Label" value={editingStep.label} onChange={e => setEditingStep({ ...editingStep, label: e.target.value })} />
                <Input placeholder="Action" value={editingStep.action} onChange={e => setEditingStep({ ...editingStep, action: e.target.value })} />
              </Modal>
            )}
            <Modal open={showAddAction} title="Add New IVR Action" onOk={() => setShowAddAction(false)} onCancel={() => setShowAddAction(false)} okText="Add">
              <div style={{ marginBottom: 8 }}><b>Choose an action template:</b></div>
              <Button block style={{ marginBottom: 8 }} icon={<UserSwitchOutlined />}>Route to Agent/Group</Button>
              <Button block style={{ marginBottom: 8 }} icon={<FileTextOutlined />}>Play Voice Prompt</Button>
              <Button block style={{ marginBottom: 8 }} icon={<PoweroffOutlined />}>End Call</Button>
              <Button block style={{ marginBottom: 8 }} icon={<BranchesOutlined />}>Webhook/External Action</Button>
            </Modal>
          </Card>
          {/* Save, Test, Deploy Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginBottom: 24 }}>
            <Button type="primary" icon={<SaveOutlined />} size="large" style={{ borderRadius: 8 }} onClick={async () => {
              setIvrSaving(true);
              try {
                const res = await fetch(`http://localhost:5000/api/widget/ivr/${companyUuid}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                  },
                  body: JSON.stringify({ steps: ivrSteps })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to save IVR');
                message.success('IVR config saved!');
                setPublishStatus('Live');
                setAuditLog(log => [{ time: new Date().toLocaleString(), action: 'IVR config saved' }, ...log]);
              } catch (err) {
                message.error(err.message);
              } finally {
                setIvrSaving(false);
              }
            }} loading={ivrSaving}>Save IVR</Button>
            <Button icon={<PlayCircleOutlined />} size="large" style={{ borderRadius: 8 }}>Test It Live</Button>
            <Tooltip title="Download IVR Config"><Button icon={<DownloadOutlined />} size="large" style={{ borderRadius: 8 }} /></Tooltip>
            <Tooltip title="Clone from Template"><Button icon={<CopyOutlined />} size="large" style={{ borderRadius: 8 }} /></Tooltip>
            <span style={{ fontWeight: 600, color: publishStatus === 'Live' ? '#1CC88A' : '#F6C23E', marginLeft: 16 }}>
              <CheckCircleOutlined style={{ marginRight: 4 }} /> {publishStatus}
            </span>
            <Tooltip title="Recent changes"><InfoCircleOutlined style={{ fontSize: 20, color: '#888', marginLeft: 8, cursor: 'pointer' }} /></Tooltip>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Integrations" key="integrations">
          {/* Integration management */}
          <Card title="Integration Management">
            <div style={{ marginBottom: 16 }}>
              <Input
                placeholder="Webhook URL (e.g. https://yourapp.com/webhook)"
                value={newWebhook}
                onChange={e => setNewWebhook(e.target.value)}
                style={{ width: 320, marginRight: 8 }}
              />
              <Button type="primary" onClick={() => {
                if (!newWebhook.startsWith('http')) {
                  message.error('Please enter a valid URL');
                  return;
                }
                setWebhooks(list => [newWebhook, ...list]);
                setNewWebhook('');
                message.success('Webhook added!');
              }}>Add Integration</Button>
            </div>
            <ul>
              {webhooks.length === 0 && <li style={{ color: '#888' }}>(No integrations yet)</li>}
              {webhooks.map((url, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'monospace', color: '#2E73FF' }}>{url}</span>
                  <Button danger size="small" style={{ marginLeft: 8 }} onClick={() => setWebhooks(list => list.filter((w, idx) => idx !== i))}>Remove</Button>
                </li>
              ))}
            </ul>
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Settings" key="settings">
          {/* Company profile, widget embed/customization */}
          <Card title="Company Profile / Settings">
            {/* Company Profile Section */}
            <div style={{ marginBottom: 24 }}>
              <h4>Company Profile</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Company UUID:</span>
                <Input value={companyUuid} readOnly style={{ width: 320, fontFamily: 'monospace' }} />
                <Button onClick={() => { navigator.clipboard.writeText(companyUuid); message.success('UUID copied!'); }}>Copy</Button>
              </div>
              <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Company Name:</span> <span style={{ color: '#888' }}>[Not set]</span></div>
              <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Email:</span> <span style={{ color: '#888' }}>[Not set]</span></div>
              <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Other Details:</span> <span style={{ color: '#888' }}>[Not set]</span></div>
            </div>
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
              <Button onClick={openTestModal} style={{ marginLeft: 8, marginTop: 8 }}>Test Widget</Button>
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
            <div style={{ marginTop: 16 }}>
              <strong>Widget Embed Code:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Input value={script.replace(/\\"/g, '"')} readOnly style={{ fontFamily: 'monospace', width: 420, background: '#f7fafd' }} />
                <Button icon={<CopyOutlined />} onClick={handleCopy}>Copy</Button>
                <Tooltip title="How to embed the widget"><Button icon={<QuestionCircleOutlined />} onClick={() => setShowEmbedHelp(true)} /></Tooltip>
              </div>
            </div>
            <Modal open={showEmbedHelp} onCancel={() => setShowEmbedHelp(false)} footer={null} title="How to Embed the Widget?">
              <div style={{ fontSize: 15, lineHeight: 1.7 }}>
                <ol style={{ paddingLeft: 20 }}>
                  <li>Copy the script above using the <b>Copy</b> button.</li>
                  <li>Paste it just before the <code>&lt;/body&gt;</code> tag on your website, or in your site builder's custom code section.</li>
                  <li>The widget will appear on your site with your chosen text, color, shape, and position.</li>
                  <li>You can customize the widget (button text, color, shape, image, position, animation, dark mode) and click <b>Save</b> to update the script.</li>
                  <li>To test the widget, use the <b>Test Widget</b> button below.</li>
                  <li>For advanced integration, see the <b>Integrations</b> tab.</li>
                </ol>
                <div style={{ marginTop: 16, color: '#888' }}>
                  <b>Note:</b> For production, use the script with your real company UUID. For local testing, ensure your widget server is running and accessible.
                </div>
              </div>
            </Modal>
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Audit Log" key="audit">
          {/* Audit log/activity history */}
          <Card title="Audit Log / Activity History">
            <ul>
              {auditLog.map((entry, i) => <li key={i}><b>{entry.time}:</b> {entry.action}</li>)}
            </ul>
          </Card>
        </Tabs.TabPane>
      </Tabs>
      <Modal open={testModalOpen} onCancel={handleCloseTestModal} footer={null} title="Test Widget" width={400}>
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: widgetDarkMode ? '#222' : widgetColor,
              color: widgetDarkMode ? '#fff' : '#fff',
              borderRadius: widgetShape === 'round' ? 24 : 6,
              fontWeight: 600,
              boxShadow: widgetAnimation === 'bounce' ? '0 4px 16px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.10)',
              minWidth: 120,
              border: '1.5px solid #e5e7eb',
              cursor: testCallLoading ? 'not-allowed' : 'pointer',
              opacity: testCallLoading ? 0.6 : 1,
            }}
            onClick={() => {
              if (!testCallLoading) {
                console.log('Widget clicked!');
                handleTestWidgetClick();
              }
            }}
          >
            <img src={widgetImageUrl} alt="Widget Icon" style={{ width: 24, height: 24, marginRight: 8, verticalAlign: 'middle', borderRadius: 4 }} />
            {widgetText}
          </div>
          <div style={{ marginTop: 24 }}>
            {testCallLoading
              ? <span style={{ color: '#2E73FF', fontWeight: 600 }}>Sending test call...</span>
              : testCallResult && testCallResult.success
                ? <span style={{ color: '#2E73FF', fontWeight: 600 }}>Test call sent to agent dashboard!</span>
                : <span>Click the widget to simulate a test call.</span>
            }
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
} 