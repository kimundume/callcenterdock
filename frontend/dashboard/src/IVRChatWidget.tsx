import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input, Tooltip, Spin } from 'antd';
import { AudioOutlined, SendOutlined, CloseOutlined, SoundOutlined, LoadingOutlined, RobotOutlined, UserOutlined, AudioMutedOutlined, PlayCircleOutlined, StopOutlined, SmileOutlined, PhoneOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import logoLight from '/logo-light.png';
import logoDark from '/logo-dark.png';
import { v4 as uuidv4 } from 'uuid';

const SOCKET_URL = 'http://localhost:5000';

const demoIVR = [
  {
    prompt: 'Welcome to CallDocker! Press 1 for Sales, 2 for Support.',
    audio: null, // Optionally add audio file URL
    routes: {
      '1': { prompt: 'Connecting you to Sales...', audio: null },
      '2': { prompt: 'Connecting you to Support...', audio: null },
      'sales': { prompt: 'Connecting you to Sales...', audio: null },
      'support': { prompt: 'Connecting you to Support...', audio: null },
    },
    fallback: { prompt: 'Sorry, I didn\'t get that. Please type 1 for Sales or 2 for Support.' }
  }
];

export default function IVRChatWidget({ open, onClose, companyUuid, logoSrc }) {
  const [ivrConfig, setIvrConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ivrStep, setIvrStep] = useState(0);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const holdAudioRef = useRef(null);
  const [onHold, setOnHold] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callStart, setCallStart] = useState(null);
  const [callTimer, setCallTimer] = useState('00:00');
  const callTimerRef = useRef(null);
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'in-call' | 'ended'>('idle');
  const [callError, setCallError] = useState('');
  const [agentSocketId, setAgentSocketId] = useState(null);
  const socketRef = useRef(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [queueEstimate, setQueueEstimate] = useState(null);
  const [webrtcState, setWebrtcState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  // Mute state
  const [muted, setMuted] = useState(false);
  // Hold state
  const [held, setHeld] = useState(false);
  // Widget mode: 'call' or 'chat'
  const [mode, setMode] = useState<'call' | 'chat'>('call');

  // Chat state
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatWidgetEndRef = useRef(null);
  // Typing indicator state
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentsOnline, setAgentsOnline] = useState(true);

  // Check agent online status when widget opens or companyUuid changes
  useEffect(() => {
    if (!open || !companyUuid) return;
    console.log('[Widget] companyUuid:', companyUuid);
    fetch(`http://localhost:5000/api/agents/${companyUuid}`)
      .then(res => res.json())
      .then(list => setAgentsOnline(Array.isArray(list) && list.some(a => a.online)))
      .catch(() => setAgentsOnline(false));
  }, [open, companyUuid]);

  // Fetch IVR config when opened or companyUuid changes
  useEffect(() => {
    if (!open) return;
    if (companyUuid) {
      fetch(`http://localhost:5000/api/widget/ivr/${companyUuid}`)
        .then(res => res.json())
        .then(config => {
          setIvrConfig(config);
          setMessages([{ from: 'system', text: config.steps[0].prompt }]);
          setIvrStep(0);
        })
        .catch(() => {
          setIvrConfig({ steps: demoIVR });
          setMessages([{ from: 'system', text: demoIVR[0].prompt }]);
          setIvrStep(0);
        });
    } else {
      setIvrConfig({ steps: demoIVR });
      setMessages([{ from: 'system', text: demoIVR[0].prompt }]);
      setIvrStep(0);
    }
  }, [open, companyUuid]);

  // Socket.IO setup/teardown
  useEffect(() => {
    if (!open) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    // Listen for call status updates
    socket.on('call-routed', (data) => {
      if (data.success) {
        setAgentSocketId(data.agentSocketId);
        setCallState('ringing');
        setCallError('');
      } else {
        setCallError(data.reason || 'No agents online');
        setCallState('idle');
      }
    });
    socket.on('call-status', (data) => {
      if (data.status === 'accepted') {
        setCallState('in-call');
        setCallError('');
        setCallStart(new Date());
        setTimeout(() => { if (ivrConfig) setMessages([{ from: 'system', text: ivrConfig.steps[0].prompt }]); }, 300);
      } else if (data.status === 'rejected') {
        setCallError('Call rejected by agent');
        setCallState('ended');
      }
    });
    socket.on('disconnect', () => {
      setCallState('ended');
      setCallError('Disconnected');
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [open, companyUuid, ivrConfig]);

  // Listen for queue-update events
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    const handler = (data) => {
      setQueuePosition(data.position);
      setQueueEstimate(data.estimate);
    };
    socket.on('queue-update', handler);
    return () => socket.off('queue-update', handler);
  }, [socketRef.current]);

  // Scroll to bottom on new message
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Play audio for current step
  useEffect(() => {
    if (!ivrConfig) return;
    const audioUrl = ivrConfig.steps[ivrStep]?.audio;
    if (audioUrl) {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
    }
  }, [ivrStep, ivrConfig]);

  // Play audio for last system message if present
  useEffect(() => {
    if (!ivrConfig) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.from === 'system' && lastMsg.audio) {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(lastMsg.audio);
      audioRef.current.play();
    }
  }, [messages, ivrConfig]);

  // Play hold music if present in current step
  useEffect(() => {
    if (!ivrConfig) return;
    const step = ivrConfig.steps[ivrStep];
    if (holdAudioRef.current) {
      holdAudioRef.current.pause();
      holdAudioRef.current = null;
    }
    if (step && step.holdMusic) {
      setOnHold(true);
      holdAudioRef.current = new Audio(step.holdMusic);
      holdAudioRef.current.loop = true;
      holdAudioRef.current.play();
    } else {
      setOnHold(false);
    }
    return () => {
      if (holdAudioRef.current) holdAudioRef.current.pause();
    };
  }, [ivrStep, ivrConfig]);

  // Stop hold music on modal close
  useEffect(() => {
    if (!open && holdAudioRef.current) {
      holdAudioRef.current.pause();
      holdAudioRef.current = null;
    }
  }, [open]);

  // Call timer logic
  useEffect(() => {
    if (inCall && callStart) {
      callTimerRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - callStart.getTime()) / 1000);
        const min = String(Math.floor(diff / 60)).padStart(2, '0');
        const sec = String(diff % 60).padStart(2, '0');
        setCallTimer(`${min}:${sec}`);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallTimer('00:00');
    }
    return () => clearInterval(callTimerRef.current);
  }, [inCall, callStart]);

  // Reset IVR/chat state on call end
  useEffect(() => {
    if (!inCall) {
      setMessages([]);
      setIvrStep(0);
      setInput('');
      setOnHold(false);
    }
  }, [inCall]);

  // When call state transitions to 'in-call', enable IVR/chat and timer
  useEffect(() => {
    if (callState === 'in-call') {
      setInCall(true);
      setCallStart(new Date());
    } else if (callState !== 'in-call') {
      setInCall(false);
      setCallStart(null);
    }
  }, [callState]);

  // Refactor WebRTC setup and cleanup
  useEffect(() => {
    let pc;
    let cleanup = false;
    if (callState === 'in-call' && agentSocketId && socketRef.current) {
      setWebrtcState('connecting');
      pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerRef.current = pc;
      console.log('Widget: Created RTCPeerConnection');
      // Get user media and add tracks before offer
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        setLocalStream(stream);
        console.log('Widget localStream tracks:', stream.getTracks());
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        // Create offer only after tracks are added
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
          socketRef.current.emit('webrtc-offer', { toSocketId: agentSocketId, offer });
        });
      }).catch(err => {
        console.error('Widget getUserMedia error:', err);
      });
      // Handle remote stream
      pc.ontrack = (event) => {
        const [remote] = event.streams;
        setRemoteStream(remote);
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remote;
        if (remote) console.log('Widget received remoteStream tracks:', remote.getTracks());
      };
      pc.onsignalingstatechange = () => {
        console.log('Widget signalingState:', pc.signalingState);
      };
      pc.oniceconnectionstatechange = () => {
        console.log('Widget ICE state:', pc.iceConnectionState);
      };
      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc-ice-candidate', { toSocketId: agentSocketId, candidate: event.candidate });
        }
      };
      // Handle answer
      socketRef.current.on('webrtc-answer', ({ answer }) => {
        if (pc.signalingState !== 'closed') {
          pc.setRemoteDescription(new RTCSessionDescription(answer));
          setWebrtcState('connected');
          console.log('Widget: setRemoteDescription(answer)');
        } else {
          console.warn('Widget: Tried to setRemoteDescription on closed connection');
        }
      });
      // Handle ICE from agent
      socketRef.current.on('webrtc-ice-candidate', ({ candidate }) => {
        if (pc.signalingState !== 'closed') {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.warn('Widget: Tried to addIceCandidate on closed connection');
        }
      });
    }
    // Only clean up on unmount or call truly ending
    return () => {
      if (cleanup) return;
      cleanup = true;
      if (peerRef.current) {
        console.log('Widget: Closing RTCPeerConnection');
        peerRef.current.close();
        peerRef.current = null;
      }
      setWebrtcState('idle');
      setRemoteStream(null);
      setLocalStream(null);
    };
  }, [callState === 'in-call', agentSocketId]);

  // Join chat session when entering chat mode
  useEffect(() => {
    if (mode !== 'chat' || !open) return;
    let sessionId = chatSessionId;
    if (!sessionId) {
      sessionId = uuidv4();
      setChatSessionId(sessionId);
    }
    if (socketRef.current && sessionId && companyUuid) {
      console.log('[Widget] emit chat:join', { sessionId, companyUuid, visitorId: sessionId, pageUrl: window.location.href });
      socketRef.current.emit('chat:join', {
        sessionId,
        companyUuid,
        visitorId: sessionId,
        pageUrl: window.location.href
      });
    }
    setChatMessages([]);
  }, [mode, open]);

  // Listen for chat messages
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    const onMsg = (data) => {
      console.log('[Widget] received chat:message', data);
      setChatMessages(msgs => [...msgs, data]);
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [mode, open]);

  // Scroll to bottom on new chat message
  useEffect(() => {
    if (mode === 'chat' && chatWidgetEndRef.current) {
      chatWidgetEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, mode]);

  // Emit typing event when visitor types
  useEffect(() => {
    if (mode !== 'chat' || !open || !chatSessionId || !socketRef.current) return;
    if (!chatInput) return;
    const timeout = setTimeout(() => {
      socketRef.current.emit('chat:typing', { sessionId: chatSessionId, from: 'visitor' });
    }, 200);
    return () => clearTimeout(timeout);
  }, [chatInput, mode, open, chatSessionId]);

  // Listen for agent typing
  useEffect(() => {
    if (!socketRef.current || mode !== 'chat' || !open) return;
    const socket = socketRef.current;
    const onTyping = (data) => {
      if (data.from === 'agent') {
        setAgentTyping(true);
        setTimeout(() => setAgentTyping(false), 1200);
      }
    };
    socket.on('chat:typing', onTyping);
    return () => socket.off('chat:typing', onTyping);
  }, [mode, open]);

  // Send chat message
  const handleSendChat = () => {
    if (!chatInput.trim() || !chatSessionId || !socketRef.current) return;
    const msg = {
      sessionId: chatSessionId,
      message: chatInput.trim(),
      from: 'visitor',
      timestamp: new Date().toISOString()
    };
    console.log('[Widget] emit chat:message', msg);
    socketRef.current.emit('chat:message', msg);
    setChatMessages(msgs => [...msgs, msg]);
    setChatInput('');
  };

  // Handle speech recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setMessages(msgs => [...msgs, { from: 'system', text: 'Speech recognition not supported in this browser.' }]);
      return;
    }
    setListening(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      handleSend(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  };
  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  // Handle sending input with multi-step logic
  const handleSend = (val) => {
    if (!ivrConfig) return;
    const value = (val || input).trim();
    if (!value) return;
    setMessages(msgs => [...msgs, { from: 'user', text: value }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const step = ivrConfig.steps[ivrStep];
      const key = value.toLowerCase();
      let route = step.routes[key];
      if (!route && key === '1') route = step.routes['1'];
      if (!route && key === '2') route = step.routes['2'];
      if (!route && key.includes('sales')) route = step.routes['sales'];
      if (!route && key.includes('support')) route = step.routes['support'];
      if (route) {
        // If route has nextStep, move to that step
        if (typeof route.nextStep === 'number' && ivrConfig.steps[route.nextStep]) {
          setIvrStep(route.nextStep);
          setMessages(msgs => [...msgs, { from: 'system', text: ivrConfig.steps[route.nextStep].prompt, audio: ivrConfig.steps[route.nextStep].audio }]);
        } else if (route.prompt) {
          setMessages(msgs => [...msgs, { from: 'system', text: route.prompt, audio: route.audio }]);
        } else {
          setMessages(msgs => [...msgs, { from: 'system', text: 'Thank you. (End of IVR)' }]);
        }
      } else {
        setMessages(msgs => [...msgs, { from: 'system', text: step.fallback?.prompt || 'Sorry, try again.' }]);
      }
      setLoading(false);
    }, 900);
  };

  // Start call handler
  const handleStartCall = () => {
    setCallState('ringing');
    setCallError('');
    setAgentSocketId(null);
    setInCall(false);
    setCallStart(null);
    setTimeout(() => {
      if (socketRef.current && companyUuid) {
        socketRef.current.emit('call-request', { uuid: companyUuid });
      }
    }, 200);
  };

  // Hang up handler
  const handleHangUp = () => {
    setCallState('ended');
    setInCall(false);
    setCallStart(null);
    setTimeout(() => setCallState('idle'), 1200);
  };

  // Detect dark mode (auto or from prop)
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = prefersDark;

  // Chat bubble animation
  const bubbleAnim = {
    animation: 'fadein-bubble 0.4s',
  };

  // Header styles
  const headerStyle = {
    background: isDark ? 'linear-gradient(90deg, #1a2239 0%, #2E73FF 100%)' : 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)',
    color: '#fff',
    padding: '16px 24px',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: -1,
    position: 'relative',
    minHeight: 56,
  };

  // --- UI polish styles ---
  const headerGradient = 'linear-gradient(90deg, #2E73FF 0%, #6C47FF 100%)';
  const agentBubbleStyle = {
    background: '#fff',
    color: '#222',
    borderRadius: 16,
    padding: '10px 16px',
    margin: '4px 0',
    maxWidth: '80%',
    alignSelf: 'flex-start',
    boxShadow: '0 1px 4px rgba(44,62,80,0.07)'
  };
  const visitorBubbleStyle = {
    background: 'linear-gradient(90deg, #2E73FF 0%, #6C47FF 100%)',
    color: '#fff',
    borderRadius: 16,
    padding: '10px 16px',
    margin: '4px 0',
    maxWidth: '80%',
    alignSelf: 'flex-end',
    boxShadow: '0 1px 4px rgba(44,62,80,0.12)'
  };
  const chatContainerStyle = {
    display: 'flex', flexDirection: 'column', height: 340, overflowY: 'auto', background: '#f7fafd', padding: 16, borderRadius: 16, marginBottom: 8
  };
  const inputBarStyle = {
    display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 24, boxShadow: '0 1px 4px rgba(44,62,80,0.07)', padding: '4px 12px', margin: '0 8px 8px 8px'
  };
  const sendBtnStyle = {
    background: 'linear-gradient(90deg, #2E73FF 0%, #6C47FF 100%)',
    borderRadius: '50%',
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    boxShadow: '0 2px 8px rgba(44,62,80,0.12)',
    color: '#fff',
    fontSize: 22,
    border: 'none',
    cursor: 'pointer'
  };

  // Responsive modal width
  const modalWidth = window.innerWidth < 500 ? '98vw' : 400;

  // Banner/status for call state
  function CallStatusBanner() {
    if (callState === 'ringing') {
      return (
        <div style={{ background: isDark ? '#232c3d' : '#e8f1ff', color: isDark ? '#00e6ef' : '#2E73FF', fontWeight: 600, fontSize: 15, padding: '8px 0', textAlign: 'center', borderRadius: 8, margin: '8px 0 0 0', letterSpacing: 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span className="music-anim" style={{ display: 'inline-block', fontSize: 20, animation: 'music-bounce 1.2s infinite alternate' }}>🎵</span>
          <Spin size="small" style={{ marginRight: 8 }} />
          <span>Connecting to agent... You can interact with the IVR while you wait.</span>
          {queuePosition && (
            <span style={{ marginLeft: 16, color: isDark ? '#1CC88A' : '#1CC88A', fontWeight: 700 }}>
              Position in queue: #{queuePosition} {queueEstimate && <span style={{ color: isDark ? '#F6C23E' : '#F6C23E', marginLeft: 8 }}>Est. wait: {Math.round(queueEstimate/60) || 1} min</span>}
            </span>
          )}
          <Button size="small" style={{ marginLeft: 16, borderRadius: 16, background: isDark ? '#232c3d' : '#fff', color: isDark ? '#00e6ef' : '#2E73FF', border: '1px solid #2E73FF', fontWeight: 600 }} onClick={() => alert('Leave a message (not implemented)')}>Leave a message</Button>
        </div>
      );
    }
    if (callState === 'in-call' && agentSocketId) {
      return (
        <div style={{ background: isDark ? '#232c3d' : '#e8f1ff', color: isDark ? '#1CC88A' : '#1CC88A', fontWeight: 600, fontSize: 15, padding: '8px 0', textAlign: 'center', borderRadius: 8, margin: '8px 0 0 0', letterSpacing: 0.2 }}>
          <span style={{ marginRight: 8 }}>🟢</span> Agent connected!
        </div>
      );
    }
    return null;
  }

  // In chat mode, show offline banner if no agents online
  if (mode === 'chat' && !agentsOnline) {
    return (
      <Modal open={open} onCancel={onClose} footer={null} width={400} centered>
        <div style={{ padding: 32, textAlign: 'center' }}>
          <RobotOutlined style={{ fontSize: 48, color: '#aaa', marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>All agents are offline</div>
          <div style={{ color: '#888', marginBottom: 24 }}>Please try again later or leave a message.</div>
          <Button type="primary" onClick={() => setMode('call')}>Back</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
      bodyStyle={{ 
        padding: 0, 
        borderRadius: (callState === 'in-call' || callState === 'ringing') ? 32 : 24, 
        overflow: 'hidden', 
        background: '#f7fafd',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: (callState === 'in-call' || callState === 'ringing') 
          ? '0 20px 40px rgba(46, 115, 255, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)' 
          : '0 8px 24px rgba(0, 0, 0, 0.12)',
        transform: (callState === 'in-call' || callState === 'ringing') ? 'scale(1.02)' : 'scale(1)',
        border: (callState === 'in-call' || callState === 'ringing') ? '2px solid rgba(46, 115, 255, 0.2)' : 'none'
      }}
      style={{ 
        top: 'auto', 
        bottom: 24, 
        right: 24, 
        margin: 0, 
        padding: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      closeIcon={
        <span style={{ 
          fontSize: 22, 
          color: '#2E73FF',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '50%',
          display: 'inline-block'
        }} 
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(46, 115, 255, 0.1)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.transform = 'scale(1)';
        }}
        >×</span>
      }
      mask={false}
      maskClosable={true}
      zIndex={1200}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 16,
        transition: 'all 0.3s ease'
      }}>
        <img 
          src={logoSrc || logoLight} 
          alt="Calldock Widget Logo" 
          style={{ 
            width: 48, 
            height: 48, 
            objectFit: 'contain', 
            marginTop: 8,
            transition: 'all 0.3s ease',
            transform: (callState === 'in-call' || callState === 'ringing') ? 'scale(1.1)' : 'scale(1)',
            filter: (callState === 'in-call' || callState === 'ringing') ? 'drop-shadow(0 4px 8px rgba(46, 115, 255, 0.3))' : 'none'
          }} 
        />
      </div>
      <div style={{ 
        padding: 16,
        transition: 'all 0.3s ease'
      }}>
        {mode === 'call' && (
          <>
            <CallStatusBanner />
            <div style={{ 
              minHeight: 180, 
              maxHeight: 220, 
              overflowY: 'auto', 
              background: '#fff', 
              borderRadius: (callState === 'in-call' || callState === 'ringing') ? 20 : 12, 
              marginBottom: 12, 
              padding: 12,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: (callState === 'in-call' || callState === 'ringing') 
                ? '0 4px 12px rgba(46, 115, 255, 0.1)' 
                : '0 2px 8px rgba(0, 0, 0, 0.05)',
              border: (callState === 'in-call' || callState === 'ringing') 
                ? '1px solid rgba(46, 115, 255, 0.1)' 
                : 'none'
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ textAlign: msg.from === 'user' ? 'right' : 'left', margin: '8px 0' }}>
                  <span style={{
                    display: 'inline-block',
                    background: msg.from === 'user' ? '#2E73FF' : '#e8f1ff',
                    color: msg.from === 'user' ? '#fff' : '#222',
                    borderRadius: (callState === 'in-call' || callState === 'ringing') ? 16 : 12,
                    padding: '6px 14px',
                    maxWidth: 220,
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)',
                    ...bubbleAnim
                  }}>
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ 
              display: 'flex', 
              gap: 8,
              transition: 'all 0.3s ease'
            }}>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onPressEnter={() => handleSend()}
                placeholder="Type or speak..."
                disabled={loading || callState === 'ended'}
                style={{ 
                  flex: 1,
                  borderRadius: (callState === 'in-call' || callState === 'ringing') ? 20 : 6,
                  transition: 'all 0.3s ease',
                  border: (callState === 'in-call' || callState === 'ringing') 
                    ? '1px solid rgba(46, 115, 255, 0.2)' 
                    : undefined
                }}
              />
              <Button 
                icon={<AudioOutlined />} 
                onClick={startListening} 
                disabled={listening || loading}
                style={{
                  borderRadius: (callState === 'in-call' || callState === 'ringing') ? 20 : 6,
                  transition: 'all 0.3s ease'
                }}
              />
              <Button 
                icon={<SendOutlined />} 
                type="primary" 
                onClick={() => handleSend()} 
                disabled={!input || loading}
                style={{
                  borderRadius: (callState === 'in-call' || callState === 'ringing') ? 20 : 6,
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div style={{ 
              marginTop: 12, 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 12,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                maxWidth: '100%',
                transition: 'all 0.3s ease'
              }}>
                <Button
                  icon={<PhoneOutlined />}
                  type="primary"
                  onClick={handleStartCall}
                  disabled={callState === 'ringing' || callState === 'in-call'}
                  style={{ 
                    fontWeight: 700, 
                    fontSize: 16, 
                    padding: '0 18px', 
                    height: 44, 
                    borderRadius: 22, 
                    boxShadow: '0 2px 12px #00e6ef33', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    animation: callState === 'idle' ? 'cardBounce 1.2s' : undefined,
                    transform: 'translateY(0)',
                    ':hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px #00e6ef44'
                    }
                  }}
                >
                  Start Call
                </Button>
                <Button
                  icon={<SendOutlined />}
                  type="default"
                  onClick={() => setMode('chat')}
                  style={{ 
                    fontWeight: 700, 
                    fontSize: 16, 
                    padding: '0 18px', 
                    height: 44, 
                    borderRadius: 22, 
                    boxShadow: '0 2px 12px #00e6ef22', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    animation: 'cardBounce 1.2s',
                    transform: 'translateY(0)',
                    ':hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px #00e6ef33'
                    }
                  }}
                >
                  Start Chat
                </Button>
              </div>
              {(callState === 'in-call' || callState === 'ringing') && (
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  maxWidth: '100%',
                  animation: 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transition: 'all 0.3s ease'
                }}>
                  <Button
                    icon={muted ? <AudioMutedOutlined /> : <SoundOutlined />}
                    onClick={() => {
                      setMuted(m => !m);
                      if (localStream) {
                        localStream.getAudioTracks().forEach(track => (track.enabled = muted));
                      }
                    }}
                    style={{ 
                      background: muted ? '#e74a3b' : '#f7fafd', 
                      color: muted ? '#fff' : '#2E73FF', 
                      border: 'none', 
                      fontWeight: 700, 
                      fontSize: 16, 
                      height: 44, 
                      borderRadius: 22, 
                      boxShadow: muted ? '0 2px 12px #e74a3b33' : '0 2px 12px #00e6ef22', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      animation: muted ? 'pulse 0.6s ease-in-out' : undefined,
                      transform: 'translateY(0)',
                      ':hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: muted ? '0 4px 16px #e74a3b44' : '0 4px 16px #00e6ef33'
                      }
                    }}
                  >
                    {muted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button
                    icon={<PauseCircleOutlined />}
                    onClick={() => setHeld(h => !h)}
                    style={{ 
                      background: held ? '#f6c23e' : '#f7fafd', 
                      color: held ? '#fff' : '#2E73FF', 
                      border: 'none', 
                      fontWeight: 700, 
                      fontSize: 16, 
                      height: 44, 
                      borderRadius: 22, 
                      boxShadow: held ? '0 2px 12px #f6c23e33' : '0 2px 12px #00e6ef22', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      animation: held ? 'pulse 0.6s ease-in-out' : undefined,
                      transform: 'translateY(0)',
                      ':hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: held ? '0 4px 16px #f6c23e44' : '0 4px 16px #00e6ef33'
                      }
                    }}
                  >
                    {held ? 'Resume' : 'Hold'}
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    danger
                    onClick={handleHangUp}
                    style={{ 
                      fontWeight: 700, 
                      fontSize: 16, 
                      height: 44, 
                      borderRadius: 22, 
                      boxShadow: '0 2px 12px #e74a3b33', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      animation: 'cardBounce 1.2s',
                      transform: 'translateY(0)',
                      ':hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 16px #e74a3b44'
                      }
                    }}
                  >
                    End Call
                  </Button>
                </div>
              )}
            </div>
            {callError && <div style={{ color: 'red', marginTop: 8 }}>{callError}</div>}
          </>
        )}
        {mode === 'chat' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
              <Button size="small" onClick={() => setMode('call')} icon={<CloseOutlined />} style={{ borderRadius: 16, background: '#f7fafd', color: '#2E73FF', border: '1px solid #2E73FF', fontWeight: 600 }}>Back</Button>
            </div>
            {/* --- Header ---
            <div style={{ background: headerGradient, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '18px 20px 10px 20px', color: '#fff', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 2 }}>Chat with us</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 2 }}>{agentsOnline ? 'We are online!' : 'All agents are offline'}</div>
            </div> */}
            {/* Chat area */}
            <div style={chatContainerStyle}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={msg.from === 'visitor' ? visitorBubbleStyle : agentBubbleStyle}>
                  <div style={{ fontSize: 15 }}>{msg.message}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2, textAlign: msg.from === 'visitor' ? 'right' : 'left' }}>{msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
              {/* Typing indicator */}
              {agentTyping && <div style={{ alignSelf: 'flex-start', margin: '4px 0', fontSize: 13, color: '#2E73FF', background: '#eaf1ff', borderRadius: 12, padding: '4px 12px' }}>Agent is typing...</div>}
              <div ref={chatWidgetEndRef} />
            </div>
            {/* Input bar */}
            <div style={inputBarStyle}>
              <input
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, background: 'transparent', padding: 8 }}
                placeholder="Type in a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                disabled={!agentsOnline}
              />
              <button style={sendBtnStyle} onClick={handleSendChat} disabled={!chatInput.trim() || !agentsOnline}>
                <span style={{ fontWeight: 700, fontSize: 22 }}>&#9658;</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
} 