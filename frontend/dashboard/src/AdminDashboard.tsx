import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, Row, Col, Empty, Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Tabs, Spin, Upload, Tooltip, Switch as AntSwitch, Select as AntSelect, Slider, List, Avatar, Badge, Divider, Statistic, Tag, Modal as AntModal, Form as AntForm, Input as AntInput, Space, Tag as AntTag, Dropdown, DatePicker } from 'antd';
import { Line } from 'react-chartjs-2'; // For analytics chart stub
import { BellOutlined, ReloadOutlined, StopOutlined, BarChartOutlined, TeamOutlined, UserOutlined, PhoneOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, InboxOutlined, PlayCircleOutlined, PauseCircleOutlined, AudioOutlined, UserSwitchOutlined, BranchesOutlined, FileTextOutlined, PoweroffOutlined, PlusCircleOutlined, DownloadOutlined, CopyOutlined, CheckCircleOutlined, InfoCircleOutlined, SettingOutlined, QuestionCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, TagOutlined, RadarChartOutlined, MessageOutlined, SearchOutlined, DownloadOutlined as DownloadIcon, MoreOutlined, MailOutlined, PhoneFilled, UploadOutlined, FilterOutlined, ExclamationCircleOutlined } from '@ant-design/icons'; // For notifications and controls
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip as ChartTooltip,
} from 'chart.js';
import { io } from 'socket.io-client';
import logoLight from '/logo-light.png';
import { useLocation, useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  ChartTooltip,
);

const API_URL = 'http://localhost:5001/api/widget';

const roleOptions = [
  { label: 'Agent', value: 'agent' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Admin', value: 'admin' },
];

export default function AdminDashboard({ adminToken, companyUuid, tabSwitcher, activeTab = 'analytics', onTabChange, onLogout }: any) {
  const location = useLocation();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();
  const [callLogs, setCallLogs] = useState([]);
  const [callLoading, setCallLoading] = useState(false);
  const [callSearch, setCallSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [chartError, setChartError] = useState(false);

  // Company info state
  const [companyInfo, setCompanyInfo] = useState(null);
  const [displayNameModal, setDisplayNameModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [displayNameLoading, setDisplayNameLoading] = useState(false);

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
  const [showEmbedHelp, setShowEmbedHelp] = useState(false);

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
  const handleAudioUpload = (info: any) => {
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
  const handleEditIvrStep = (step: any) => setEditingStep(step);
  const handleSaveEditIvrStep = () => {
    if (!editingStep) return;
    setIvrSteps(ivrSteps.map(s => s.key === editingStep.key ? editingStep : s));
    setEditingStep(null);
  };
  const handleDeleteIvrStep = (key: any) => setIvrSteps(ivrSteps.filter((s: any) => s.key !== key));

  const socketRef = useRef(null);
  useEffect(() => {
    socketRef.current = io('http://localhost:5001');
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
    console.log('Test call: sending to backend...');
    
    try {
      const response = await fetch(`${API_URL}/test-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ companyUuid })
      });
      
      const result = await response.json();
      console.log('Test call result:', result);
      setTestCallLoading(false);
      setTestCallResult(result);
      
      if (result.success) {
        message.success(`Test call sent to agent ${result.agent}!`);
      } else {
        message.error(result.reason || 'Test call failed');
      }
    } catch (error) {
      console.error('Error sending test call:', error);
      setTestCallLoading(false);
      setTestCallResult({ success: false, reason: 'Network error' });
      message.error('Failed to send test call. Please try again.');
    }
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
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

  // Generate widget script with enhanced customization and unique routing
  const script = `<script>
(function() {
  // CallDocker Widget Loader - Enhanced for Soft Launch
  window.CallDockerWidget = window.CallDockerWidget || {};
  
  // Widget configuration with unique routing
  var config = {
    uuid: '${companyUuid || 'YOUR_COMPANY_UUID'}',
    uniqueId: '${companyUuid}-${Date.now()}',
    text: '${encodeURIComponent(widgetText)}',
    color: '${encodeURIComponent(widgetColor)}',
    shape: '${widgetShape}',
    position: '${widgetPosition}',
    animation: '${widgetAnimation}',
    dark: ${widgetDarkMode ? 'true' : 'false'},
    image: '${widgetImage ? encodeURIComponent(widgetImageUrl) : ''}',
    // Enhanced routing for soft launch
    routing: {
      type: 'company',
      fallbackToCallDocker: true,
      priority: 'company-first',
      loadBalancing: 'round-robin'
    },
    // Analytics and tracking
    analytics: {
      enabled: true,
      trackPageViews: true,
      trackInteractions: true,
      companyId: '${companyUuid}'
    }
  };
  
  // Create unique widget instance
  var widgetId = 'calldocker-widget-' + config.uniqueId;
  
  // Load widget script
  var script = document.createElement('script');
  script.src = '${getWidgetBaseUrl()}/widget.js';
  script.async = true;
  script.onload = function() {
    if (window.CallDockerWidget.init) {
      window.CallDockerWidget.init(config, widgetId);
    }
  };
  document.head.appendChild(script);
})();
</script>`;

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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ agentUsername: values.username, agentPassword: values.password })
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ companyUuid, agentUsername: resetAgent.username, newPassword: resetPassword })
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

  // Sync tab with URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) {
      onTabChange(tab);
    }
  }, [location.search]);

  // Chat state
  const [chatSessions, setChatSessions] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [chatNotes, setChatNotes] = useState({});
  const [chatTags, setChatTags] = useState({});
  const [chatAssignments, setChatAssignments] = useState({});

  // Chat UI state
  const [activeChat, setActiveChat] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [tagInput, setTagInput] = useState<string[]>([]);
  const [chatSearch, setChatSearch] = useState('');
  const [chatTab, setChatTab] = useState<'chat' | 'notes'>('chat');
  const tagOptions = ['#VIP', '#complaint', '#followup', '#sales', '#support', '#escalated', '#spam', '#other'];

  // Chat assignment handler
  const handleAssignAgent = async (sessionId: string, agent: string) => {
    await fetch(`http://localhost:5001/api/chat-sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedAgent: agent })
    });
    setChatAssignments(prev => ({ ...prev, [sessionId]: agent }));
  };

  // Chat handlers
  const handleAddNote = async () => {
    if (!activeChat || !noteInput.trim()) return;
    const note = { text: noteInput.trim(), author: 'Admin', timestamp: new Date().toISOString() };
    await fetch(`http://localhost:5001/api/chat-notes/${activeChat}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, ...note })
    });
    setChatNotes(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), note],
    }));
    setNoteInput('');
  };

  const handleTagChange = async (newTags: string[]) => {
    if (!activeChat) return;
    await fetch(`http://localhost:5001/api/chat-sessions/${activeChat}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: newTags })
    });
    setChatTags(prev => ({ ...prev, [activeChat]: newTags }));
    setTagInput(newTags);
  };

  // Sync tag input with active chat
  useEffect(() => {
    if (activeChat) {
      setTagInput(chatTags[activeChat] || []);
    }
  }, [activeChat]);

  // Fetch chat sessions on mount
  useEffect(() => {
    fetch(`http://localhost:5001/api/chat-sessions?companyId=${companyId}`)
      .then(res => res.json())
      .then(sessions => {
        setChatSessions(sessions);
        // Initialize other state with session data
        const notes = {};
        const tags = {};
        const assignments = {};
        sessions.forEach(session => {
          notes[session.sessionId] = [];
          tags[session.sessionId] = session.tags || [];
          assignments[session.sessionId] = session.assignedAgent || '';
        });
        setChatNotes(notes);
        setChatTags(tags);
        setChatAssignments(assignments);
      });
  }, []);

  // Mock chat messages (for now - will be replaced with backend later)
  useEffect(() => {
    // Mock chat messages for demo sessions
    const mockMessages = {
      'chat-001': [
        { from: 'visitor', message: 'Hi, I need help with my order', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { from: 'agent', message: 'Hello! I\'d be happy to help. Can you provide your order number?', timestamp: new Date(Date.now() - 3500000).toISOString() },
        { from: 'visitor', message: 'Yes, it\'s #12345', timestamp: new Date(Date.now() - 3400000).toISOString() },
        { from: 'agent', message: 'I can see your order. It\'s currently being processed. Is there a specific issue?', timestamp: new Date(Date.now() - 3300000).toISOString() },
        { from: 'visitor', message: 'I need help with my order', timestamp: new Date(Date.now() - 3200000).toISOString() }
      ],
      'chat-002': [
        { from: 'visitor', message: 'I have a technical issue', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { from: 'agent', message: 'I\'m here to help! What seems to be the problem?', timestamp: new Date(Date.now() - 7100000).toISOString() },
        { from: 'visitor', message: 'Thank you for your help!', timestamp: new Date(Date.now() - 7000000).toISOString() }
      ],
      'chat-003': [
        { from: 'visitor', message: 'What are your pricing plans?', timestamp: new Date(Date.now() - 1800000).toISOString() },
        { from: 'agent', message: 'We have several plans starting at $29/month. Would you like me to send you our pricing guide?', timestamp: new Date(Date.now() - 1700000).toISOString() },
        { from: 'visitor', message: 'Yes, please!', timestamp: new Date(Date.now() - 1600000).toISOString() }
      ]
    };
    setChatMessages(mockMessages);
  }, []);

  // Canned Responses state
  const companyId = 'demo-company-001'; // Hardcoded for dev
  const [cannedResponses, setCannedResponses] = useState([]);
  const [cannedForm, setCannedForm] = useState({ title: '', category: '', message: '' });
  const [showCannedModal, setShowCannedModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);

  // Fetch canned responses function
  const fetchCannedResponses = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/canned-responses?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCannedResponses(data);
      }
    } catch (error) {
      console.error('Error fetching canned responses:', error);
    }
  };

  // Fetch canned responses on mount
  useEffect(() => {
    fetchCannedResponses();
  }, []);

  // Canned Response handlers
  const handleAddCanned = () => {
    setCannedForm({ title: '', category: '', message: '' });
    setEditingResponse(null);
    setShowCannedModal(true);
  };
  const handleEditCanned = (resp) => {
    setCannedForm(resp);
    setEditingResponse(resp._id);
    setShowCannedModal(true);
  };
  const handleDeleteCanned = async (id) => {
    await fetch(`http://localhost:5001/api/canned-responses/${id}`, { method: 'DELETE' });
    setCannedResponses(list => list.filter(r => r._id !== id));
  };
  const handleSaveCanned = async () => {
    if (!cannedForm.title || !cannedForm.message) {
      message.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/canned-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          title: cannedForm.title,
          category: cannedForm.category || 'General',
          message: cannedForm.message
        })
      });

      if (response.ok) {
        message.success(editingResponse ? 'Response updated!' : 'Response added!');
        setShowCannedModal(false);
        setEditingResponse(null);
        setCannedForm({ title: '', category: '', message: '' });
        fetchCannedResponses();
      }
    } catch (error) {
      message.error('Failed to save response');
    }
  };

  // CRM Contacts state
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    tags: []
  });
  const [selectedContact, setSelectedContact] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  
  // Advanced Filtering State
  const [showFilters, setShowFilters] = useState(false);
  const [filterTags, setFilterTags] = useState([]);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDateRange, setFilterDateRange] = useState([]);
  const [filterInteractionType, setFilterInteractionType] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  
  // Contact Segmentation State
  const [showSegments, setShowSegments] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [segmentContacts, setSegmentContacts] = useState({});
  const [segmentStats, setSegmentStats] = useState({});
  
  // Contact Analytics State
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Email Integration State
  // const [showEmail, setShowEmail] = useState(false);
  // const [emailModalVisible, setEmailModalVisible] = useState(false);
  // const [emailForm, setEmailForm] = useState({ subject: '', message: '', template: '', recipients: [] });
  // const [emailTemplates] = useState([
  //   { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to our service!', message: 'Hi {{firstName}},\n\nWelcome to our service! We\'re excited to have you on board.\n\nBest regards,\nThe Team' },
  //   { id: 'followup', name: 'Follow-up Email', subject: 'How are you finding our service?', message: 'Hi {{firstName}},\n\nWe hope you\'re enjoying our service. If you have any questions or feedback, please don\'t hesitate to reach out.\n\nBest regards,\nThe Team' },
  //   { id: 'promotion', name: 'Special Promotion', subject: 'Special offer just for you!', message: 'Hi {{firstName}},\n\nWe have a special promotion running just for our valued customers like you!\n\nBest regards,\nThe Team' }
  // ]);

  // CRM Contact functions
  const fetchContacts = async (search = '') => {
    setContactsLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: 'demo-company-001'
      });
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`http://localhost:5001/api/contacts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      message.error('Failed to fetch contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleContactSearch = (value) => {
    setContactSearch(value);
    fetchContacts(value);
  };

  const handleAddContactNote = async () => {
    if (!selectedContact || !noteContent.trim()) return;

    try {
      const response = await fetch(`http://localhost:5001/api/contacts/${selectedContact._id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'demo-company-001',
          content: noteContent,
          agentId: 'admin'
        })
      });

      if (response.ok) {
        message.success('Note added successfully');
        setNoteContent('');
        setNoteModalVisible(false);
        fetchContacts(contactSearch);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add note');
    }
  };

  const handleUpdateTags = async (contactId, tags) => {
    try {
      // In a real app, this would update the backend
      setContacts(prev => prev.map(contact => 
        contact._id === contactId 
          ? { ...contact, tags, updatedAt: new Date().toISOString() }
          : contact
      ));
      message.success('Tags updated successfully');
    } catch (error) {
      console.error('Error updating tags:', error);
      message.error('Failed to update tags');
    }
  };

  useEffect(() => {
    fetchCannedResponses();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, []);

  // Contact Import/Export Functions
  const exportContactsToCSV = () => {
    try {
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Tags', 'Notes', 'Interactions', 'Created At'];
      const csvData = contacts.map(contact => [
        contact.firstName || '',
        contact.lastName || '',
        contact.email || '',
        contact.phone || '',
        contact.company || '',
        contact.tags.join(', '),
        contact.notes.map(note => note.content).join('; '),
        contact.interactions.length,
        new Date(contact.createdAt).toLocaleDateString()
      ]);
      
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Contacts exported successfully');
    } catch (error) {
      console.error('Error exporting contacts:', error);
      message.error('Failed to export contacts');
    }
  };

  const importContactsFromCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          
          const newContacts = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.replace(/"/g, '').trim());
              const contact = {
                _id: `imported-${Date.now()}-${index}`,
                companyId: 'demo-company-001',
                firstName: values[0] || '',
                lastName: values[1] || '',
                email: values[2] || '',
                phone: values[3] || '',
                company: values[4] || '',
                tags: values[5] ? values[5].split(',').map(t => t.trim()) : [],
                notes: [],
                interactions: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              return contact;
            });
          
          // Add to existing contacts
          setContacts(prev => [...prev, ...newContacts]);
          message.success(`Successfully imported ${newContacts.length} contacts`);
          resolve(newContacts);
        } catch (error) {
          console.error('Error parsing CSV:', error);
          message.error('Failed to parse CSV file');
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (info) => {
    if (info.file.status === 'done') {
      importContactsFromCSV(info.file.originFileObj);
    } else if (info.file.status === 'error') {
      message.error('Failed to upload file');
    }
  };

  // Contact Management Functions
  const handleAddContact = () => {
    setContactForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      tags: []
    });
    setShowContactModal(true);
  };

  const handleSaveContact = async () => {
    try {
      const newContact = {
        _id: `contact-${Date.now()}`,
        companyId: 'demo-company-001',
        ...contactForm,
        notes: [],
        interactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setContacts(prev => [...prev, newContact]);
      setShowContactModal(false);
      message.success('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      message.error('Failed to add contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      setContacts(prev => prev.filter(contact => contact._id !== contactId));
      message.success('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      message.error('Failed to delete contact');
    }
  };

  // Advanced Filtering Functions
  const applyFilters = () => {
    let filtered = [...contacts];

    // Filter by tags
    if (filterTags.length > 0) {
      filtered = filtered.filter(contact => 
        filterTags.some(tag => contact.tags.includes(tag))
      );
    }

    // Filter by company
    if (filterCompany) {
      filtered = filtered.filter(contact => 
        contact.company && contact.company.toLowerCase().includes(filterCompany.toLowerCase())
      );
    }

    // Filter by date range
    if (filterDateRange.length === 2) {
      const [startDate, endDate] = filterDateRange;
      filtered = filtered.filter(contact => {
        const contactDate = new Date(contact.createdAt);
        return contactDate >= startDate && contactDate <= endDate;
      });
    }

    // Filter by interaction type
    if (filterInteractionType) {
      filtered = filtered.filter(contact => 
        contact.interactions.some(interaction => interaction.type === filterInteractionType)
      );
    }

    setFilteredContacts(filtered);
  };

  const clearFilters = () => {
    setFilterTags([]);
    setFilterCompany('');
    setFilterDateRange([]);
    setFilterInteractionType('');
    setFilteredContacts([]);
    setShowFilters(false);
  };

  const getUniqueTags = () => {
    const allTags = contacts.flatMap(contact => contact.tags);
    return [...new Set(allTags)];
  };

  const getUniqueCompanies = () => {
    const companies = contacts.map(contact => contact.company).filter(Boolean);
    return [...new Set(companies)];
  };

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [contacts, filterTags, filterCompany, filterDateRange, filterInteractionType]);

  // Contact Segmentation Functions
  const getContactSegments = () => {
    const segments = {
      premium: {
        name: 'Premium Customers',
        description: 'High-value customers with frequent interactions',
        color: '#52c41a',
        icon: '⭐'
      },
      support: {
        name: 'Support Seekers',
        description: 'Customers who frequently request support',
        color: '#1890ff',
        icon: '🆘'
      },
      prospects: {
        name: 'Sales Prospects',
        description: 'New contacts with potential for sales',
        color: '#faad14',
        icon: '🎯'
      },
      inactive: {
        name: 'Inactive Contacts',
        description: 'Contacts with no recent interactions',
        color: '#d9d9d9',
        icon: '⏸️'
      },
      enterprise: {
        name: 'Enterprise',
        description: 'Large company contacts',
        color: '#722ed1',
        icon: '🏢'
      }
    };

    return segments;
  };

  const categorizeContact = (contact) => {
    const interactionCount = contact.interactions.length;
    const lastInteraction = contact.interactions.length > 0 
      ? new Date(contact.interactions[contact.interactions.length - 1].timestamp)
      : null;
    const daysSinceLastInteraction = lastInteraction 
      ? Math.floor((new Date() - lastInteraction) / (1000 * 60 * 60 * 24))
      : Infinity;
    const hasPremiumTag = contact.tags.includes('premium') || contact.tags.includes('enterprise');
    const isLargeCompany = contact.company && contact.company.toLowerCase().includes('corp') || 
                          contact.company && contact.company.toLowerCase().includes('inc') ||
                          contact.company && contact.company.toLowerCase().includes('ltd');

    // Enterprise customers
    if (isLargeCompany || hasPremiumTag) {
      return 'enterprise';
    }
    
    // Premium customers (high interaction, recent activity)
    if (interactionCount >= 3 && daysSinceLastInteraction <= 30) {
      return 'premium';
    }
    
    // Support seekers (frequent support interactions)
    if (interactionCount >= 2 && contact.tags.includes('support')) {
      return 'support';
    }
    
    // Sales prospects (new contacts, low interaction)
    if (interactionCount <= 1 && daysSinceLastInteraction <= 90) {
      return 'prospects';
    }
    
    // Inactive contacts
    if (daysSinceLastInteraction > 90 || interactionCount === 0) {
      return 'inactive';
    }
    
    // Default to prospects
    return 'prospects';
  };

  const applySegmentation = () => {
    const segments = getContactSegments();
    const segmentData = {};
    const stats = {};

    // Initialize segment data
    Object.keys(segments).forEach(segmentKey => {
      segmentData[segmentKey] = [];
      stats[segmentKey] = 0;
    });

    // Categorize contacts
    const contactsToProcess = filteredContacts.length > 0 ? filteredContacts : contacts;
    contactsToProcess.forEach(contact => {
      const segment = categorizeContact(contact);
      segmentData[segment].push(contact);
      stats[segment]++;
    });

    setSegmentContacts(segmentData);
    setSegmentStats(stats);
  };

  const getContactsBySegment = (segment) => {
    if (segment === 'all') {
      return filteredContacts.length > 0 ? filteredContacts : contacts;
    }
    return segmentContacts[segment] || [];
  };

  // Apply segmentation whenever contacts or filters change
  useEffect(() => {
    applySegmentation();
  }, [contacts, filteredContacts]);

  // Contact Analytics Functions
  const calculateAnalytics = () => {
    const contactsToAnalyze = getContactsBySegment(selectedSegment);
    
    // Interaction patterns
    const interactionTypes = {};
    const monthlyInteractions = {};
    const engagementScores = [];
    
    contactsToAnalyze.forEach(contact => {
      contact.interactions.forEach(interaction => {
        // Count interaction types
        interactionTypes[interaction.type] = (interactionTypes[interaction.type] || 0) + 1;
        
        // Monthly interaction trends
        const month = new Date(interaction.timestamp).toISOString().slice(0, 7);
        monthlyInteractions[month] = (monthlyInteractions[month] || 0) + 1;
      });
      
      // Calculate engagement score (0-100)
      const interactionCount = contact.interactions.length;
      const lastInteraction = contact.interactions.length > 0 
        ? new Date(contact.interactions[contact.interactions.length - 1].timestamp)
        : null;
      const daysSinceLastInteraction = lastInteraction 
        ? Math.floor((new Date() - lastInteraction) / (1000 * 60 * 60 * 24))
        : 365;
      
      let score = Math.min(interactionCount * 10, 50); // Base score from interactions
      if (daysSinceLastInteraction <= 7) score += 30;
      else if (daysSinceLastInteraction <= 30) score += 20;
      else if (daysSinceLastInteraction <= 90) score += 10;
      
      engagementScores.push(score);
    });
    
    // Calculate averages
    const avgEngagement = engagementScores.length > 0 
      ? Math.round(engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length)
      : 0;
    
    // Top performing contacts
    const topContacts = contactsToAnalyze
      .map(contact => ({
        ...contact,
        engagementScore: engagementScores[contactsToAnalyze.indexOf(contact)] || 0
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5);
    
    // Company distribution
    const companyDistribution = {};
    contactsToAnalyze.forEach(contact => {
      const company = contact.company || 'Unknown';
      companyDistribution[company] = (companyDistribution[company] || 0) + 1;
    });
    
    setAnalyticsData({
      totalContacts: contactsToAnalyze.length,
      avgEngagement,
      interactionTypes,
      monthlyInteractions,
      topContacts,
      companyDistribution,
      engagementScores
    });
  };

  // Calculate analytics whenever relevant data changes
  useEffect(() => {
    calculateAnalytics();
  }, [contacts, selectedSegment, filteredContacts]);

  // Email Integration Functions
  const handleEmailTemplateSelect = (templateId) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setEmailForm(prev => ({
        ...prev,
        template: templateId,
        subject: template.subject,
        message: template.content
      }));
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.subject || !emailForm.message) {
      message.error('Please fill in subject and message');
      return;
    }

    const recipients = getContactsBySegment(selectedSegment).filter(contact => contact.email);
    
    if (recipients.length === 0) {
      message.error('No contacts with email addresses found');
      return;
    }

    try {
      // In a real app, this would send emails via an email service
      console.log('Sending email to:', recipients.length, 'recipients');
      console.log('Subject:', emailForm.subject);
      console.log('Message:', emailForm.message);
      
      message.success(`Email sent to ${recipients.length} contacts successfully!`);
      setEmailModalVisible(false);
      setEmailForm({ subject: '', message: '', template: '', recipients: [] });
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('Failed to send email');
    }
  };

  const getEmailRecipientsCount = () => {
    return getContactsBySegment(selectedSegment).filter(contact => contact.email).length;
  };

  // Apply segmentation whenever contacts or filters change
  useEffect(() => {
    if (showSegments) {
      applySegmentation();
    }
  }, [contacts, filteredContacts, showSegments]);

  // Calculate analytics whenever contacts change
  useEffect(() => {
    if (showAnalytics) {
      calculateAnalytics();
    }
  }, [contacts, showAnalytics]);

  useEffect(() => {
    fetchAgents();
    fetchCallLogs();
    fetchCannedResponses();
    fetchContacts();
  }, []);

  // Fetch company info
  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/company/info`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  // Update display name
  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
      message.error('Display name cannot be empty');
      return;
    }

    setDisplayNameLoading(true);
    try {
      const response = await fetch(`${API_URL}/company/update-display-name`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ displayName: newDisplayName.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        message.success('Display name updated successfully');
        setDisplayNameModal(false);
        setNewDisplayName('');
        fetchCompanyInfo(); // Refresh company info
      } else {
        message.error(data.error || 'Failed to update display name');
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      message.error('Failed to update display name');
    } finally {
      setDisplayNameLoading(false);
    }
  };

  // Open display name modal
  const openDisplayNameModal = () => {
    setNewDisplayName(companyInfo?.displayName || '');
    setDisplayNameModal(true);
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, [adminToken]);

  return (
    <DashboardLayout 
      userType="admin"
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={onLogout}
    >
      {/* Main Content by Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* Dashboard Overview Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 32 }}>
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px #2E73FF11', padding: 32, display: 'flex', alignItems: 'center', gap: 24 }}>
              <img src={logoLight} alt="Owl Logo" style={{ width: 96, height: 96, borderRadius: 24, background: '#0a2239', padding: 12 }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 32, color: '#2E73FF', letterSpacing: 1, marginBottom: 8 }}>Welcome to CallDocker</div>
                <div style={{ fontSize: 18, color: '#213547', fontWeight: 500 }}>Your all-in-one call center dashboard. Monitor, manage, and optimize your team's performance with real-time insights and beautiful analytics.</div>
              </div>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
            marginBottom: 32,
          }}
          className="metric-card-grid"
          >
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', background: 'linear-gradient(120deg, #2E73FF 0%, #00e6ef 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <BarChartOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Total Calls</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>6,750</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', display: 'flex', gap: 16, flexDirection: 'column', alignItems: 'flex-start' }}>
              <ClockCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>24/7</div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>Always Available</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #F6C23E22', background: 'linear-gradient(120deg, #F6C23E 0%, #2E73FF 100%)', color: '#fff', display: 'flex', gap: 16, flexDirection: 'column', alignItems: 'flex-start' }}>
              <TagOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>Smart</div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>AI-Powered Routing</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #1CC88A22', background: 'linear-gradient(120deg, #1CC88A 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <UserOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Total Agents</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{agents.length}</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', display: 'flex', gap: 16, flexDirection: 'column', alignItems: 'flex-start' }}>
              <ClockCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Average Duration</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{(() => {
                  if (!callLogs.length) return '00:00';
                  const toSec = d => {
                    if (!d) return 0;
                    if (typeof d === 'number') return d;
                    if (typeof d === 'string' && d.includes(':')) {
                      const [m, s] = d.split(':').map(Number);
                      return m * 60 + s;
                    }
                    return 0;
                  };
                  const totalSec = callLogs.reduce((sum, call) => sum + toSec(call.duration), 0);
                  const avgSec = Math.round(totalSec / callLogs.length);
                  const min = Math.floor(avgSec / 60);
                  const sec = avgSec % 60;
                  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
                })()}</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #F6C23E22', background: 'linear-gradient(120deg, #F6C23E 0%, #2E73FF 100%)', color: '#fff', display: 'flex', gap: 16, flexDirection: 'column', alignItems: 'flex-start' }}>
              <TagOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Call Tags</div>
                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[...new Set(callLogs.flatMap(l => l.tags || []))].map(tag => (
                    <span key={tag} style={{ background: '#007bff', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 14 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={16}>
              <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', minHeight: 320 }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Call Volume Analytics</div>
                {/* Chart placeholder - replace with real chart */}
                <Line data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [{
                    label: 'Calls',
                    data: [12, 19, 3, 5, 2, 3, 7],
                    backgroundColor: 'rgba(0,123,255,0.2)',
                    borderColor: '#007bff',
                    borderWidth: 2,
                    tension: 0.1
                  }],
                }} options={{ 
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }} height={120} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', minHeight: 320 }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Notifications</div>
                <ul style={{ paddingLeft: 16, fontSize: 16, color: '#213547' }}>
                  <li>New agent registered (demo)</li>
                  <li>Call missed by agent1 (demo)</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </>
      )}
      {activeTab === 'analytics' && (
        <>
          {/* Analytics Section */}
          <Row gutter={[32, 32]}>
            <Col xs={24} md={16}>
              <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 32, minHeight: 320 }}>
                <BarChartOutlined style={{ fontSize: 48, color: '#2E73FF', marginBottom: 16 }} />
                <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Call Volume Analytics</div>
                {/* Simple chart implementation */}
                <div style={{ height: 250, position: 'relative', width: '100%' }}>
                  <Line 
                    data={{
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                      datasets: [{
                        label: 'Calls',
                        data: [12, 19, 3, 5, 2, 3, 7],
                        backgroundColor: 'rgba(46, 115, 255, 0.1)',
                        borderColor: '#2E73FF',
                        borderWidth: 2,
                        pointBackgroundColor: '#2E73FF',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1,
                        pointRadius: 4,
                        tension: 0.1
                      }]
                    }} 
                    options={{ 
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', padding: 32, minHeight: 320 }}>
                <BellOutlined style={{ fontSize: 48, color: '#00e6ef', marginBottom: 16 }} />
                <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Notifications</div>
                <ul style={{ paddingLeft: 16, fontSize: 16, color: '#213547' }}>
                  <li>New agent registered (demo)</li>
                  <li>Call missed by agent1 (demo)</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </>
      )}
      {activeTab === 'agents' && (
        <>
          {/* Agent Management Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, marginBottom: 32 }}>
            <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 24 }} title={<span style={{ fontWeight: 700, fontSize: 20 }}>Agent Management</span>} extra={<Button type="primary" style={{ borderRadius: 8, fontWeight: 600 }} onClick={() => setAddModal(true)}>Add Agent</Button>}>
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
                style={{ borderRadius: 12, overflow: 'hidden', background: '#fff' }}
              />
            </Card>
            <Row gutter={[32, 32]}>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', padding: 24 }} title={<span style={{ fontWeight: 600 }}>Invite Agent by Email</span>}>
                  <Input.Search placeholder="Enter agent email..." enterButton="Send Invite" onSearch={handleInviteAgent} style={{ borderRadius: 8 }} />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 24 }} title={<span style={{ fontWeight: 600 }}>Export/Download Call Logs</span>}>
                  <Button type="primary" style={{ borderRadius: 8, fontWeight: 600 }} onClick={exportCallLogsToCSV}>Export as CSV</Button>
                </Card>
              </Col>
            </Row>
            <Row gutter={[32, 32]} style={{ marginTop: 0 }}>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #F6C23E22', padding: 24 }} title={<span style={{ fontWeight: 600 }}>Bulk Actions for Agents</span>}>
                  <Button danger style={{ marginRight: 8, borderRadius: 8, fontWeight: 600 }} onClick={handleBulkRemove} disabled={selectedRowKeys.length === 0}>Remove Selected</Button>
                  <Button style={{ marginRight: 8, borderRadius: 8, fontWeight: 600 }} onClick={handleBulkActivate} disabled={selectedRowKeys.length === 0}>Activate Selected</Button>
                  <Button style={{ borderRadius: 8, fontWeight: 600 }} onClick={handleBulkDeactivate} disabled={selectedRowKeys.length === 0}>Deactivate Selected</Button>
                </Card>
              </Col>
            </Row>
          </div>
          {/* Modals */}
          <Modal open={addModal} onCancel={() => setAddModal(false)} title={<span style={{ fontWeight: 700 }}>Add Agent</span>} onOk={() => form.submit()} okText="Add" style={{ borderRadius: 16 }} okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}>
            <Form form={form} layout="vertical" onFinish={handleAdd}>
              <Form.Item name="username" label="Username" rules={[{ required: true }]}><Input style={{ borderRadius: 8 }} /></Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true }]}><Input.Password style={{ borderRadius: 8 }} /></Form.Item>
            </Form>
          </Modal>
          <Modal open={resetModal} onCancel={() => { setResetModal(false); setResetPassword(''); setResetAgent(null); }} title={<span style={{ fontWeight: 700 }}>{`Reset Password for ${resetAgent?.username || ''}`}</span>} onOk={handleResetPassword} okText="Reset" confirmLoading={resetLoading} style={{ borderRadius: 16 }} okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}>
            <Input.Password value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="New Password" style={{ borderRadius: 8 }} />
          </Modal>
          <Modal open={editModal} onCancel={() => { setEditModal(false); setEditAgent(null); setEditUsername(''); setEditRole('agent'); }} title={<span style={{ fontWeight: 700 }}>{`Edit Agent ${editAgent?.username || ''}`}</span>} onOk={handleSaveEdit} okText="Save" confirmLoading={editLoading} style={{ borderRadius: 16 }} okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}>
            <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Username" style={{ marginBottom: 12, borderRadius: 8 }} />
            <Select value={editRole} onChange={setEditRole} style={{ width: '100%', borderRadius: 8 }}>
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
        </>
      )}
      {activeTab === 'calls' && (
        <>
          {/* Call Logs Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
            marginBottom: 32,
          }}
          className="metric-card-grid"
          >
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', background: 'linear-gradient(120deg, #2E73FF 0%, #00e6ef 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <PhoneOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Total Calls</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{callLogs.length}</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #1CC88A22', background: 'linear-gradient(120deg, #1CC88A 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <CheckCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Answered Calls</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{callLogs.filter(l => (l.disposition || l.status || '').toLowerCase().includes('answer') || (l.status || '').toLowerCase() === 'accepted').length}</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #E74A3B22', background: 'linear-gradient(120deg, #E74A3B 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <CloseCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Missed Calls</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{callLogs.filter(l => (l.disposition || l.status || '').toLowerCase().includes('miss') || (l.status || '').toLowerCase() === 'rejected').length}</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', display: 'flex', gap: 16,
      flexDirection: 'column',
      alignItems: 'flex-start' }}>
              <ClockCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Average Duration</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{(() => {
                  if (!callLogs.length) return '00:00';
                  const toSec = d => {
                    if (!d) return 0;
                    if (typeof d === 'number') return d;
                    if (typeof d === 'string' && d.includes(':')) {
                      const [m, s] = d.split(':').map(Number);
                      return m * 60 + s;
                    }
                    return 0;
                  };
                  const totalSec = callLogs.reduce((sum, call) => sum + toSec(call.duration), 0);
                  const avgSec = Math.round(totalSec / callLogs.length);
                  const min = Math.floor(avgSec / 60);
                  const sec = avgSec % 60;
                  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
                })()}</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #F6C23E22', background: 'linear-gradient(120deg, #F6C23E 0%, #2E73FF 100%)', color: '#fff', display: 'flex', gap: 16,
      flexDirection: 'column',
      alignItems: 'flex-start' }}>
              <TagOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Call Tags</div>
                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[...new Set(callLogs.flatMap(l => l.tags || []))].map(tag => (
                    <span key={tag} style={{ background: '#007bff', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 14 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          {/* Call logs table and advanced filtering */}
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 24 }} title={<span style={{ fontWeight: 700, fontSize: 20 }}>Call Logs</span>}>
            <Input.Search
              placeholder="Search by agent, disposition, or notes"
              value={callSearch}
              onChange={e => setCallSearch(e.target.value)}
              style={{ marginBottom: 16, maxWidth: 320, borderRadius: 8 }}
              allowClear
            />
            <Table columns={callColumns} dataSource={filteredLogs} rowKey="sessionId" loading={callLoading} pagination={{ pageSize: 10 }} style={{ borderRadius: 12, overflow: 'hidden', background: '#fff' }} />
          </Card>
        </>
      )}
      {activeTab === 'monitoring' && (
        <>
          {/* Real-time Monitoring Section */}
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 32, minHeight: 220, display: 'flex', alignItems: 'center', gap: 24 }}>
            <RadarChartOutlined style={{ fontSize: 48, color: '#2E73FF', marginRight: 24 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Real-time Monitoring</div>
              <div style={{ fontSize: 16, color: '#213547' }}>Live call/agent monitoring coming soon.</div>
            </div>
          </Card>
        </>
      )}
      {activeTab === 'tags' && (
        <>
          {/* Tag/Disposition Management Section */}
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #F6C23E22', padding: 32, minHeight: 220, display: 'flex', alignItems: 'center', gap: 24 }}>
            <TagOutlined style={{ fontSize: 48, color: '#F6C23E', marginRight: 24 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Tag/Disposition Management</div>
              <div style={{ fontSize: 16, color: '#213547' }}>Manage call tags and dispositions here (coming soon).</div>
            </div>
          </Card>
        </>
      )}
      {activeTab === 'routing' && (
        <>
          {/* Routing Rules / IVR Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'flex-start', marginBottom: 32 }}>
            {/* Welcome & Waiting Audio Section */}
            <Card title={<span><AudioOutlined /> Welcome & Waiting Audio</span>} style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 24 }}>
              <Upload.Dragger
                name="audio"
                accept="audio/*"
                showUploadList={false}
                customRequest={({ file, onSuccess }) => { setTimeout(() => { onSuccess('ok'); }, 500); }}
                onChange={handleAudioUpload}
                style={{ marginBottom: 16, borderRadius: 12 }}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">Click or drag audio file to upload (MP3/WAV)</p>
                {audioUrl && <audio src={audioUrl} controls style={{ width: '100%', marginTop: 8 }} />}
              </Upload.Dragger>
              <div style={{ margin: '16px 0' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Text-to-Speech (TTS)</div>
                <Input.TextArea rows={2} value={ttsText} onChange={e => setTtsText(e.target.value)} placeholder="Paste welcome message for TTS..." style={{ marginBottom: 8, borderRadius: 8 }} />
                <AntSelect value={ttsVoice} onChange={setTtsVoice} style={{ width: 140, marginRight: 8, borderRadius: 8 }}>
                  <AntSelect.Option value="female">Female (US)</AntSelect.Option>
                  <AntSelect.Option value="male">Male (US)</AntSelect.Option>
                  <AntSelect.Option value="uk">Female (UK)</AntSelect.Option>
                </AntSelect>
                <Button icon={<PlayCircleOutlined />} onClick={handleTtsPreview} style={{ borderRadius: 8 }}>Preview</Button>
                <Button icon={<DownloadOutlined />} style={{ marginLeft: 8, borderRadius: 8 }}>Download</Button>
              </div>
              <div style={{ margin: '16px 0' }}>
                <AntSwitch checked={musicOnHold} onChange={setMusicOnHold} /> <span style={{ marginLeft: 8 }}>Play background music while on hold</span>
              </div>
            </Card>
            {/* IVR Settings Panel */}
            <Card title={<span><SettingOutlined /> IVR Settings</span>} style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', padding: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Timeout Duration (sec):</span>
                <Slider min={2} max={30} step={1} value={timeout} onChange={setTimeout} style={{ width: 180, marginLeft: 16 }} />
                <span style={{ marginLeft: 12 }}>{timeout}s</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Fallback Action:</span>
                <AntSelect value={fallback} onChange={setFallback} style={{ width: 160, marginLeft: 16, borderRadius: 8 }}>
                  <AntSelect.Option value="loop">Loop</AntSelect.Option>
                  <AntSelect.Option value="disconnect">Disconnect</AntSelect.Option>
                  <AntSelect.Option value="transfer">Transfer</AntSelect.Option>
                </AntSelect>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Default Language:</span>
                <AntSelect value={language} onChange={setLanguage} style={{ width: 120, marginLeft: 16, borderRadius: 8 }}>
                  <AntSelect.Option value="en">English</AntSelect.Option>
                  <AntSelect.Option value="es">Spanish</AntSelect.Option>
                  <AntSelect.Option value="fr">French</AntSelect.Option>
                </AntSelect>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>DTMF Tone Type:</span>
                <AntSelect value={dtmfType} onChange={setDtmfType} style={{ width: 140, marginLeft: 16, borderRadius: 8 }}>
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
          <Card title={<span><BranchesOutlined /> Routing Rule Builder</span>} style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', marginBottom: 32, padding: 24 }} extra={<Button icon={<PlusCircleOutlined />} style={{ borderRadius: 8 }} onClick={() => setShowAddAction(true)}>Add New Action</Button>}>
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
                      <Tooltip title="Edit"><Button icon={<EditOutlined />} size="small" style={{ marginRight: 8, borderRadius: 8 }} onClick={() => handleEditIvrStep(record)} /></Tooltip>
                      <Tooltip title="Delete"><Button icon={<DeleteOutlined />} size="small" danger style={{ borderRadius: 8 }} onClick={() => handleDeleteIvrStep(record.key)} /></Tooltip>
                      <Tooltip title="Duplicate"><Button icon={<CopyOutlined />} size="small" style={{ marginLeft: 8, borderRadius: 8 }} onClick={() => setIvrSteps([...ivrSteps, { ...record, key: Date.now() }])} /></Tooltip>
                    </span>
                  )
                }
              ]}
              rowKey="key"
              pagination={false}
              style={{ borderRadius: 8 }}
            />
            {editingStep && (
              <Modal open={!!editingStep} title="Edit IVR Step" onOk={handleSaveEditIvrStep} onCancel={() => setEditingStep(null)} okText="Save" style={{ borderRadius: 16 }} okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}>
                <Input style={{ marginBottom: 8, borderRadius: 8 }} placeholder="Digit" value={editingStep.digit} onChange={e => setEditingStep({ ...editingStep, digit: e.target.value })} maxLength={1} />
                <Input style={{ marginBottom: 8, borderRadius: 8 }} placeholder="Label" value={editingStep.label} onChange={e => setEditingStep({ ...editingStep, label: e.target.value })} />
                <Input style={{ borderRadius: 8 }} placeholder="Action" value={editingStep.action} onChange={e => setEditingStep({ ...editingStep, action: e.target.value })} />
              </Modal>
            )}
            <Modal open={showAddAction} title="Add New IVR Action" onOk={() => setShowAddAction(false)} onCancel={() => setShowAddAction(false)} okText="Add" style={{ borderRadius: 16 }} okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}>
              <div style={{ marginBottom: 8 }}><b>Choose an action template:</b></div>
              <Button block style={{ marginBottom: 8, borderRadius: 8 }} icon={<UserSwitchOutlined />}>Route to Agent/Group</Button>
              <Button block style={{ marginBottom: 8, borderRadius: 8 }} icon={<FileTextOutlined />}>Play Voice Prompt</Button>
              <Button block style={{ marginBottom: 8, borderRadius: 8 }} icon={<PoweroffOutlined />}>End Call</Button>
              <Button block style={{ marginBottom: 8, borderRadius: 8 }} icon={<BranchesOutlined />}>Webhook/External Action</Button>
            </Modal>
          </Card>
          {/* Save, Test, Deploy Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginBottom: 24 }}>
            <Button type="primary" icon={<SaveOutlined />} size="large" style={{ borderRadius: 8 }} onClick={async () => {
              setIvrSaving(true);
              try {
                const res = await fetch(`http://localhost:5001/api/widget/ivr/${companyUuid}`, {
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
        </>
      )}
      {activeTab === 'integrations' && (
        <>
          {/* Integrations Section */}
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 32 }} title={<span style={{ fontWeight: 700, fontSize: 20 }}>Integration Management</span>}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <Input
                placeholder="Webhook URL (e.g. https://yourapp.com/webhook)"
                value={newWebhook}
                onChange={e => setNewWebhook(e.target.value)}
                style={{ width: 320, borderRadius: 8 }}
              />
              <Button type="primary" style={{ borderRadius: 8, fontWeight: 600 }} onClick={() => {
                if (!newWebhook.startsWith('http')) {
                  message.error('Please enter a valid URL');
                  return;
                }
                setWebhooks(list => [newWebhook, ...list]);
                setNewWebhook('');
                message.success('Webhook added!');
              }}>Add Integration</Button>
            </div>
            <ul style={{ marginTop: 16 }}>
              {webhooks.length === 0 && <li style={{ color: '#888' }}>(No integrations yet)</li>}
              {webhooks.map((url, i) => (
                <li key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', color: '#2E73FF' }}>{url}</span>
                  <Button danger size="small" style={{ borderRadius: 8 }} onClick={() => setWebhooks(list => list.filter((w, idx) => idx !== i))}>Remove</Button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
      {activeTab === 'settings' && (
        <>
          {/* Settings/Profile Section */}
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 32 }} title={<span style={{ fontWeight: 700, fontSize: 20 }}>Company Profile / Settings</span>}>
            {/* Company Profile Section */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontWeight: 700, fontSize: 18 }}>Company Profile</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Company UUID:</span>
                <Input value={companyUuid} readOnly style={{ width: 320, fontFamily: 'monospace', borderRadius: 8 }} />
                <Button style={{ borderRadius: 8 }} onClick={() => { navigator.clipboard.writeText(companyUuid); message.success('UUID copied!'); }}>Copy</Button>
              </div>
              <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Company Name:</span> <span style={{ color: '#888' }}>[Not set]</span></div>
              <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Email:</span> <span style={{ color: '#888' }}>[Not set]</span></div>
              <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Other Details:</span> <span style={{ color: '#888' }}>[Not set]</span></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Customize Widget:</strong>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Input value={widgetText} onChange={e => setWidgetText(e.target.value)} placeholder="Button Text (e.g., Call Us)" style={{ marginBottom: 8, maxWidth: 180, borderRadius: 8 }} />
                <Input type="color" value={widgetColor} onChange={e => setWidgetColor(e.target.value)} style={{ width: 40, marginRight: 8, borderRadius: 8 }} />
                <Select style={{ width: 120, marginRight: 8, borderRadius: 8 }} value={widgetShape} onChange={setWidgetShape}>
                  <Select.Option value="round">Round</Select.Option>
                  <Select.Option value="square">Square</Select.Option>
                </Select>
                <Select style={{ width: 140, marginRight: 8, borderRadius: 8 }} value={widgetPosition} onChange={setWidgetPosition}>
                  <Select.Option value="bottom-right">Bottom Right</Select.Option>
                  <Select.Option value="bottom-left">Bottom Left</Select.Option>
                  <Select.Option value="top-right">Top Right</Select.Option>
                  <Select.Option value="top-left">Top Left</Select.Option>
                </Select>
                <Select style={{ width: 120, marginRight: 8, borderRadius: 8 }} value={widgetAnimation} onChange={setWidgetAnimation}>
                  <Select.Option value="none">No Animation</Select.Option>
                  <Select.Option value="bounce">Bounce</Select.Option>
                  <Select.Option value="fade">Fade</Select.Option>
                </Select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                  <Switch checked={widgetDarkMode} onChange={setWidgetDarkMode} /> Dark Mode
                </label>
                <Input type="file" accept="image/*" style={{ width: 200, borderRadius: 8 }} onChange={handleImageUpload} />
              </div>
              <Button type="primary" style={{ borderRadius: 8, fontWeight: 600, marginTop: 8 }} onClick={handleSaveWidget} loading={widgetLoading}>Save Settings</Button>
              <Button style={{ borderRadius: 8, marginLeft: 8, marginTop: 8 }} onClick={openTestModal}>Test Widget</Button>
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
                <Input value={script.replace(/\"/g, '"')} readOnly style={{ fontFamily: 'monospace', width: 420, background: '#f7fafd', borderRadius: 8 }} />
                <Button icon={<CopyOutlined />} style={{ borderRadius: 8 }} onClick={handleCopy}>Copy</Button>
                <Tooltip title="How to embed the widget"><Button icon={<QuestionCircleOutlined />} style={{ borderRadius: 8 }} onClick={() => setShowEmbedHelp(true)} /></Tooltip>
              </div>
            </div>
            <Modal open={showEmbedHelp} onCancel={() => setShowEmbedHelp(false)} footer={null} title="How to Embed the Widget?" style={{ borderRadius: 16 }}>
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
        </>
      )}
      {activeTab === 'audit' && (
        <>
          {/* Audit Log Section */}
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 32 }} title={<span style={{ fontWeight: 700, fontSize: 20 }}>Audit Log / Activity History</span>}>
            <ul style={{ fontSize: 16, color: '#213547', marginLeft: 16 }}>
              {auditLog.map((entry, i) => <li key={i}><b>{entry.time}:</b> {entry.action}</li>)}
            </ul>
          </Card>
        </>
      )}
      {activeTab === 'chat' && (
        <>
          {/* Chat Management Section */}
          <div style={{ display: 'flex', height: '70vh', background: '#f7fafd', borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', overflow: 'hidden' }}>
            {/* Session List */}
            <div style={{ width: 320, background: '#2e326f', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8eaf6' }}>
              <div style={{ padding: 24, fontWeight: 700, fontSize: 20, borderBottom: '1px solid #e8eaf6', background: '#2e326f' }}>
                Chat Sessions <span style={{ fontWeight: 400, fontSize: 16, opacity: 0.7 }}>({chatSessions.length})</span>
              </div>
              <div style={{ padding: 16 }}>
                <Input.Search
                  placeholder="Search chats..."
                  value={chatSearch}
                  onChange={e => setChatSearch(e.target.value)}
                  style={{ borderRadius: 8, marginBottom: 16 }}
                  allowClear
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {chatSessions
                  .filter(session => 
                    session.visitorId.toLowerCase().includes(chatSearch.toLowerCase()) ||
                    session.lastMessage.toLowerCase().includes(chatSearch.toLowerCase())
                  )
                  .map(session => (
                    <div
                      key={session.sessionId}
                      onClick={() => setActiveChat(session.sessionId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 20px',
                        background: activeChat === session.sessionId ? '#fff' : 'transparent',
                        color: activeChat === session.sessionId ? '#2e326f' : '#fff',
                        cursor: 'pointer',
                        borderLeft: activeChat === session.sessionId ? '4px solid #2E73FF' : '4px solid transparent',
                        transition: 'background 0.2s, color 0.2s',
                        position: 'relative',
                      }}
                    >
                      <Badge dot={session.status === 'active'} offset={[-6, 32]}>
                        <Avatar size={40} style={{ background: '#e3e6f3', color: '#2e326f', fontWeight: 700 }}>
                          {session.visitorId?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                      </Badge>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {session.visitorId}
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: session.status === 'active' ? '#4CAF50' : '#FF9800', 
                            display: 'inline-block' 
                          }} />
                          {/* Show escalated badge in session list */}
                          {session.escalated && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#E74A3B', fontWeight: 700 }}>Escalated</span>
                          )}
                          {/* Show rating in session list */}
                          {typeof session.rating === 'number' && (
                            <span style={{ marginLeft: 8, fontSize: 15 }}>
                              {[1,2,3,4,5].map(star => (
                                <span key={star} style={{ color: session.rating >= star ? '#FFD700' : '#e0e0e0', fontSize: 16 }}>&#9733;</span>
                              ))}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 14, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.lastMessage}</div>
                        {/* Show tags in session list */}
                        <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(chatTags[session.sessionId] || []).map(tag => (
                            <span key={tag} style={{ 
                              background: 'rgba(255, 255, 255, 0.2)', 
                              color: '#fff', 
                              borderRadius: 4, 
                              padding: '2px 6px', 
                              fontSize: 11 
                            }}>{tag}</span>
                          ))}
                        </div>
                        {/* Show assigned agent */}
                        <div style={{ marginTop: 4, fontSize: 12, color: '#00e6ef' }}>
                          Assigned: {chatAssignments[session.sessionId] || 'Unassigned'}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7, minWidth: 60, textAlign: 'right' }}>{session.lastTimestamp}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Conversation View */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
              {/* Header */}
              <div style={{ padding: '20px 32px', borderBottom: '1px solid #e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {activeChat ? chatSessions.find(s => s.sessionId === activeChat)?.visitorId : 'Select a chat'}
                    </div>
                    <div style={{ fontSize: 14, color: '#888' }}>
                      {activeChat ? chatSessions.find(s => s.sessionId === activeChat)?.pageUrl : ''}
                    </div>
                    {/* Show tags in chat header */}
                    {activeChat && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(chatTags[activeChat] || []).map(tag => (
                          <span key={tag} style={{ 
                            background: '#e8f1ff', 
                            color: '#2E73FF', 
                            borderRadius: 4, 
                            padding: '2px 8px', 
                            fontSize: 12,
                            fontWeight: 500
                          }}>{tag}</span>
                        ))}
                        {/* Show escalated badge in chat header */}
                        {chatSessions.find(s => s.sessionId === activeChat)?.escalated && (
                          <span style={{ marginLeft: 8, fontSize: 13, color: '#E74A3B', fontWeight: 700 }}>Escalated</span>
                        )}
                        {/* Show rating in chat header */}
                        {typeof chatSessions.find(s => s.sessionId === activeChat)?.rating === 'number' && (
                          <span style={{ marginLeft: 8, fontSize: 18 }}>
                            {[1,2,3,4,5].map(star => (
                              <span key={star} style={{ color: chatSessions.find(s => s.sessionId === activeChat)?.rating >= star ? '#FFD700' : '#e0e0e0', fontSize: 22 }}>&#9733;</span>
                            ))}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Show and assign agent */}
                    {activeChat && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#888' }}>Assigned to:</span>
                        <AntSelect
                          value={chatAssignments[activeChat] || undefined}
                          onChange={val => handleAssignAgent(activeChat, val)}
                          style={{ minWidth: 140, borderRadius: 8 }}
                          placeholder="Select agent"
                          allowClear
                        >
                          {agents.map(agent => (
                            <AntSelect.Option key={agent.username} value={agent.username}>{agent.username}</AntSelect.Option>
                          ))}
                        </AntSelect>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Tooltip title="Export transcript">
                    <Button 
                      type="text" 
                      icon={<DownloadIcon />} 
                      disabled={!activeChat}
                      style={{ borderRadius: 8 }}
                    />
                  </Tooltip>
                  <Tooltip title="More options">
                    <Button type="text" icon={<MoreOutlined />} style={{ borderRadius: 8 }} />
                  </Tooltip>
                </div>
              </div>

              {/* Tag Input */}
              {activeChat && (
                <div style={{ padding: '12px 32px', background: '#f0f2f5', borderBottom: '1px solid #e8eaf6', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Select
                    mode="tags"
                    style={{ minWidth: 200, borderRadius: 8 }}
                    placeholder="Add tags..."
                    value={tagInput}
                    onChange={handleTagChange}
                    options={tagOptions.map(tag => ({ label: tag, value: tag }))}
                    tokenSeparators={[',', ' ']}
                    maxTagCount={4}
                    allowClear
                  />
                </div>
              )}

              {/* Tab Switcher */}
              {activeChat && (
                <div style={{ display: 'flex', borderBottom: '1px solid #e8eaf6', background: '#f7fafd', padding: '0 32px' }}>
                  <Button type={chatTab === 'chat' ? 'primary' : 'text'} onClick={() => setChatTab('chat')} style={{ borderRadius: 8, fontWeight: 600, marginRight: 8 }}>Chat</Button>
                  <Button type={chatTab === 'notes' ? 'primary' : 'text'} onClick={() => setChatTab('notes')} style={{ borderRadius: 8, fontWeight: 600 }}>Notes</Button>
                </div>
              )}

              {/* Chat Tab */}
              {chatTab === 'chat' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: '#f7fafd' }}>
                  {!activeChat && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 80 }}>Select a chat to view messages.</div>}
                  {activeChat && (chatMessages[activeChat] || []).length === 0 && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 80 }}>No messages yet.</div>}
                  {activeChat && (chatMessages[activeChat] || []).map((msg, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: msg.from === 'agent' ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 24 }}>
                      <Avatar style={{ background: msg.from === 'agent' ? '#2E73FF' : '#e3e6f3', color: msg.from === 'agent' ? '#fff' : '#2e326f', margin: msg.from === 'agent' ? '0 0 0 16px' : '0 16px 0 0' }}>
                        {msg.from?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <div style={{ maxWidth: 420, marginLeft: msg.from === 'agent' ? 0 : 8, marginRight: msg.from === 'agent' ? 8 : 0 }}>
                        <div style={{
                          background: msg.from === 'agent' ? '#2E73FF' : '#fff',
                          color: msg.from === 'agent' ? '#fff' : '#222',
                          borderRadius: msg.from === 'agent' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding: '12px 20px',
                          fontSize: 16,
                          fontWeight: 500,
                          boxShadow: '0 2px 8px rgba(46,115,255,0.08)',
                          marginBottom: 4,
                          wordBreak: 'break-word',
                        }}>{msg.message}</div>
                        <div style={{ fontSize: 12, color: '#aaa', textAlign: msg.from === 'agent' ? 'right' : 'left' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes Tab */}
              {chatTab === 'notes' && activeChat && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', padding: '32px 40px' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Internal Notes</div>
                  <div style={{ marginBottom: 16 }}>
                    <Input.TextArea
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="Add a private note..."
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      style={{ borderRadius: 8, marginBottom: 8 }}
                      onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                    />
                    <Button type="primary" onClick={handleAddNote} disabled={!noteInput.trim()} style={{ borderRadius: 8, fontWeight: 600 }}>Add Note</Button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', background: '#f7fafd', borderRadius: 8, padding: 16 }}>
                    {(chatNotes[activeChat] || []).length === 0 && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 32 }}>No notes yet.</div>}
                    {(chatNotes[activeChat] || []).map((note, idx) => (
                      <div key={idx} style={{ marginBottom: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #2E73FF11', padding: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{note.author}</div>
                        <div style={{ fontSize: 15, marginBottom: 4 }}>{note.text}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{new Date(note.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {activeTab === 'canned' && (
        <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 32 }} title={<span style={{ fontWeight: 700, fontSize: 20 }}>Canned Responses Management</span>} extra={<Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8, fontWeight: 600 }} onClick={handleAddCanned}>Add Response</Button>}>
          <div style={{ marginBottom: 24 }}>
            <b>Tip:</b> Canned responses are quick replies available to all agents in chat. Group them by category for easy access.
          </div>
          <List
            dataSource={Object.entries(cannedResponses.reduce((acc, r) => { acc[r.category] = acc[r.category] || []; acc[r.category].push(r); return acc; }, {}))}
            renderItem={([category, items]) => (
              <List.Item style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#2E73FF' }}>{category}</div>
                <List
                  dataSource={items}
                  renderItem={item => (
                    <List.Item style={{ background: '#f7fafd', borderRadius: 8, marginBottom: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title}</div>
                        <div style={{ color: '#888', fontSize: 14 }}>{item.message}</div>
                      </div>
                      <Button icon={<EditOutlined />} style={{ borderRadius: 8, marginRight: 8 }} onClick={() => handleEditCanned(item)} />
                      <Button icon={<DeleteOutlined />} danger style={{ borderRadius: 8 }} onClick={() => handleDeleteCanned(item.id)} />
                    </List.Item>
                  )}
                />
              </List.Item>
            )}
          />
          <Modal open={showCannedModal} onCancel={() => setShowCannedModal(false)} onOk={handleSaveCanned} okText={editingResponse ? 'Save' : 'Add'} title={editingResponse ? 'Edit Canned Response' : 'Add Canned Response'} style={{ borderRadius: 16 }} okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}>
            <div style={{ marginBottom: 16 }}>
              <Input value={cannedForm.title} onChange={e => setCannedForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" style={{ borderRadius: 8, marginBottom: 8 }} />
              <Input value={cannedForm.category} onChange={e => setCannedForm(f => ({ ...f, category: e.target.value }))} placeholder="Category" style={{ borderRadius: 8, marginBottom: 8 }} />
              <Input.TextArea value={cannedForm.message} onChange={e => setCannedForm(f => ({ ...f, message: e.target.value }))} placeholder="Message" autoSize={{ minRows: 2, maxRows: 4 }} style={{ borderRadius: 8 }} />
            </div>
          </Modal>
        </Card>
      )}
      {activeTab === 'crm' && (
        <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 32 }} title={<span style={{ fontWeight: 700, fontSize: 20 }}>CRM & Contact Management</span>}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h3 style={{ color: '#666', marginBottom: 16 }}>CRM Features Temporarily Removed</h3>
            <p style={{ color: '#888', fontSize: 16 }}>Contact management, segmentation, and analytics features have been temporarily removed to resolve JSX compilation issues.</p>
            <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>These features will be re-implemented in a future update.</p>
          </div>
        </Card>
      )}
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

      {/* Warning Modal for No Online Agents */}
      <Modal 
        open={testCallWarning} 
        onCancel={() => setTestCallWarning(false)} 
        title="No Agents Online" 
        width={400}
        footer={[
          <Button key="cancel" onClick={() => setTestCallWarning(false)}>
            Cancel
          </Button>,
          <Button key="agents" type="primary" onClick={() => {
            setTestCallWarning(false);
            onTabChange('agents');
          }}>
            Go to Agents
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, color: '#F6C23E', marginBottom: 16 }} />
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            <strong>No agents are currently online</strong>
          </p>
          <p style={{ color: '#666', marginBottom: 16 }}>
            To test the widget, you need at least one agent to be logged in to their dashboard.
          </p>
          <p style={{ color: '#888', fontSize: 14 }}>
            Go to the <strong>Agents</strong> tab to create agents and ensure they are online.
          </p>
        </div>
      </Modal>

      {/* Contact Creation Modal */}
      <Modal
        title="Add New Contact"
        open={showContactModal}
        onCancel={() => setShowContactModal(false)}
        onOk={handleSaveContact}
        okText="Add Contact"
        cancelText="Cancel"
        width={600}
        style={{ borderRadius: 16 }}
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            value={contactForm.firstName}
            onChange={e => setContactForm(f => ({ ...f, firstName: e.target.value }))}
            placeholder="First Name"
            style={{ borderRadius: 8, marginBottom: 12 }}
          />
          <Input
            value={contactForm.lastName}
            onChange={e => setContactForm(f => ({ ...f, lastName: e.target.value }))}
            placeholder="Last Name"
            style={{ borderRadius: 8, marginBottom: 12 }}
          />
          <Input
            value={contactForm.email}
            onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email Address"
            type="email"
            style={{ borderRadius: 8, marginBottom: 12 }}
          />
          <Input
            value={contactForm.phone}
            onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="Phone Number"
            style={{ borderRadius: 8, marginBottom: 12 }}
          />
          <Input
            value={contactForm.company}
            onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))}
            placeholder="Company"
            style={{ borderRadius: 8, marginBottom: 12 }}
          />
          <Select
            mode="tags"
            value={contactForm.tags}
            onChange={tags => setContactForm(f => ({ ...f, tags }))}
            placeholder="Add tags (press Enter to add)"
            style={{ width: '100%', borderRadius: 8 }}
            tokenSeparators={[',']}
          />
        </div>
      </Modal>

      {/* Display Name Modal */}
      <Modal
        title="Update Company Display Name"
        open={displayNameModal}
        onCancel={() => setDisplayNameModal(false)}
        onOk={handleUpdateDisplayName}
        okText="Update"
        cancelText="Cancel"
        width={500}
        style={{ borderRadius: 16 }}
        okButtonProps={{ 
          style: { borderRadius: 8, fontWeight: 600 },
          loading: displayNameLoading
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', marginBottom: 16 }}>
            The display name will appear in chat widgets and communications. 
            This is different from your company name and can be changed anytime.
          </p>
          <Input
            value={newDisplayName}
            onChange={e => setNewDisplayName(e.target.value)}
            placeholder="Enter display name (e.g., MindFirm, Acme Corp)"
            style={{ borderRadius: 8 }}
            maxLength={50}
          />
          <small style={{ color: '#888', fontSize: 12 }}>
            Maximum 50 characters. Leave empty to use company name as display name.
          </small>
        </div>
      </Modal>
    </DashboardLayout>
  );
} 
