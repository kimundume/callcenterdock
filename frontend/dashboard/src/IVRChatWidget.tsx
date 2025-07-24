import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input, Tooltip, Spin } from 'antd';
import { AudioOutlined, SendOutlined, CloseOutlined, SoundOutlined, LoadingOutlined, RobotOutlined, UserOutlined, AudioMutedOutlined, PlayCircleOutlined, StopOutlined, SmileOutlined, PhoneOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';

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

export default function IVRChatWidget({ open, onClose, companyUuid, dark = false }) {
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

  // WebRTC setup on agent accept
  useEffect(() => {
    if (callState === 'in-call' && agentSocketId && socketRef.current) {
      setWebrtcState('connecting');
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerRef.current = pc;
      // Get user media
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        setLocalStream(stream);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      });
      // Handle remote stream
      pc.ontrack = (event) => {
        const [remote] = event.streams;
        setRemoteStream(remote);
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remote;
      };
      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc-ice-candidate', { toSocketId: agentSocketId, candidate: event.candidate });
        }
      };
      // Create offer
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socketRef.current.emit('webrtc-offer', { toSocketId: agentSocketId, offer });
      });
      // Handle answer
      socketRef.current.on('webrtc-answer', ({ answer }) => {
        pc.setRemoteDescription(new RTCSessionDescription(answer));
        setWebrtcState('connected');
      });
      // Handle ICE from agent
      socketRef.current.on('webrtc-ice-candidate', ({ candidate }) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
    return () => {
      if (peerRef.current) peerRef.current.close();
      setWebrtcState('idle');
      setRemoteStream(null);
      setLocalStream(null);
    };
  }, [callState, agentSocketId]);

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
  const isDark = dark || prefersDark;

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

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={modalWidth} centered bodyStyle={{ padding: 0, borderRadius: 16, overflow: 'hidden', background: isDark ? '#181f2a' : '#f7fafd' }} closeIcon={null} style={{ top: 24 }}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#00e6ef', fontWeight: 900, boxShadow: '0 2px 8px #00e6ef22' }}>🤖</div>
        <span style={{ flex: 1 }}>CallDocker IVR</span>
        {callState === 'in-call' && (
          <span style={{ marginRight: 16, fontWeight: 600, color: isDark ? '#00e6ef' : '#2E73FF', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            <PhoneOutlined style={{ color: '#00e6ef' }} /> In Call <span style={{ fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>{callTimer}</span>
          </span>
        )}
        <button onClick={onClose} style={{ position: 'absolute', right: 16, top: 12, background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}><CloseOutlined /></button>
      </div>
      {/* Chat body */}
      <div style={{ background: isDark ? '#181f2a' : '#fff', borderRadius: 16, boxShadow: isDark ? '0 4px 24px #2E73FF22' : '0 4px 24px #00e6ef22', minHeight: 320, display: 'flex', flexDirection: 'column', position: 'relative', height: window.innerWidth < 500 ? '70vh' : 520 }}>
        {callState === 'idle' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div style={{ fontSize: 38, color: isDark ? '#00e6ef' : '#2E73FF', marginBottom: 12 }}><PhoneOutlined /></div>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: isDark ? '#fff' : '#0a2239' }}>Ready to Call</div>
            <div style={{ color: isDark ? '#aaa' : '#888', fontSize: 15, marginBottom: 24 }}>Click below to start a call with our AI IVR</div>
            <Button type="primary" size="large" icon={<PhoneOutlined />} style={{ borderRadius: 24, background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', fontWeight: 700, fontSize: 18, height: 48, width: 180 }} onClick={handleStartCall}>
              Start Call
            </Button>
            {callError && <div style={{ color: '#E74A3B', fontWeight: 600, marginTop: 16 }}>{callError}</div>}
          </div>
        )}
        {(callState === 'ringing' || callState === 'in-call') && (
          <>
            <CallStatusBanner />
            {webrtcState === 'connecting' && <div style={{ background: '#e8f1ff', color: '#2E73FF', fontWeight: 600, fontSize: 15, padding: '8px 0', textAlign: 'center', borderRadius: 8, margin: '8px 0 0 0' }}>Connecting audio...</div>}
            {webrtcState === 'connected' && <div style={{ background: '#e8f1ff', color: '#1CC88A', fontWeight: 600, fontSize: 15, padding: '8px 0', textAlign: 'center', borderRadius: 8, margin: '8px 0 0 0' }}>Live audio with agent</div>}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 8px 12px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', ...bubbleAnim }}>
                  <div style={{
                    background: msg.from === 'user' ? (isDark ? 'linear-gradient(90deg, #2E73FF 0%, #00e6ef 100%)' : 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)') : (isDark ? '#232c3d' : '#f7fafd'),
                    color: msg.from === 'user' ? '#fff' : (isDark ? '#fff' : '#0a2239'),
                    borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '12px 18px',
                    fontWeight: 500,
                    fontSize: 16,
                    boxShadow: msg.from === 'user' ? '0 2px 8px #00e6ef33' : (isDark ? '0 1px 4px #2E73FF22' : '0 1px 4px #2E73FF11'),
                    marginBottom: 2,
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 0.2s',
                  }}>
                    {/* Avatar */}
                    <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>
                      {msg.from === 'user' ? <UserOutlined style={{ color: isDark ? '#fff' : '#2E73FF' }} /> : <RobotOutlined style={{ color: isDark ? '#00e6ef' : '#2E73FF' }} />}
                    </span>
                    {msg.text}
                  </div>
                </div>
              ))}
              {/* On Hold Indicator */}
              {onHold && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '80%', ...bubbleAnim }}>
                  <div style={{ background: isDark ? '#232c3d' : '#f7fafd', color: isDark ? '#00e6ef' : '#2E73FF', borderRadius: '18px 18px 18px 4px', padding: '12px 18px', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SoundOutlined style={{ fontSize: 20, color: isDark ? '#00e6ef' : '#2E73FF' }} />
                    <span>🎵 You are on hold. Please wait...</span>
                    <span className="typing-indicator" style={{ display: 'inline-block', width: 32 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: isDark ? '#00e6ef' : '#2E73FF', borderRadius: '50%', marginRight: 2, animation: 'blink 1s infinite alternate' }} />
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: isDark ? '#00e6ef' : '#2E73FF', borderRadius: '50%', marginRight: 2, animation: 'blink 1s 0.2s infinite alternate' }} />
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: isDark ? '#00e6ef' : '#2E73FF', borderRadius: '50%', animation: 'blink 1s 0.4s infinite alternate' }} />
                    </span>
                  </div>
                </div>
              )}
              {/* Typing indicator */}
              {loading && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '80%', ...bubbleAnim }}>
                  <div style={{ background: isDark ? '#232c3d' : '#f7fafd', color: isDark ? '#fff' : '#0a2239', borderRadius: '18px 18px 18px 4px', padding: '12px 18px', fontWeight: 500, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RobotOutlined style={{ color: isDark ? '#00e6ef' : '#2E73FF' }} />
                    <span className="typing-indicator" style={{ display: 'inline-block', width: 32 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: isDark ? '#00e6ef' : '#2E73FF', borderRadius: '50%', marginRight: 2, animation: 'blink 1s infinite alternate' }} />
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: isDark ? '#00e6ef' : '#2E73FF', borderRadius: '50%', marginRight: 2, animation: 'blink 1s 0.2s infinite alternate' }} />
                      <span style={{ display: 'inline-block', width: 6, height: 6, background: isDark ? '#00e6ef' : '#2E73FF', borderRadius: '50%', animation: 'blink 1s 0.4s infinite alternate' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {/* Input area */}
            <div style={{ borderTop: isDark ? '1px solid #232c3d' : '1px solid #e5e7eb', padding: 12, display: 'flex', alignItems: 'center', gap: 8, background: isDark ? '#232c3d' : '#f7fafd' }}>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onPressEnter={() => handleSend()}
                placeholder="Type 1, 2, or say 'Sales'..."
                style={{ flex: 1, borderRadius: 24, fontSize: 16, background: isDark ? '#181f2a' : '#fff', color: isDark ? '#fff' : undefined, border: isDark ? '1px solid #232c3d' : undefined }}
                disabled={loading || listening}
                autoFocus
              />
              <Tooltip title={listening ? 'Stop Listening' : 'Speak'}>
                <Button
                  icon={listening ? <AudioMutedOutlined /> : <AudioOutlined />} 
                  onClick={listening ? stopListening : startListening}
                  style={{ background: listening ? (isDark ? '#2E73FF' : '#2E73FF') : (isDark ? '#232c3d' : '#fff'), color: listening ? '#fff' : (isDark ? '#00e6ef' : '#2E73FF'), borderRadius: 24, border: 'none', fontSize: 20 }}
                  disabled={loading}
                />
              </Tooltip>
              <Button
                icon={<SendOutlined />}
                type="primary"
                onClick={() => handleSend()}
                style={{ borderRadius: 24, background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', fontWeight: 700 }}
                disabled={loading || !input.trim()}
              />
              <Button danger icon={<PhoneOutlined />} style={{ borderRadius: 24, fontWeight: 700, marginLeft: 8 }} onClick={handleHangUp}>
                Hang Up
              </Button>
              <Button onClick={() => {
                if (localStream) {
                  localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
                }
              }} style={{ marginLeft: 8 }}>{localStream && localStream.getAudioTracks()[0]?.enabled ? 'Mute' : 'Unmute'}</Button>
            </div>
          </>
        )}
        {callState === 'ended' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div style={{ fontSize: 38, color: '#E74A3B', marginBottom: 12 }}><PhoneOutlined /></div>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: isDark ? '#fff' : '#0a2239' }}>Call Ended</div>
            <div style={{ color: isDark ? '#aaa' : '#888', fontSize: 15, marginBottom: 24 }}>{callError || 'Thank you for calling.'}</div>
            <Button type="primary" size="large" icon={<PhoneOutlined />} style={{ borderRadius: 24, background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', fontWeight: 700, fontSize: 18, height: 48, width: 180 }} onClick={() => setCallState('idle')}>
              New Call
            </Button>
          </div>
        )}
      </div>
      {/* Animations */}
      <style>{`
        @keyframes fadein-bubble { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes blink { 0% { opacity: 0.2; } 100% { opacity: 1; } }
        @keyframes music-bounce { 0% { transform: translateY(0); } 100% { transform: translateY(-6px) scale(1.2); } }
        @media (max-width: 500px) {
          .ant-modal-content { border-radius: 0 !important; }
        }
      `}</style>
    </Modal>
  );
} 