import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, Row, Col, Table, Button, Input, Tag, Form, Select, message, Modal, Empty, Tabs } from 'antd';
import { io, Socket } from 'socket.io-client';
import { SoundOutlined, PauseCircleOutlined, SwapOutlined, UserSwitchOutlined, BellOutlined, PhoneOutlined, ClockCircleOutlined, CloseCircleOutlined, SendOutlined, CheckCircleOutlined, TagOutlined, AudioOutlined, AudioMutedOutlined, FormOutlined } from '@ant-design/icons'; // For agent controls and notifications
import logoLight from '/logo-light.png';
import logoDark from '/logo-dark.png';
import { useLocation, useNavigate } from 'react-router-dom';
import notificationSound from '/notification.mp3';
import ChatSessionsLayout from './ChatSessionsLayout';
import { getBackendUrl, getSocketUrl } from './config';

const API_URL = `${getBackendUrl()}/api/widget`;
const SOCKET_URL = getSocketUrl();
const DISPOSITIONS = [
  'Resolved', 'Escalated', 'Follow-up required', 'Wrong number', 'Spam / Abuse', 'Other',
];
const TAG_OPTIONS = [
  '#VIP', '#complaint', '#technical', '#pricing', '#followup', '#sales', '#support', '#escalated', '#spam', '#other'
];

export default function AgentDashboard({ agentToken, companyUuid, agentUsername, onLogout }: {
  agentToken: string;
  companyUuid: string;
  agentUsername: string;
  onLogout: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
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
  // Add flag to prevent automatic call acceptance
  const [callManuallyAccepted, setCallManuallyAccepted] = useState(false);
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
  // Add state for active calls
  const [activeCalls, setActiveCalls] = useState([]);
  const [agentUuid, setAgentUuid] = useState<string | null>(null);
  const [queueLength, setQueueLength] = useState<number>(0);

  // Safe filter utility to prevent xe.filter crashes
  const safeFilter = (value: any, predicate: (item: any) => boolean) => {
    if (!Array.isArray(value)) return [];
    return value.filter(predicate);
  };

  // Fetch agent UUID and active calls
  const fetchAgentData = async () => {
    try {
      // Get agent status directly
      const agentResponse = await fetch(`${API_URL}/agent/status?username=${agentUsername}`);
      const agentData = await agentResponse.json();
      
      if (agentData.success) {
        setAgentUuid(agentData.agent.id);
        
        // Then fetch active calls for this agent
        const callsResponse = await fetch(`${API_URL}/calls/active?username=${agentUsername}`);
        const callsData = await callsResponse.json();
        if (callsData.success) {
          setActiveCalls(callsData.calls || []);
          console.log('Active calls for agent:', callsData.calls);
        }
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
    }
  };

  // Fetch agent data on mount and periodically
  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [companyUuid, agentUsername]);

  // Poll agent online status and queue length every 10s
  useEffect(() => {
    if (!companyUuid || !agentUsername) return;
    let isMounted = true;
    const fetchStatus = () => {
      fetch(`${API_URL}/agent/status?username=${agentUsername}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => { 
          if (isMounted && data.success) {
            setChatOnline(data.agent.status === 'online' && data.agent.availability === 'online');
          }
        })
        .catch(() => { if (isMounted) setChatOnline(false); });
    };
    
    const fetchQueueLength = () => {
      fetch(`${getBackendUrl()}/api/widget/queue/${companyUuid}`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.success) {
            setQueueLength(data.queueLength || 0);
          }
        })
        .catch(() => { if (isMounted) setQueueLength(0); });
    };
    
    fetchStatus();
    fetchQueueLength();
    const statusInterval = setInterval(fetchStatus, 10000);
    const queueInterval = setInterval(fetchQueueLength, 5000); // Poll queue more frequently
    return () => { 
      clearInterval(statusInterval); 
      clearInterval(queueInterval); 
      isMounted = false; 
    };
  }, [companyUuid, agentUsername]);

  // Sync tab with URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Fetch call logs for this agent
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/call/logs/${companyUuid}`)
      .then(res => res.json())
      .then(logs => setCallLog(logs.filter(l => l.agent === agentUsername)))
      .finally(() => setLoading(false));
  }, [companyUuid, agentUsername]);

  // Debug callStatus changes
  useEffect(() => {
    console.log('callStatus changed to:', callStatus);
  }, [callStatus]);

  // Socket.IO setup
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('register-agent', { uuid: companyUuid, agentId: agentUsername });
    
    // Join agent-specific room for receiving calls
    socket.emit('join-room', { room: `agent-${agentUsername}` });
    console.log(`[AgentDashboard] Joined room: agent-${agentUsername}`);
    
    // Set agent status to online when connecting
    const setAgentOnline = async () => {
      try {
        // Find the agent UUID from the agents list
        const agentResponse = await fetch(`${API_URL}/agents/online?companyUuid=${companyUuid}`);
        const agentData = await agentResponse.json();
        const agent = agentData.agents?.find(a => a.username === agentUsername);
        
        if (agent) {
          await fetch(`${API_URL}/agent/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentUuid: agent.uuid,
              status: 'online',
              availability: 'online'
            })
          });
          console.log('[AgentDashboard] Agent status set to online');
        }
      } catch (error) {
        console.error('[AgentDashboard] Error setting agent online:', error);
      }
    };
    
    setAgentOnline();
    
    socket.on('incoming-call', (data) => {
      console.log('Received incoming-call event:', data);
      console.log('Setting callStatus to "Ringing"');
      setIncomingCall(data);
      setCallStatus('Ringing');
      setCallManuallyAccepted(false); // Reset manual acceptance flag for new call
      
      // Join the session room for WebRTC communication
      if (data.sessionId) {
        socket.emit('join-room', { room: `session-${data.sessionId}` });
        console.log('[AgentDashboard] Joined session room for WebRTC:', `session-${data.sessionId}`);
        
        // Also join the session room for form:push events
        socket.emit('join-room', { room: `session-${data.sessionId}` });
        console.log('[AgentDashboard] Joined session room for form:push:', `session-${data.sessionId}`);
        
        // Store the session ID for later use
        setIncomingCall(prev => prev ? { ...prev, sessionId: data.sessionId } : null);
      }
      
      console.log('callStatus should now be "Ringing"');
    });
    // Listen for chat events
    socket.on('chat:join', (data) => {
      setChatSessions(sessions => {
        if (sessions.some(s => s.sessionId === data.sessionId)) return sessions;
        // Create new chat session in backend
        const newSession = {
          companyId: companyUuid,
          sessionId: data.sessionId,
          visitorId: data.visitorId,
          pageUrl: data.pageUrl,
          startedAt: data.startedAt || new Date().toISOString()
        };
        fetch(`${getBackendUrl()}/api/chat-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSession)
        });
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
        // Create new chat session in backend for new messages
        const newSession = {
          companyId: companyUuid,
          sessionId: msg.sessionId,
          visitorId: `visitor-${msg.sessionId.slice(-4)}`,
          pageUrl: window.location.href,
          startedAt: new Date().toISOString()
        };
        fetch(`${getBackendUrl()}/api/chat-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSession)
        });
        return [...sessions, newSession];
      });
      if (activeChat !== msg.sessionId) {
        setUnreadChats(prev => ({ ...prev, [msg.sessionId]: (prev[msg.sessionId] || 0) + 1 }));
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      }
    });
    
    // Listen for form responses
    socket.on('form:response', (response) => {
      console.log('Agent received form response:', response);
      
      // Convert form response to chat message
      const formMessage = {
        sessionId: response.sessionId,
        message: `📋 **Form Submitted**\n${Object.entries(response.values).map(([field, value]) => `**${field}:** ${value}`).join('\n')}`,
        from: 'visitor',
        timestamp: response.timestamp,
        type: 'form-response',
        formData: response
      };
      
      setChatMessages(prev => {
        const arr = prev[response.sessionId] ? [...prev[response.sessionId]] : [];
        arr.push(formMessage);
        return { ...prev, [response.sessionId]: arr };
      });
      
      // Show notification
      message.success('Visitor submitted a form!');
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
      // Set agent status to offline when disconnecting
      const setAgentOffline = async () => {
        try {
          const agentResponse = await fetch(`${API_URL}/agents/online?companyUuid=${companyUuid}`);
          const agentData = await agentResponse.json();
          const agent = agentData.agents?.find(a => a.username === agentUsername);
          
          if (agent) {
            await fetch(`${API_URL}/agent/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentUuid: agent.uuid,
                status: 'offline'
              })
            });
            console.log('[AgentDashboard] Agent status set to offline');
          }
        } catch (error) {
          console.error('[AgentDashboard] Error setting agent offline:', error);
        }
      };
      
      setAgentOffline();
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

  const processNextCallInQueue = async (companyUuid: string) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/widget/queue/${companyUuid}`);
      const data = await response.json();
      
      if (data.success && data.queueLength > 0) {
        console.log('[AgentDashboard] Processing next call in queue:', data.queue[0]);
        
        // Get the next call from queue
        const nextCall = data.queue[0];
        
        // Route the next call
        const routeResponse = await fetch(`${getBackendUrl()}/api/widget/route-call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyUuid: nextCall.companyUuid,
            visitorId: nextCall.visitorId,
            pageUrl: nextCall.pageUrl,
            callType: nextCall.callType
          })
        });
        
        const routeData = await routeResponse.json();
        if (routeData.success) {
          console.log('[AgentDashboard] Next call in queue routed successfully');
        }
      }
    } catch (error) {
      console.error('[AgentDashboard] Error processing queue:', error);
    }
  };

  // Accept/Reject/End Call
  const handleCallAction = (action) => {
    console.log('handleCallAction called with action:', action);
    console.log('Current callStatus:', callStatus);
    console.log('incomingCall:', incomingCall);
    console.log('callManuallyAccepted:', callManuallyAccepted);
    
    if (!incomingCall || !socketRef.current) {
      console.log('Early return: no incomingCall or socketRef');
      return;
    }
    
    if (action === 'end') {
      console.log('Ending call - setting status to Wrap-up');
      const sessionId = incomingCall?.fromSocketId || 'unknown-session';
      setCallStatus('Wrap-up');
      setWrapUp(true);
      
      // Call the backend to decrement agent's currentCalls
      fetch(`${getBackendUrl()}/api/widget/agent/end-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: agentUsername,
          sessionId: sessionId
        })
      }).then(res => {
        if (res.ok) {
          console.log('Agent currentCalls decremented successfully');
        } else {
          console.error('Failed to decrement agent currentCalls');
        }
      }).catch(error => {
        console.error('Error calling end-call endpoint:', error);
      });
      
      // Process next call in queue when agent finishes
      if (incomingCall?.uuid) {
        processNextCallInQueue(incomingCall.uuid);
      }
      
      // Store sessionId in a ref or state before clearing incomingCall
      setIncomingCall(prev => {
        if (prev) {
          // Store sessionId for wrap-up modal
          sessionStorage.setItem('lastCallSessionId', prev.fromSocketId || 'unknown-session');
        }
        return null;
      });
      setCallStart(null);
      setCallManuallyAccepted(false);
      return;
    }
    
    // Only allow accept/reject if call is in Ringing state and not already manually accepted
    if (callStatus !== 'Ringing' || callManuallyAccepted) {
      console.log('Call not in Ringing state or already manually accepted, ignoring action:', action);
      return;
    }
    
    console.log('Emitting', `${action}-call`, {
      uuid: companyUuid,
      agentId: agentUsername,
      fromSocketId: incomingCall.fromSocketId,
    });
    
    socketRef.current.emit(`${action}-call`, {
      uuid: companyUuid,
      agentId: agentUsername,
      fromSocketId: incomingCall.fromSocketId,
    });
    
    if (action === 'accept') {
      console.log('Setting callStatus to "In Call" and marking as manually accepted');
      setCallStatus('In Call');
      setCallStart(new Date());
      setWrapUp(false);
      setCallManuallyAccepted(true);
      
      // Create a chat session for this call so form pushes work
      if (incomingCall?.fromSocketId) {
        // Use the widget's session ID instead of creating a new one
        // The widget creates its own session ID when it enters chat mode
        const chatSessionId = incomingCall.fromSocketId; // Use the widget's session ID directly
        
        // Check if this session already exists in our chat sessions
        const existingSession = chatSessions.find(s => s.sessionId === chatSessionId);
        
        if (!existingSession) {
          // Create new session only if it doesn't exist
          const newSession = {
            companyId: companyUuid,
            sessionId: chatSessionId,
            visitorId: `visitor-${chatSessionId.slice(-4)}`,
            pageUrl: window.location.href,
            startedAt: new Date().toISOString()
          };
          
          // Create chat session in backend
          fetch(`${getBackendUrl()}/api/chat-sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSession)
          });
          
          // Add to local chat sessions
          setChatSessions(sessions => {
            if (sessions.some(s => s.sessionId === chatSessionId)) return sessions;
            return [...sessions, newSession];
          });
        }
        
        // Set as active chat
        setActiveChat(chatSessionId);
        
        // Join the chat room
        if (socketRef.current) {
          socketRef.current.emit('chat:join', {
            sessionId: chatSessionId,
            companyUuid,
            visitorId: `visitor-${chatSessionId.slice(-4)}`,
            pageUrl: window.location.href
          });
        }
      }
    } else {
      console.log('Setting callStatus to "Idle"');
      setCallStatus('Idle');
      setIncomingCall(null);
      setCallStart(null);
      setCallManuallyAccepted(false);
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
    const sessionId = sessionStorage.getItem('lastCallSessionId') || 'unknown-session';
    const log = {
      companyUuid,
      agent: agentUsername,
      notes,
      disposition: disposition === 'Other' ? customDisposition : disposition,
      duration: callTimer,
      sessionId: sessionId,
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
    // Clear stored sessionId
    sessionStorage.removeItem('lastCallSessionId');
    message.success('Call log saved!');
  };

  const filteredLogs = safeFilter(callLog, log =>
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
      pc = new RTCPeerConnection({ 
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: [
              "stun:102.68.86.104:3478",
              "turn:102.68.86.104:3478?transport=udp",
              "turn:102.68.86.104:3478?transport=tcp"
            ],
            username: "mindfirm",
            credential: "superSecret123"
          }
        ]
      });
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
          socketRef.current.emit('webrtc-ice-candidate', { 
            sessionId: incomingCall.sessionId, 
            candidate: event.candidate 
          });
        }
      };
      
      // Handle offer from widget - FIXED VERSION
      const handleOffer = async ({ type, sdp, from, sessionId }) => {
        try {
          console.log('[Agent] Received WebRTC offer:', { type, sdpLength: sdp?.length, from, sessionId });
          if (!type || !sdp) return console.warn('[Agent] Offer missing type or sdp');
          
          // create peer connection if not exists
          if (!pc) {
            pc = new RTCPeerConnection({ 
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                {
                  urls: [
                    "stun:102.68.86.104:3478",
                    "turn:102.68.86.104:3478?transport=udp",
                    "turn:102.68.86.104:3478?transport=tcp"
                  ],
                  username: "mindfirm",
                  credential: "superSecret123"
                }
              ]
            });
            peerRef.current = pc;
            
            // Get agent microphone and add to connection
            try {
              const agentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              setLocalStream(agentStream);
              console.log('[Agent] Agent microphone obtained:', agentStream.getTracks());
              agentStream.getTracks().forEach(track => pc.addTrack(track, agentStream));
            } catch (err) {
              console.error('[Agent] Failed to get agent microphone:', err);
            }
            
            // Handle incoming audio from visitor
            pc.ontrack = (evt) => {
              console.log('[Agent] Received remote stream from caller:', evt.streams[0]);
              setRemoteStream(evt.streams[0]);
              
              // Create and attach audio element for playback
              const audioEl = document.getElementById('remote-audio-agent') || document.createElement('audio');
              audioEl.id = 'remote-audio-agent';
              audioEl.autoplay = true;
              audioEl.playsInline = true;
              audioEl.srcObject = evt.streams[0];
              if (!document.getElementById('remote-audio-agent')) document.body.appendChild(audioEl);
              
              console.log('[Agent] Remote audio element created and attached');
            };
            
            // Send ICE candidates to visitor
            pc.onicecandidate = (ev) => {
              if (ev.candidate) {
                console.log('[Agent] Sending ICE candidate to visitor:', ev.candidate);
                socketRef.current.emit('webrtc-ice-candidate', {
                  sessionId: sessionId,
                  from: agentUsername,
                  to: from,
                  candidate: {
                    candidate: ev.candidate.candidate,
                    sdpMid: ev.candidate.sdpMid,
                    sdpMLineIndex: ev.candidate.sdpMLineIndex
                  }
                });
              }
            };
          }
          
          // Set remote description and create answer
          const remoteOffer = new RTCSessionDescription({ type, sdp });
          await pc.setRemoteDescription(remoteOffer);
          console.log('[Agent] Remote description set (offer)');
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('[Agent] Created answer, sending back');
          
          socketRef.current.emit('webrtc-answer', { 
            sessionId: sessionId,
            from: agentUsername,
            to: from,
            type: answer.type,
            sdp: answer.sdp
          });
        } catch (err) {
          console.error('[Agent] Error handling webrtc-offer:', err);
        }
      };
      
      // Handle ICE from widget - FIXED VERSION
      const handleIceCandidate = async ({ candidate, sessionId, from }) => {
        console.log('[Agent] Received ICE candidate from visitor:', { candidate, sessionId, from });
        if (pc && pc.signalingState !== 'closed') {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[Agent] Added ICE candidate from visitor');
          } catch (err) {
            console.error('[Agent] Error adding ICE candidate:', err);
          }
        } else {
          console.warn('[Agent] Tried to addIceCandidate on closed connection');
        }
      };
      
      // Add event listeners
      socketRef.current.off('webrtc-offer'); // avoid duplicate handlers
      socketRef.current.on('webrtc-offer', handleOffer);
      socketRef.current.off('webrtc-ice-candidate');
      socketRef.current.on('webrtc-ice-candidate', handleIceCandidate);
      
      // Store cleanup function
      cleanup = () => {
        socketRef.current.off('webrtc-offer', handleOffer);
        socketRef.current.off('webrtc-ice-candidate', handleIceCandidate);
        if (pc) {
          console.log('Agent: Closing RTCPeerConnection');
          pc.close();
          pc = null;
        }
        setWebrtcState('idle');
        setRemoteStream(null);
        setLocalStream(null);
      };
    }
    
    // Cleanup function
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [callStatus === 'In Call', incomingCall]);

  // Scroll to bottom on new chat message
  useEffect(() => {
    if (activeChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChat]);

  // Send agent chat message
  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeChat || !socketRef.current) return;
    const msg = {
      sessionId: activeChat,
      message: chatInput.trim(),
      from: 'agent',
      timestamp: new Date().toISOString()
    };
    // Persist to backend
    const companyId = companyUuid; // Use companyUuid
    await fetch(`${getBackendUrl()}/api/chat-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        sessionId: activeChat,
        from: 'agent',
        message: chatInput.trim(),
        timestamp: msg.timestamp
      })
    });
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

  // Fetch chat messages when activeChat changes
  useEffect(() => {
    if (!activeChat) return;
    fetch(`${getBackendUrl()}/api/chat-messages?companyId=${companyUuid}&sessionId=${activeChat}`)
      .then(res => res.json())
      .then(messages => {
        setChatMessages(prev => ({ ...prev, [activeChat]: messages }));
      });
      
    // Also fetch form responses
    fetch(`${getBackendUrl()}/api/form-response?companyId=${companyUuid}&sessionId=${activeChat}`)
      .then(res => res.json())
      .then(responses => {
        // Convert form responses to chat messages
        const formMessages = responses.map(response => ({
          sessionId: response.sessionId,
          message: `📋 **Form Submitted**\n${Object.entries(response.values).map(([field, value]) => `**${field}:** ${value}`).join('\n')}`,
          from: 'visitor',
          timestamp: response.timestamp,
          type: 'form-response',
          formData: response
        }));
        
        // Combine with existing messages
        setChatMessages(prev => {
          const existingMessages = prev[activeChat] || [];
          const allMessages = [...existingMessages, ...formMessages].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          return { ...prev, [activeChat]: allMessages };
        });
      });
  }, [activeChat]);

  // Escalation state (frontend only)
  const [escalatedChats, setEscalatedChats] = useState<Record<string, boolean>>({});
  // Chat escalation handler
  const handleEscalateChat = async (sessionId: string) => {
    await fetch(`${getBackendUrl()}/api/chat-sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalated: true })
    });
    setEscalatedChats(prev => ({ ...prev, [sessionId]: true }));
    message.success('Chat escalated to supervisor');
  };

  // Chat rating state (frontend only)
  const [chatRatings, setChatRatings] = useState<Record<string, number>>({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingRatingSession, setPendingRatingSession] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  // Canned responses state
  const companyId = companyUuid; // Use companyUuid
  const [cannedResponses, setCannedResponses] = useState([]);

  // Fetch canned responses on mount
  useEffect(() => {
    fetch(`${getBackendUrl()}/api/canned-responses?companyId=${companyId}`)
      .then(res => res.json())
      .then(setCannedResponses);
  }, []);

  // Fetch chat sessions on mount
  useEffect(() => {
    fetch(`${getBackendUrl()}/api/chat-sessions?companyId=${companyId}`)
      .then(res => res.json())
      .then(sessions => {
        setChatSessions(sessions);
        // Initialize chat messages for existing sessions
        const messages = {};
        sessions.forEach(session => {
          messages[session.sessionId] = [];
        });
        setChatMessages(messages);
      });
  }, []);

  // Simulate ending a chat and requesting feedback
  const handleEndChat = (sessionId: string) => {
    setPendingRatingSession(sessionId);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!pendingRatingSession || ratingValue === 0) return;
    await fetch(`${getBackendUrl()}/api/chat-sessions/${pendingRatingSession}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: ratingValue })
    });
    setChatRatings(prev => ({ ...prev, [pendingRatingSession]: ratingValue }));
    setShowRatingModal(false);
    setPendingRatingSession(null);
    setRatingValue(0);
    message.success('Thank you for your feedback!');
  };

  const isDark = document.body.classList.contains('dark');
  return (
    <DashboardLayout 
      userType="agent"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
    >
      <Modal
        open={callStatus === 'Ringing'}
        title={<span style={{ fontWeight: 700 }}>Incoming Call</span>}
        footer={null}
        closable={false}
        centered
        style={{ borderRadius: 16 }}
      >
        <p>You have an incoming call!</p>
        <p style={{ fontSize: 12, color: '#666' }}>Debug: callStatus = "{callStatus}", Modal open = {callStatus === 'Ringing' ? 'true' : 'false'}</p>
        <Button type="primary" onClick={() => handleCallAction('accept')} style={{ marginRight: 12, borderRadius: 8, fontWeight: 600 }}>Accept</Button>
        <Button danger onClick={() => handleCallAction('reject')} style={{ borderRadius: 8, fontWeight: 600 }}>Reject</Button>
      </Modal>

      {/* Wrap-up Modal for Call Disposition and Tagging */}
      <Modal
        open={wrapUp}
        title={<span style={{ fontWeight: 700 }}>Call Wrap-up</span>}
        onCancel={() => {
          setWrapUp(false);
          setCallStatus('Idle');
        }}
        onOk={handleSaveLog}
        okText="Save Call Log"
        cancelText="Skip"
        centered
        style={{ borderRadius: 16 }}
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Call Duration: {callTimer}</label>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Disposition:</label>
          <Select
            value={disposition}
            onChange={setDisposition}
            style={{ width: '100%' }}
            placeholder="Select disposition"
            options={[
              { value: 'Answered', label: 'Answered' },
              { value: 'Missed', label: 'Missed' },
              { value: 'Busy', label: 'Busy' },
              { value: 'No Answer', label: 'No Answer' },
              { value: 'Other', label: 'Other' }
            ]}
          />
          {disposition === 'Other' && (
            <Input
              value={customDisposition}
              onChange={(e) => setCustomDisposition(e.target.value)}
              placeholder="Specify disposition"
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Tags:</label>
          <Select
            mode="tags"
            value={tags}
            onChange={setTags}
            style={{ width: '100%' }}
            placeholder="Add tags"
            options={[
              { value: 'urgent', label: 'Urgent' },
              { value: 'follow-up', label: 'Follow-up' },
              { value: 'sale', label: 'Sale' },
              { value: 'support', label: 'Support' },
              { value: 'complaint', label: 'Complaint' }
            ]}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Notes:</label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add call notes..."
            rows={4}
          />
        </div>
      </Modal>
      
      {/* Integrated Header with Logo and Welcome */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 32,
        padding: '24px 32px',
        background: 'linear-gradient(135deg, #2E73FF 0%, #00e6ef 100%)',
        borderRadius: 24,
        boxShadow: '0 8px 32px rgba(46, 115, 255, 0.15)',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.15)', 
            borderRadius: 16, 
            padding: 12,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <img src={logoLight} alt="CallDocker Logo" style={{ width: 48, height: 48, filter: 'brightness(0) invert(1)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 4 }}>Agent Dashboard</div>
            <div style={{ fontSize: 16, opacity: 0.9 }}>Welcome back, {agentUsername}</div>
          </div>
        </div>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: 12, 
          padding: '8px 16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 2 }}>Status</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{callStatus}</div>
        </div>
      </div>

      {/* Call Management Interface - Only show when in call */}
      {callStatus === 'In Call' && (
        <Card style={{ 
          marginBottom: 32, 
          borderRadius: 20, 
          boxShadow: '0 8px 32px rgba(46, 115, 255, 0.15)',
          background: 'linear-gradient(135deg, #2E73FF 0%, #00e6ef 100%)',
          color: '#fff',
          border: 'none'
        }}>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Active Call</div>
                <div style={{ fontSize: 16, opacity: 0.9 }}>Duration: {callTimer}</div>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                borderRadius: 12, 
                padding: '8px 16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 2 }}>Status</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{webrtcState === 'connected' ? 'Connected' : 'Connecting...'}</div>
              </div>
            </div>
            
            {/* Call Control Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Button 
                type="primary" 
                icon={localStream && localStream.getAudioTracks()[0]?.enabled ? <AudioMutedOutlined /> : <AudioOutlined />}
                onClick={() => {
                  if (localStream) {
                    localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
                  }
                }}
                style={{ 
                  borderRadius: 12, 
                  fontWeight: 600, 
                  height: 48,
                  background: localStream && localStream.getAudioTracks()[0]?.enabled ? 'rgba(255, 255, 255, 0.2)' : '#fff',
                  color: localStream && localStream.getAudioTracks()[0]?.enabled ? '#fff' : '#2E73FF',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {localStream && localStream.getAudioTracks()[0]?.enabled ? 'Mute' : 'Unmute'}
              </Button>
              
              <Button 
                icon={<PauseCircleOutlined />}
                onClick={() => {
                  // TODO: Implement hold functionality
                  message.info('Hold functionality coming soon');
                }}
                style={{ 
                  borderRadius: 12, 
                  fontWeight: 600, 
                  height: 48,
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                Hold
              </Button>
              
              <Button 
                danger 
                icon={<CloseCircleOutlined />}
                onClick={() => handleCallAction('end')}
                style={{ 
                  borderRadius: 12, 
                  fontWeight: 600, 
                  height: 48,
                  background: 'rgba(220, 53, 69, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                End Call
              </Button>
            </div>
            
            {/* Form Push Section */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              borderRadius: 16, 
              padding: 20,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Push Forms to Visitor</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button 
                  icon={<FormOutlined />}
                  onClick={() => {
                    // Push email form
                    const formData = {
                      companyId: companyUuid,
                      sessionId: incomingCall?.sessionId || activeChat || 'demo-session', // Use call session ID first
                      from: agentUsername,
                      type: 'email',
                      fields: [
                        { label: 'Email Address', type: 'email', required: true }
                      ]
                    };
                    console.log('Pushing email form:', formData);
                    fetch(`${getBackendUrl()}/api/form-push`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formData)
                    })
                    .then(res => {
                      if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                      }
                      return res.json();
                    })
                    .then(data => {
                      console.log('Form push successful:', data);
                      message.success('Email form pushed to visitor');
                    })
                    .catch(error => {
                      console.error('Form push failed:', error);
                      message.error('Failed to push form: ' + error.message);
                    });
                  }}
                  style={{ 
                    borderRadius: 8, 
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Request Email
                </Button>
                
                <Button 
                  icon={<FormOutlined />}
                  onClick={() => {
                    // Push phone form
                    const formData = {
                      companyId: companyUuid,
                      sessionId: incomingCall?.sessionId || activeChat || 'demo-session', // Use call session ID first
                      from: agentUsername,
                      type: 'phone',
                      fields: [
                        { label: 'Phone Number', type: 'tel', required: true }
                      ]
                    };
                    console.log('Pushing phone form:', formData);
                    fetch(`${getBackendUrl()}/api/form-push`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formData)
                    })
                    .then(res => {
                      if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                      }
                      return res.json();
                    })
                    .then(data => {
                      console.log('Form push successful:', data);
                      message.success('Phone form pushed to visitor');
                    })
                    .catch(error => {
                      console.error('Form push failed:', error);
                      message.error('Failed to push form: ' + error.message);
                    });
                  }}
                  style={{ 
                    borderRadius: 8, 
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Request Phone
                </Button>
                
                <Button 
                  icon={<FormOutlined />}
                  onClick={() => {
                    // Push custom form
                    const formData = {
                      companyId: companyUuid,
                      sessionId: incomingCall?.sessionId || activeChat || 'demo-session', // Use call session ID first
                      from: agentUsername,
                      type: 'custom',
                      fields: [
                        { label: 'Full Name', type: 'text', required: true },
                        { label: 'Company', type: 'text', required: false },
                        { label: 'How can we help?', type: 'textarea', required: true }
                      ]
                    };
                    console.log('Pushing custom form:', formData);
                    fetch(`${getBackendUrl()}/api/form-push`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formData)
                    })
                    .then(res => {
                      if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                      }
                      return res.json();
                    })
                    .then(data => {
                      console.log('Form push successful:', data);
                      message.success('Custom form pushed to visitor');
                    })
                    .catch(error => {
                      console.error('Form push failed:', error);
                      message.error('Failed to push form: ' + error.message);
                    });
                  }}
                  style={{ 
                    borderRadius: 8, 
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Custom Form
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content by Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* Metric Cards */}
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
                <div style={{ fontSize: 28, fontWeight: 900 }}>{callLog.length}</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #1CC88A22', background: 'linear-gradient(120deg, #1CC88A 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <CheckCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Answered Calls</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{safeFilter(callLog, l => (l.disposition || l.status || '').toLowerCase().includes('answer') || (l.status || '').toLowerCase() === 'accepted').length}</div>
              </div>
            </Card>
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #E74A3B22', background: 'linear-gradient(120deg, #E74A3B 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <CloseCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Missed Calls</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{safeFilter(callLog, l => (l.disposition || l.status || '').toLowerCase().includes('miss') || (l.status || '').toLowerCase() === 'rejected').length}</div>
              </div>
            </Card>
            
            <Card className="card" style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <PhoneOutlined style={{ fontSize: 36, color: '#fff' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Active Calls</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{activeCalls.length}</div>
              </div>
            </Card>
          </div>
        </>
      )}
      {activeTab === 'calls' && (
        <>
          {/* Call History Section */}
          <Row gutter={[32, 32]} style={{ marginBottom: 32 }}>
            <Col xs={24} md={12}>
              <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 24 }} title={<span style={{ fontWeight: 700, fontSize: 18 }}>Call History</span>}>
                <Input.Search
                  placeholder="Search notes, tags, agent..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ marginBottom: 16, maxWidth: 320, borderRadius: 8 }}
                  allowClear
                />
                <Table columns={columns} dataSource={filteredLogs} rowKey={(_, i) => i} loading={loading} pagination={{ pageSize: 8 }} style={{ borderRadius: 12, overflow: 'hidden' }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', padding: 24 }} title={<span style={{ fontWeight: 700, fontSize: 18 }}>Mini-CRM Timeline</span>}>
                <Input
                  placeholder="Session ID for timeline"
                  value={timelineSession}
                  onChange={e => setTimelineSession(e.target.value)}
                  style={{ marginBottom: 12, borderRadius: 8 }}
                />
                <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                  {safeFilter(callLog, log => log.sessionId === timelineSession).length === 0 && <li style={{ color: '#888' }}>(No interactions yet)</li>}
                  {safeFilter(callLog, log => log.sessionId === timelineSession).map((log, i) => (
                    <li key={i} style={{ marginBottom: 12, background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Time: {log.time}</div>
                      <div style={{ marginBottom: 4 }}>Disposition: {log.disposition}</div>
                      <div style={{ marginBottom: 4 }}>Tags: {log.tags?.map((tag) => <Tag key={tag} style={{ borderRadius: 4 }}>{tag}</Tag>)}</div>
                      <div>Notes: <pre style={{ margin: 0, fontSize: 14 }}>{log.notes}</pre></div>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          </Row>
        </>
      )}
      {activeTab === 'chat' && (
        <>
          <ChatSessionsLayout
            sessions={chatSessions.map(s => ({
              ...s,
              unreadCount: unreadChats[s.sessionId] || 0,
              lastMessage: (chatMessages[s.sessionId] || []).slice(-1)[0]?.message || '',
              lastTimestamp: (chatMessages[s.sessionId] || []).slice(-1)[0]?.timestamp ? new Date((chatMessages[s.sessionId] || []).slice(-1)[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              status: unreadChats[s.sessionId] > 0 ? 'unread' : (chatMessages[s.sessionId]?.some(m => m.from === agentUsername) ? 'replied' : 'contacted'),
              visitorInfo: {
                name: s.visitorId,
                email: `visitor-${s.sessionId.slice(-4)}@example.com`, // Demo email
                phone: `+1-555-${s.sessionId.slice(-4)}`, // Demo phone
                location: 'New York, NY', // Demo location
                browser: 'Chrome 120.0', // Demo browser
                device: 'Desktop', // Demo device
                previousChats: Math.floor(Math.random() * 5), // Demo previous chats
                totalTime: `${Math.floor(Math.random() * 60)}m ${Math.floor(Math.random() * 60)}s`, // Demo total time
              },
              assignedAgent: agentUsername, // For demo, assign all to current agent
              escalated: escalatedChats[s.sessionId] || false,
              rating: chatRatings[s.sessionId] || null,
            }))}
            activeChat={activeChat}
            messages={chatMessages}
            onSelectSession={setActiveChat}
            onSendMessage={msg => { if (msg.trim()) { handleSendChat(); } }}
            chatInput={chatInput}
            setChatInput={setChatInput}
            agentUsername={agentUsername}
            onEscalateChat={handleEscalateChat}
            cannedResponses={cannedResponses}
          />
          {/* End Chat & Rate Modal (for demo) */}
          <Modal open={showRatingModal} onCancel={() => setShowRatingModal(false)} onOk={handleSubmitRating} okText="Submit Rating" title="Rate this Chat" style={{ borderRadius: 16 }} okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}>
            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>How would you rate your chat experience?</span>
              <div style={{ marginTop: 16 }}>
                {[1,2,3,4,5].map(star => (
                  <span key={star} style={{ fontSize: 32, color: ratingValue >= star ? '#FFD700' : '#e0e0e0', cursor: 'pointer' }} onClick={() => setRatingValue(star)}>&#9733;</span>
                ))}
              </div>
            </div>
          </Modal>
          <Button onClick={() => {
            if (activeChat) {
              handleEndChat(activeChat);
            }
          }} style={{ position: 'absolute', right: 32, bottom: 32, borderRadius: 8, fontWeight: 600, zIndex: 10 }}>End Chat & Rate (Demo)</Button>
        </>
      )}
      {activeTab === 'notifications' && (
        <>
          {/* Notifications Section */}
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #F6C23E22', padding: 24 }} title={<span style={{ fontWeight: 700, fontSize: 18 }}>Notifications</span>} extra={<BellOutlined style={{ fontSize: 20, color: '#F6C23E' }} />}>
            {/* TODO: Connect to real notifications */}
            <ul style={{ paddingLeft: 16, fontSize: 16, color: '#213547' }}>
              <li>Incoming call from visitor (demo)</li>
              <li>Missed call (demo)</li>
            </ul>
          </Card>
        </>
      )}
      {activeTab === 'settings' && (
        <>
          {/* Settings/Profile Section */}
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', padding: 24 }} title={<span style={{ fontWeight: 700, fontSize: 18 }}>Audio Device Selection / Settings</span>}>
                {/* TODO: Implement audio device selection/settings */}
                <Button style={{ borderRadius: 8, fontWeight: 600, marginRight: 8 }} onClick={() => { /* TODO */ }}>Select Microphone</Button>
                <Button style={{ borderRadius: 8, fontWeight: 600 }} onClick={() => { /* TODO */ }}>Select Speaker</Button>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card style={{ borderRadius: 20, boxShadow: '0 4px 24px #00e6ef22', padding: 24 }} title={<span style={{ fontWeight: 700, fontSize: 18 }}>Agent Profile / Settings</span>}>
                {/* TODO: Implement agent profile/settings management */}
                <Button type="primary" style={{ borderRadius: 8, fontWeight: 600 }} onClick={() => { /* TODO */ }}>Edit Profile</Button>
              </Card>
            </Col>
          </Row>
        </>
      )}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Tag color={chatOnline ? 'green' : 'red'} style={{ borderRadius: 8, fontWeight: 600 }}>{chatOnline ? 'Chat Online' : 'Chat Offline'}</Tag>
      </div>
      {webrtcState === 'connecting' && <div style={{ background: '#e8f1ff', color: '#2E73FF', fontWeight: 600, fontSize: 15, padding: '8px 0', textAlign: 'center', borderRadius: 8, margin: '8px 0 0 0' }}>Connecting audio...</div>}
      {webrtcState === 'connected' && <div style={{ background: '#e8f1ff', color: '#1CC88A', fontWeight: 600, fontSize: 15, padding: '8px 0', textAlign: 'center', borderRadius: 8, margin: '8px 0 0 0' }}>Live audio with visitor</div>}
      <audio ref={remoteAudioRef} autoPlay style={{ display: remoteStream ? 'block' : 'none', width: '100%' }} />
      {!remoteStream && webrtcState === 'connected' && (
        <div style={{ color: '#E74A3B', fontWeight: 600, textAlign: 'center', marginTop: 8 }}>No remote audio received. Check widget mic and permissions.</div>
      )}
      <audio ref={audioRef} src={notificationSound} preload="auto" style={{ display: 'none' }} />
    </DashboardLayout>
  );
} 
