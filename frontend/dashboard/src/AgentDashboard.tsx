import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, Row, Col, Table, Button, Input, Tag, Form, Select, message, Modal, Empty, Tabs } from 'antd';
import { io, Socket } from 'socket.io-client';
import { SoundOutlined, PauseCircleOutlined, SwapOutlined, UserSwitchOutlined, BellOutlined, PhoneOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'; // For agent controls and notifications

const API_URL = 'http://localhost:5000/api/widget';
const SOCKET_URL = 'http://localhost:5000';
const DISPOSITIONS = [
  'Resolved', 'Escalated', 'Follow-up required', 'Wrong number', 'Spam / Abuse', 'Other',
];
const TAG_OPTIONS = [
  '#VIP', '#complaint', '#technical', '#pricing', '#followup', '#sales', '#support', '#escalated', '#spam', '#other'
];

export default function AgentDashboard({ agentToken, companyUuid, agentUsername }) {
  const [callLog, setCallLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [wrapUp, setWrapUp] = useState(false);
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState('');
  const [customDisposition, setCustomDisposition] = useState('');
  const [tags, setTags] = useState([]);
  const [timelineSession, setTimelineSession] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState('Idle'); // Idle, Ringing, In Call
  const [callStart, setCallStart] = useState(null);
  const [callTimer, setCallTimer] = useState('00:00');
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch call logs for this agent
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/call/logs/${companyUuid}`)
      .then(res => res.json())
      .then(logs => setCallLog(logs.filter(l => l.agent === agentUsername)))
      .finally(() => setLoading(false));
  }, [companyUuid, agentUsername]);

  // Socket.IO setup
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('register-agent', { uuid: companyUuid, agentId: agentUsername });
    socket.on('incoming-call', (data) => {
      setIncomingCall(data);
      setCallStatus('Ringing');
    });
    return () => {
      socket.disconnect();
      clearInterval(timerRef.current);
    };
  }, [companyUuid, agentUsername]);

  // Call timer
  useEffect(() => {
    if (callStatus === 'In Call' && callStart) {
      timerRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - callStart.getTime()) / 1000);
        const min = String(Math.floor(diff / 60)).padStart(2, '0');
        const sec = String(diff % 60).padStart(2, '0');
        setCallTimer(`${min}:${sec}`);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallTimer('00:00');
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus, callStart]);

  // Accept/Reject/End Call
  const handleCallAction = (action) => {
    if (!incomingCall || !socketRef.current) return;
    if (action === 'end') {
      setCallStatus('Wrap-up');
      setWrapUp(true);
      setIncomingCall(null);
      setCallStart(null);
      return;
    }
    socketRef.current.emit(`${action}-call`, {
      uuid: companyUuid,
      agentId: agentUsername,
      fromSocketId: incomingCall.fromSocketId,
    });
    if (action === 'accept') {
      setCallStatus('In Call');
      setCallStart(new Date());
      setWrapUp(false);
    } else {
      setCallStatus('Idle');
      setIncomingCall(null);
      setCallStart(null);
    }
  };

  // Save call log (wrap-up)
  const handleSaveLog = async () => {
    const log = {
      companyUuid,
      agent: agentUsername,
      notes,
      disposition: disposition === 'Other' ? customDisposition : disposition,
      duration: callTimer,
      sessionId: incomingCall?.fromSocketId || '-',
      tags,
      time: new Date().toISOString(),
    };
    await fetch(`${API_URL}/call/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    setCallLog(prev => [log, ...prev]);
    setNotes('');
    setDisposition('');
    setCustomDisposition('');
    setTags([]);
    setWrapUp(false);
    setCallStatus('Idle');
    message.success('Call log saved!');
  };

  const filteredLogs = callLog.filter(log =>
    (!search ||
      log.notes?.toLowerCase().includes(search.toLowerCase()) ||
      log.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      log.agent?.toLowerCase().includes(search.toLowerCase())
    ) &&
    (!timelineSession || log.sessionId === timelineSession)
  );

  const columns = [
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Duration', dataIndex: 'duration', key: 'duration' },
    { title: 'Disposition', dataIndex: 'disposition', key: 'disposition' },
    { title: 'Tags', dataIndex: 'tags', key: 'tags', render: tags => tags?.map(tag => <Tag key={tag}>{tag}</Tag>) },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: notes => <span style={{ whiteSpace: 'pre-wrap' }}>{notes}</span> },
    { title: 'Session ID', dataIndex: 'sessionId', key: 'sessionId' },
  ];

  return (
    <DashboardLayout>
      <Modal
        open={callStatus === 'Ringing'}
        title="Incoming Call"
        footer={null}
        closable={false}
        centered
      >
        <p>You have an incoming call!</p>
        <Button type="primary" onClick={() => handleCallAction('accept')} style={{ marginRight: 12 }}>Accept</Button>
        <Button danger onClick={() => handleCallAction('reject')}>Reject</Button>
      </Modal>
      {/* Place performance summary cards grid at the top */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: 24,
        marginBottom: 32,
      }}
      className="metric-card-grid"
      >
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PhoneOutlined style={{ fontSize: 32, color: '#2E73FF' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Calls Handled</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>12</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ClockCircleOutlined style={{ fontSize: 32, color: '#00e6ef' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Average Duration</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>02:15</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CloseCircleOutlined style={{ fontSize: 32, color: '#E74A3B' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Missed Calls</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>1</div>
          </div>
        </Card>
      </div>
      <Tabs defaultActiveKey="active" style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
        <Tabs.TabPane tab="Active Call" key="active">
          {/* Active call controls and wrap-up */}
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card title="Active Call">
                {callStatus === 'In Call' ? (
                  <>
                    <div><strong>Status:</strong> In Call</div>
                    <div><strong>Call Timer:</strong> {callTimer}</div>
                    {/* Agent controls stubs */}
                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                      <Button icon={<SoundOutlined />} onClick={() => {/* TODO: Mute/unmute logic */}}>Mute</Button>
                      <Button icon={<PauseCircleOutlined />} onClick={() => {/* TODO: Hold logic */}}>Hold</Button>
                      <Button icon={<SwapOutlined />} onClick={() => {/* TODO: Transfer logic */}}>Transfer</Button>
                      <Button icon={<UserSwitchOutlined />} onClick={() => {/* TODO: Change status logic */}}>Set Away</Button>
                    </div>
                    <Button danger style={{ marginTop: 16 }} onClick={() => handleCallAction('end')}>End Call</Button>
                  </>
                ) : (
                  <Empty description="No active call" />
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              {wrapUp && (
                <Card title="Call Wrap-up" style={{ background: '#fffbe6' }}>
                  <Form layout="vertical" onFinish={handleSaveLog}>
                    <Form.Item label="Notes">
                      <Input.TextArea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                    </Form.Item>
                    <Form.Item label="Disposition">
                      <Select value={disposition} onChange={setDisposition} style={{ width: '100%' }}>
                        <Select.Option value="">Select outcome...</Select.Option>
                        {DISPOSITIONS.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
                      </Select>
                      {disposition === 'Other' && (
                        <Input value={customDisposition} onChange={e => setCustomDisposition(e.target.value)} placeholder="Custom disposition..." style={{ marginTop: 8 }} />
                      )}
                    </Form.Item>
                    <Form.Item label="Tags">
                      <Select
                        mode="multiple"
                        value={tags}
                        onChange={setTags}
                        style={{ width: '100%' }}
                        options={TAG_OPTIONS.map(tag => ({ label: tag, value: tag }))}
                      />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">Save Log</Button>
                  </Form>
                </Card>
              )}
            </Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Call History" key="history">
          {/* Call history table and mini-CRM timeline */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} md={12}>
              <Card title="Call History">
                <Input.Search
                  placeholder="Search notes, tags, agent..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ marginBottom: 16, maxWidth: 320 }}
                  allowClear
                />
                <Table columns={columns} dataSource={filteredLogs} rowKey={(_, i) => i} loading={loading} pagination={{ pageSize: 8 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Mini-CRM Timeline">
                <Input
                  placeholder="Session ID for timeline"
                  value={timelineSession}
                  onChange={e => setTimelineSession(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                  {callLog.filter(log => log.sessionId === timelineSession).length === 0 && <li style={{ color: '#888' }}>(No interactions yet)</li>}
                  {callLog.filter(log => log.sessionId === timelineSession).map((log, i) => (
                    <li key={i} style={{ marginBottom: 12, background: '#fff', padding: 12, borderRadius: 6 }}>
                      <div><strong>Time:</strong> {log.time}</div>
                      <div><strong>Disposition:</strong> {log.disposition}</div>
                      <div><strong>Tags:</strong> {log.tags?.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
                      <div><strong>Notes:</strong> <pre style={{ margin: 0 }}>{log.notes}</pre></div>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Profile/Settings" key="profile">
          {/* Audio device selection, agent profile/settings */}
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card title="Audio Device Selection / Settings">
                {/* TODO: Implement audio device selection/settings */}
                <Button onClick={() => { /* TODO */ }}>Select Microphone</Button>
                <Button style={{ marginLeft: 8 }} onClick={() => { /* TODO */ }}>Select Speaker</Button>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Agent Profile / Settings">
                {/* TODO: Implement agent profile/settings management */}
                <Button type="primary" onClick={() => { /* TODO */ }}>Edit Profile</Button>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Notifications" key="notifications">
          {/* Notifications panel */}
          <Card title="Notifications" extra={<BellOutlined />}>
            {/* TODO: Connect to real notifications */}
            <ul style={{ paddingLeft: 16 }}>
              <li>Incoming call from visitor (demo)</li>
              <li>Missed call (demo)</li>
            </ul>
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </DashboardLayout>
  );
} 