import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, Row, Col, Table, Button, Input, Tag, Form, Select, message, Modal, Empty, Tabs } from 'antd';
import { io, Socket } from 'socket.io-client';
import { SoundOutlined, PauseCircleOutlined, SwapOutlined, UserSwitchOutlined, BellOutlined, PhoneOutlined, ClockCircleOutlined, CloseCircleOutlined, SendOutlined, CheckCircleOutlined, TagOutlined } from '@ant-design/icons'; // For agent controls and notifications
import logoLight from '/logo-light.png';
import logoDark from '/logo-dark.png';
import { useNavigate } from 'react-router-dom';
import notificationSound from '/notification.mp3';

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
  const [testCallIncoming, setTestCallIncoming] = useState(false);
  const [testCallActive, setTestCallActive] = useState(false);
  const [webrtcState, setWebrtcState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  // Chat state
  const [chatSessions, setChatSessions] = useState([]); // [{ sessionId, visitorId, pageUrl, startedAt }]
  const [activeChat, setActiveChat] = useState(null); // sessionId
  // Chat messages state (sessionId -> messages[])
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  // Typing indicator state
  const [visitorTyping, setVisitorTyping] = useState({}); // sessionId -> boolean
  const [unreadChats, setUnreadChats] = useState({}); // sessionId -> count
  const audioRef = useRef(null);
  const [chatOnline, setChatOnline] = useState(true);
  // Poll agent online status every 10s
  useEffect(() => {
    if (!companyUuid) return;
    let isMounted = true;
    const fetchStatus = () => {
      fetch(`http://localhost:5000/api/agents/${companyUuid}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(list => { if (isMounted) setChatOnline(Array.isArray(list) && list.some(a => a.online)); })
        .catch(() => { if (isMounted) setChatOnline(false); });
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => { clearInterval(interval); isMounted = false; };
  }, [companyUuid]);

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
    // Listen for chat events
    socket.on('chat:join', (data) => {
      setChatSessions(sessions => {
        if (sessions.some(s => s.sessionId === data.sessionId)) return sessions;
        // Agent joins the chat room for this session
        socket.emit('chat:join', {
          sessionId: data.sessionId,
          companyUuid: data.companyUuid,
          visitorId: data.visitorId,
          pageUrl: data.pageUrl
        });
        return [...sessions, { ...data, startedAt: data.startedAt || new Date().toISOString() }];
      });
    });
    socket.on('chat:message', (msg) => {
      setChatMessages(prev => {
        const arr = prev[msg.sessionId] ? [...prev[msg.sessionId]] : [];
        arr.push(msg);
        return { ...prev, [msg.sessionId]: arr };
      });
      setChatSessions(sessions => {
        if (sessions.some(s => s.sessionId === msg.sessionId)) return sessions;
        // Agent joins the chat room for this session
        socket.emit('chat:join', {
          sessionId: msg.sessionId,
          companyUuid,
          visitorId: msg.from === 'visitor' ? msg.from : 'visitor',
          pageUrl: ''
        });
        return [...sessions, { sessionId: msg.sessionId, visitorId: msg.from === 'visitor' ? msg.from : 'visitor', pageUrl: '', startedAt: msg.timestamp }];
      });
      if (activeChat !== msg.sessionId) {
        setUnreadChats(prev => ({ ...prev, [msg.sessionId]: (prev[msg.sessionId] || 0) + 1 }));
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      }
    });
    // Listen for typing
    socket.on('chat:typing', (data) => {
      if (data.from === 'visitor' && data.sessionId === activeChat) {
        setVisitorTyping(true);
        setTimeout(() => setVisitorTyping(false), 1200);
      }
    });
    // Listen for visitor typing
    socket.on('chat:typing', ({ sessionId }) => {
      setVisitorTyping(prev => ({ ...prev, [sessionId]: true }));
      setTimeout(() => setVisitorTyping(prev => ({ ...prev, [sessionId]: false })), 2000);
    });
    return () => {
      socket.disconnect();
      clearInterval(timerRef.current);
    };
  }, [companyUuid, agentUsername]);

  // Listen for test-incoming-call event from backend
  useEffect(() => {
    const handler = (data) => {
      if (data && data.uuid === companyUuid && data.test) {
        setTestCallIncoming(true);
      }
    };
    socketRef.current.on('test-incoming-call', handler);
    return () => socketRef.current.off('test-incoming-call', handler);
  }, [companyUuid]);

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

  const handleAcceptTestCall = () => {
    setTestCallIncoming(false);
    setTestCallActive(true);
  };
  const handleRejectTestCall = () => {
    setTestCallIncoming(false);
    setTestCallActive(false);
  };
  const handleEndTestCall = () => {
    setTestCallActive(false);
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

  // Refactor WebRTC setup and cleanup
  useEffect(() => {
    let pc;
    let cleanup = false;
    if (callStatus === 'In Call' && socketRef.current) {
      setWebrtcState('connecting');
      pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerRef.current = pc;
      console.log('Agent: Created RTCPeerConnection');
      // Get user media and add tracks before answer
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        setLocalStream(stream);
        console.log('Agent localStream tracks:', stream.getTracks());
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      }).catch(err => {
        console.error('Agent getUserMedia error:', err);
      });
      // Handle remote stream
      pc.ontrack = (event) => {
        const [remote] = event.streams;
        setRemoteStream(remote);
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remote;
        if (remote) console.log('Agent received remoteStream tracks:', remote.getTracks());
      };
      pc.onsignalingstatechange = () => {
        console.log('Agent signalingState:', pc.signalingState);
      };
      pc.oniceconnectionstatechange = () => {
        console.log('Agent ICE state:', pc.iceConnectionState);
      };
      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && incomingCall) {
          socketRef.current.emit('webrtc-ice-candidate', { toSocketId: incomingCall.fromSocketId, candidate: event.candidate });
        }
      };
      // Handle offer from widget
      socketRef.current.on('webrtc-offer', ({ offer, fromSocketId }) => {
        if (pc.signalingState !== 'closed') {
          pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
            // Only create answer after tracks are added
            pc.createAnswer().then(answer => {
              pc.setLocalDescription(answer);
              socketRef.current.emit('webrtc-answer', { toSocketId: fromSocketId, answer });
              setWebrtcState('connected');
              console.log('Agent: setRemoteDescription(offer) and sent answer');
            });
          });
        } else {
          console.warn('Agent: Tried to setRemoteDescription/createAnswer on closed connection');
        }
      });
      // Handle ICE from widget
      socketRef.current.on('webrtc-ice-candidate', ({ candidate }) => {
        if (pc.signalingState !== 'closed') {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.warn('Agent: Tried to addIceCandidate on closed connection');
        }
      });
    }
    // Only clean up on unmount or call truly ending
    return () => {
      if (cleanup) return;
      cleanup = true;
      if (peerRef.current) {
        console.log('Agent: Closing RTCPeerConnection');
        peerRef.current.close();
        peerRef.current = null;
      }
      setWebrtcState('idle');
      setRemoteStream(null);
      setLocalStream(null);
    };
  }, [callStatus === 'In Call', incomingCall]);

  // Scroll to bottom on new chat message
  useEffect(() => {
    if (activeChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChat]);

  // Send agent chat message
  const handleSendChat = () => {
    if (!chatInput.trim() || !activeChat || !socketRef.current) return;
    const msg = {
      sessionId: activeChat,
      message: chatInput.trim(),
      from: 'agent',
      timestamp: new Date().toISOString()
    };
    socketRef.current.emit('chat:message', msg);
    setChatMessages(prev => {
      const arr = prev[activeChat] ? [...prev[activeChat]] : [];
      arr.push(msg);
      return { ...prev, [activeChat]: arr };
    });
    setChatInput('');
  };

  // Reset unread count when opening a chat
  useEffect(() => {
    if (activeChat) {
      setUnreadChats(prev => ({ ...prev, [activeChat]: 0 }));
    }
  }, [activeChat]);

  const isDark = document.body.classList.contains('dark');
  const navigate = useNavigate();
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
        {/* Accurate Call Metrics */}
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PhoneOutlined style={{ fontSize: 32, color: '#2E73FF' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Total Calls</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{callLog.length}</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CheckCircleOutlined style={{ fontSize: 32, color: '#1CC88A' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Answered Calls</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{callLog.filter(l => (l.disposition || l.status || '').toLowerCase().includes('answer') || (l.status || '').toLowerCase() === 'accepted').length}</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CloseCircleOutlined style={{ fontSize: 32, color: '#E74A3B' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Missed Calls</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{callLog.filter(l => (l.disposition || l.status || '').toLowerCase().includes('miss') || (l.status || '').toLowerCase() === 'rejected').length}</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ClockCircleOutlined style={{ fontSize: 32, color: '#00e6ef' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Average Duration</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{(() => {
              if (!callLog.length) return '00:00';
              const toSec = d => {
                if (!d) return 0;
                if (typeof d === 'number') return d;
                if (typeof d === 'string' && d.includes(':')) {
                  const [min, sec] = d.split(':').map(Number);
                  return min * 60 + sec;
                }
                return Number(d) || 0;
              };
              const avg = Math.round(callLog.reduce((a, l) => a + toSec(l.duration), 0) / callLog.length);
              const mm = String(Math.floor(avg / 60)).padStart(2, '0');
              const ss = String(avg % 60).padStart(2, '0');
              return `${mm}:${ss}`;
            })()}</div>
          </div>
        </Card>
        <Card className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'column', alignItems: 'flex-start' }}>
          <TagOutlined style={{ fontSize: 32, color: '#F6C23E' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Call Tags</div>
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[...new Set(callLog.flatMap(l => l.tags || []))].map(tag => (
                <span key={tag} style={{ background: '#007bff', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 14 }}>{tag}</span>
              ))}
            </div>
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
          {/* Test Call Modal */}
          <Modal open={testCallIncoming} onCancel={handleRejectTestCall} footer={null} title="Test Call Incoming" closable={!testCallActive}>
            <div style={{ textAlign: 'center', margin: '32px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Test Call from Widget</div>
              {!testCallActive ? (
                <>
                  <Button type="primary" onClick={handleAcceptTestCall} style={{ marginRight: 12 }}>Accept</Button>
                  <Button danger onClick={handleRejectTestCall}>Reject</Button>
                </>
              ) : (
                <>
                  <div style={{ margin: '16px 0' }}><strong>Status:</strong> In Test Call</div>
                  <Button onClick={handleEndTestCall}>End Test Call</Button>
                </>
              )}
            </div>
          </Modal>
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
        <Tabs.TabPane tab={<span>Chats{Object.values(unreadChats).reduce((a, b) => a + b, 0) > 0 && <span style={{ background: '#2E73FF', color: '#fff', borderRadius: 8, padding: '0 8px', marginLeft: 6, fontSize: 12 }}>{Object.values(unreadChats).reduce((a, b) => a + b, 0)}</span>}</span>} key="chats">
          {/* Chat session list and chat view */}
          {!activeChat ? (
            <>
              <h3>Active Chat Sessions</h3>
              {chatSessions.length === 0 && <Empty description="No active chats" />}
              <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                {chatSessions.map((s, i) => (
                  <li key={s.sessionId} style={{ marginBottom: 12, background: '#f7fafd', padding: 12, borderRadius: 8, cursor: 'pointer' }} onClick={() => setActiveChat(s.sessionId)}>
                    <div><strong>Session:</strong> {s.sessionId}</div>
                    <div><strong>Visitor:</strong> {s.visitorId}</div>
                    <div><strong>Page:</strong> {s.pageUrl}</div>
                    <div><strong>Started:</strong> {s.startedAt && new Date(s.startedAt).toLocaleString()}</div>
                    {unreadChats[s.sessionId] > 0 && <span style={{ background: '#2E73FF', color: '#fff', borderRadius: 8, padding: '0 8px', marginLeft: 6, fontSize: 12 }}>{unreadChats[s.sessionId]}</span>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <Button onClick={() => setActiveChat(null)} style={{ marginBottom: 12 }}>Back to Chats</Button>
              <Card>
                <div style={{ marginBottom: 8 }}>
                  <strong>Session:</strong> {activeChat}
                </div>
                <div style={{ minHeight: 180, maxHeight: 220, overflowY: 'auto', background: '#fff', borderRadius: 12, marginBottom: 12, padding: 12 }}>
                  {(chatMessages[activeChat] || []).map((msg, i) => (
                    <div key={i} style={{ textAlign: msg.from === 'agent' ? 'right' : 'left', margin: '8px 0' }}>
                      <span style={{
                        display: 'inline-block',
                        background: msg.from === 'agent' ? '#2E73FF' : '#e8f1ff',
                        color: msg.from === 'agent' ? '#fff' : '#222',
                        borderRadius: 12,
                        padding: '6px 14px',
                        maxWidth: 220,
                        fontWeight: 500
                      }}>
                        {msg.message}
                      </span>
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                  {visitorTyping[activeChat] && (
                    <div style={{ textAlign: 'right', margin: '8px 0' }}>
                      <span style={{
                        display: 'inline-block',
                        background: '#2E73FF',
                        color: '#fff',
                        borderRadius: 12,
                        padding: '6px 14px',
                        maxWidth: 220,
                        fontWeight: 500,
                        fontStyle: 'italic',
                        opacity: 0.7
                      }}>
                        Visitor is typing...
                      </span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input
                    value={chatInput}
                    onChange={handleAgentInput}
                    onPressEnter={handleSendChat}
                    placeholder="Type your message..."
                    style={{ flex: 1 }}
                  />
                  <Button
                    icon={<SendOutlined />}
                    type="primary"
                    onClick={handleSendChat}
                    disabled={!chatInput}
                  />
                </div>
              </Card>
            </>
          )}
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
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Tag color={chatOnline ? 'green' : 'red'}>{chatOnline ? 'Chat Online' : 'Chat Offline'}</Tag>
      </div>
      {webrtcState === 'connecting' && <div style={{ background: '#e8f1ff', color: '#2E73FF', fontWeight: 600, fontSize: 15, padding: '8px 0', textAlign: 'center', borderRadius: 8, margin: '8px 0 0 0' }}>Connecting audio...</div>}
      {webrtcState === 'connected' && <div style={{ background: '#e8f1ff', color: '#1CC88A', fontWeight: 600, fontSize: 15, padding: '8px 0', textAlign: 'center', borderRadius: 8, margin: '8px 0 0 0' }}>Live audio with visitor</div>}
      <audio ref={remoteAudioRef} autoPlay style={{ display: remoteStream ? 'block' : 'none', width: '100%' }} />
      {!remoteStream && webrtcState === 'connected' && (
        <div style={{ color: '#E74A3B', fontWeight: 600, textAlign: 'center', marginTop: 8 }}>No remote audio received. Check widget mic and permissions.</div>
      )}
      <Button onClick={() => {
        if (localStream) {
          localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        }
      }} style={{ marginLeft: 8 }}>{localStream && localStream.getAudioTracks()[0]?.enabled ? 'Mute' : 'Unmute'}</Button>
      <audio ref={audioRef} src={notificationSound} preload="auto" style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
        <img src={logoLight} alt="Calldock Logo" style={{ width: 56, height: 56, marginBottom: 8 }} />
      </div>
    </DashboardLayout>
  );
} 