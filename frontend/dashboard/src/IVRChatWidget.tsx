import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input, Tooltip, Spin } from 'antd';
import { AudioOutlined, SendOutlined, CloseOutlined, SoundOutlined, LoadingOutlined, RobotOutlined, UserOutlined, AudioMutedOutlined, PlayCircleOutlined, StopOutlined, SmileOutlined, PhoneOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import logoLight from '/logo-light.png';
import logoDark from '/logo-dark.png';
import { v4 as uuidv4 } from 'uuid';
import { getBackendUrl, getSocketUrl } from './config';

const SOCKET_URL = getSocketUrl();

interface IVRStep {
  prompt: string;
  audio: string | null;
  routes: Record<string, { prompt: string; audio: string | null }>;
  fallback: { prompt: string };
  holdMusic?: string;
}

interface IVRConfig {
  steps: IVRStep[];
}

interface Message {
  from: 'user' | 'system';
  text: string;
  audio?: string;
}

interface ChatMessage {
  sessionId: string;
  message: string;
  from: 'visitor' | 'agent';
  timestamp: string;
}

interface FormField {
  label: string;
  type: string;
  required?: boolean;
}

interface Form {
  _id: string;
  fields: FormField[];
}

const demoIVR: IVRStep[] = [
  {
    prompt: 'Welcome to CallDocker! Press 1 for Sales, 2 for Support.',
    audio: null,
    routes: {
      '1': { prompt: 'Connecting you to Sales...', audio: null },
      '2': { prompt: 'Connecting you to Support...', audio: null },
      'sales': { prompt: 'Connecting you to Sales...', audio: null },
      'support': { prompt: 'Connecting you to Support...', audio: null },
    },
    fallback: { prompt: 'Sorry, I didn\'t get that. Please type 1 for Sales or 2 for Support.' }
  }
];

interface IVRChatWidgetProps {
  open: boolean;
  onClose: () => void;
  companyUuid: string | null;
  logoSrc: string;
}

export default function IVRChatWidget({ open, onClose, companyUuid, logoSrc }: IVRChatWidgetProps) {
  console.log('[IVRChatWidget] Rendered with open:', open, 'companyUuid:', companyUuid, 'logoSrc:', logoSrc);
  
  // Add useEffect to track prop changes
  useEffect(() => {
    console.log('[IVRChatWidget] Props changed - open:', open, 'companyUuid:', companyUuid);
  }, [open, companyUuid]);
  
  const [ivrConfig, setIvrConfig] = useState<IVRConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ivrStep, setIvrStep] = useState(0);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdAudioRef = useRef<HTMLAudioElement | null>(null);
  const [onHold, setOnHold] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callStart, setCallStart] = useState<Date | null>(null);
  const [callTimer, setCallTimer] = useState('00:00');
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'in-call' | 'ended'>('idle');
  const [callError, setCallError] = useState('');
  const [agentSocketId, setAgentSocketId] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [queueEstimate, setQueueEstimate] = useState<number | null>(null);
  const [webrtcState, setWebrtcState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  // Mute state
  const [muted, setMuted] = useState(false);
  // Hold state
  const [held, setHeld] = useState(false);
  // Widget mode: 'call' or 'chat'
  const [mode, setMode] = useState<'call' | 'chat'>('call');

  // Chat state
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatWidgetEndRef = useRef<HTMLDivElement>(null);
  // Typing indicator state
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentsOnline, setAgentsOnline] = useState(true);

  // Form push state
  const [activeForm, setActiveForm] = useState<Form | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formResponseMsg, setFormResponseMsg] = useState('');

  // Add state for contact form inside IVRChatWidget
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Check agent online status when widget opens or companyUuid changes
  useEffect(() => {
    if (!open) return;
    const effectiveCompanyUuid = companyUuid || 'calldocker-company-uuid';
    console.log('[Widget] companyUuid:', effectiveCompanyUuid);
    fetch(`${getBackendUrl()}/api/agents/${effectiveCompanyUuid}`)
      .then(res => res.json())
      .then(list => setAgentsOnline(Array.isArray(list) && list.some(a => a.online)))
      .catch(() => setAgentsOnline(false));
  }, [open, companyUuid]);

  // Fetch IVR config when opened or companyUuid changes
  useEffect(() => {
    if (!open) return;
    const effectiveCompanyUuid = companyUuid || 'calldocker-company-uuid';
    console.log('[IVRChatWidget] Widget opened. companyUuid:', effectiveCompanyUuid);
    fetch(`${getBackendUrl()}/api/widget/ivr/${effectiveCompanyUuid}`)
      .then(res => res.json())
      .then(config => {
        console.log('[IVRChatWidget] IVR config loaded:', config);
        setIvrConfig(config);
        setMessages([{ from: 'system', text: config.steps[0].prompt }]);
        setIvrStep(0);
      })
      .catch((err) => {
        console.error('[IVRChatWidget] Error loading IVR config:', err);
        setIvrConfig({ steps: demoIVR });
        setMessages([{ from: 'system', text: demoIVR[0].prompt }]);
        setIvrStep(0);
      });
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

  // Listen for form:push and form:response events
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    const onFormPush = (form) => {
      setActiveForm(form);
      setFormValues({});
      setFormResponseMsg('');
    };
    const onFormResponse = (response) => {
      setActiveForm(null);
      setFormResponseMsg('Form submitted!');
      
      // Add form response to chat messages
      const formMessage = {
        sessionId: response.sessionId,
        message: `📋 **Form Submitted**\n${Object.entries(response.values).map(([field, value]) => `**${field}:** ${value}`).join('\n')}`,
        from: 'visitor',
        timestamp: response.timestamp,
        type: 'form-response',
        formData: response
      };
      
      setChatMessages(msgs => [...msgs, formMessage]);
    };
    
    socket.on('form:push', onFormPush);
    socket.on('form:response', onFormResponse);
    return () => {
      socket.off('form:push', onFormPush);
      socket.off('form:response', onFormResponse);
    };
  }, [open, chatSessionId]);

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
    const onMsg = (data: ChatMessage) => {
      console.log('[Widget] received chat:message', data);
      setChatMessages(msgs => [...msgs, data]);
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [mode, open]);

  // Load chat messages from backend when chatSessionId changes
  useEffect(() => {
    if (!chatSessionId || !companyUuid) return;
    fetch(`${getBackendUrl()}/api/chat-messages?companyId=${companyUuid}&sessionId=${chatSessionId}`)
      .then(res => res.json())
      .then((messages: ChatMessage[]) => {
        setChatMessages(messages);
      });
      
    // Also fetch form responses
    fetch(`${getBackendUrl()}/api/form-response?companyId=${companyUuid}&sessionId=${chatSessionId}`)
      .then(res => res.json())
      .then((responses: any[]) => {
        // Convert form responses to chat messages
        const formMessages: ChatMessage[] = responses.map(response => ({
          sessionId: response.sessionId,
          message: `📋 **Form Submitted**\n${Object.entries(response.values).map(([field, value]) => `**${field}:** ${value}`).join('\n')}`,
          from: 'visitor',
          timestamp: response.timestamp,
        }));
        
        // Combine regular messages and form responses, sorted by timestamp
        const allMessages = [...messages, ...formMessages].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setChatMessages(allMessages);
      });
  }, [chatSessionId, companyUuid]);

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

  // Listen for typing indicators
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    const onTyping = (data: { from: string; typing: boolean }) => {
      if (data.from === 'agent') {
        setAgentTyping(data.typing);
      }
    };
    socket.on('chat:typing', onTyping);
    return () => socket.off('chat:typing', onTyping);
  }, [mode, open]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || !chatSessionId || !socketRef.current) return;
    
    const msg: ChatMessage = {
      sessionId: chatSessionId,
      message: chatInput.trim(),
      from: 'visitor',
      timestamp: new Date().toISOString()
    };
    
    socketRef.current.emit('chat:message', msg);
    setChatMessages(msgs => [...msgs, msg]);
    setChatInput('');
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setMessages(msgs => [...msgs, { from: 'system', text: 'Speech recognition not supported in this browser.' }]);
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };
    
    recognition.start();
    setListening(true);
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const handleSend = (val: string) => {
    if (!val.trim()) return;
    
    setMessages(msgs => [...msgs, { from: 'user', text: val }]);
    setInput('');
    
    if (!ivrConfig) return;
    
    const step = ivrConfig.steps[ivrStep];
    const route = step.routes[val.toLowerCase()];
    
    if (route) {
      if (typeof route.nextStep === 'number' && ivrConfig.steps[route.nextStep]) {
        setIvrStep(route.nextStep);
        setMessages(msgs => [...msgs, { from: 'system', text: ivrConfig.steps[route.nextStep].prompt, audio: ivrConfig.steps[route.nextStep].audio }]);
      } else {
        setMessages(msgs => [...msgs, { from: 'system', text: route.prompt, audio: route.audio }]);
      }
    } else {
      setMessages(msgs => [...msgs, { from: 'system', text: step.fallback?.prompt || 'Sorry, try again.' }]);
    }
  };

  const handleFormFieldChange = (label: string, value: string) => {
    setFormValues(prev => ({ ...prev, [label]: value }));
  };

  const handleFormSubmit = async () => {
    if (!activeForm || !companyUuid || !chatSessionId) return;
    setFormSubmitting(true);
    const res = await fetch(`${getBackendUrl()}/api/form-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: companyUuid,
        sessionId: chatSessionId,
        formId: activeForm._id,
        from: chatSessionId,
        values: formValues
      })
    });
    if (res.ok) {
      setActiveForm(null);
      setFormResponseMsg('Form submitted!');
    } else {
      setFormResponseMsg('Failed to submit form.');
    }
    setFormSubmitting(false);
  };

  const handleStartCall = async () => {
    setCallState('ringing');
    setCallError('');
    setAgentSocketId(null);
    setInCall(false);
    setCallStart(null);
    try {
      const visitorId = uuidv4();
      const pageUrl = window.location.href;
      // Use fallback companyUuid if prop is null
      const effectiveCompanyUuid = companyUuid || 'calldocker-company-uuid';
      console.log('[IVRChatWidget] Starting call. Params:', { companyUuid: effectiveCompanyUuid, visitorId, pageUrl });
      const response = await fetch(`${getBackendUrl()}/api/widget/route-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyUuid: effectiveCompanyUuid, visitorId, pageUrl, callType: 'chat' }),
      });
      const data = await response.json();
      console.log('[IVRChatWidget] /api/widget/route-call response:', data);
      if (response.ok && data.success) {
        setCallState('in-call');
        setInCall(true);
        setCallStart(new Date());
        if (data.sessionId) {
          console.log('[IVRChatWidget] Chat session created:', data.sessionId);
        }
        setMessages(prev => [...prev, { from: 'system', text: data.message || 'Call connected successfully!' }]);
      } else {
        console.error('[IVRChatWidget] Call routing failed:', data);
        setCallError(data.error || 'Failed to connect call');
        setCallState('ended');
        setTimeout(() => setCallState('idle'), 2000);
      }
    } catch (error) {
      console.error('[IVRChatWidget] Error starting call:', error);
      setCallError('Network error - please try again');
      setCallState('ended');
      setTimeout(() => setCallState('idle'), 2000);
    }
  };

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
    borderRadius: 18,
    padding: '12px 18px',
    margin: '6px 0',
    maxWidth: '80%',
    alignSelf: 'flex-start',
    border: '2px solid #F6C23E33',
    boxShadow: '0 2px 8px #F6C23E22, 0 1px 4px #00e6ef11',
  };
  const visitorBubbleStyle = {
    background: 'linear-gradient(90deg, #2E73FF 0%, #00e6ef 100%)',
    color: '#fff',
    borderRadius: 18,
    padding: '12px 18px',
    margin: '6px 0',
    maxWidth: '80%',
    alignSelf: 'flex-end',
    border: '2px solid #F6C23E33',
    boxShadow: '0 2px 8px #F6C23E22, 0 1px 4px #00e6ef11',
  };
  const chatContainerStyle = {
    display: 'flex', flexDirection: 'column', height: 340, overflowY: 'auto', background: '#fff', padding: 18, borderRadius: 20, marginBottom: 8,
    border: '2px solid #F6C23E33',
    boxShadow: '0 4px 24px #F6C23E22, 0 2px 8px #00e6ef22',
  };
  const inputBarStyle = {
    display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 24, boxShadow: '0 1px 4px #F6C23E22', padding: '4px 12px', margin: '0 8px 8px 8px', border: '2px solid #F6C23E33'
  };
  const sendBtnStyle = {
    background: 'linear-gradient(90deg, #2E73FF 0%, #00e6ef 100%)',
    borderRadius: '50%',
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    boxShadow: '0 2px 8px #F6C23E22',
    color: '#fff',
    fontSize: 22,
    border: '2px solid #F6C23E',
    cursor: 'pointer',
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

  // When agentsOnline changes to false in chat mode, show contact form
  useEffect(() => {
    if (mode === 'chat' && !agentsOnline && open) {
      setShowContactForm(true);
    } else {
      setShowContactForm(false);
    }
  }, [mode, agentsOnline, open]);

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleContactFormSubmit = async () => {
    setContactLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/widget/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        setContactSuccess(true);
        setContactForm({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setShowContactForm(false), 2000);
      } else {
        setContactSuccess(false);
      }
    } catch (e) {
      setContactSuccess(false);
    }
    setContactLoading(false);
  };

  // In chat mode, show offline contact form if no agents online
  if (mode === 'chat' && !agentsOnline && showContactForm) {
    return (
      <Modal open={open} onCancel={onClose} footer={null} width={400} centered>
        <div style={{ padding: 32, textAlign: 'center' }}>
          <RobotOutlined style={{ fontSize: 48, color: '#aaa', marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>All agents are offline</div>
          <div style={{ color: '#888', marginBottom: 24 }}>Leave us a message and we will get back to you.</div>
          {contactSuccess ? (
            <div style={{ color: '#2E73FF', fontWeight: 700, fontSize: 18, margin: '24px 0' }}>Thank you! Your message has been sent.</div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); handleContactFormSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input name="name" value={contactForm.name} onChange={handleContactFormChange} placeholder="Your Name" size="large" style={{ borderRadius: 12, border: '2px solid #F6C23E' }} required />
              <Input name="email" value={contactForm.email} onChange={handleContactFormChange} placeholder="Email Address" size="large" style={{ borderRadius: 12, border: '2px solid #F6C23E' }} required />
              <Input name="phone" value={contactForm.phone} onChange={handleContactFormChange} placeholder="Phone Number" size="large" style={{ borderRadius: 12, border: '2px solid #F6C23E' }} />
              <Input.TextArea name="message" value={contactForm.message} onChange={handleContactFormChange} placeholder="How can we help you?" rows={4} style={{ borderRadius: 12, border: '2px solid #F6C23E' }} required />
              <Button type="primary" size="large" loading={contactLoading} style={{ borderRadius: 12, background: 'linear-gradient(90deg, #2E73FF 0%, #00e6ef 100%)', fontWeight: 700, fontSize: 18, marginTop: 8 }} htmlType="submit" block>
                Send Message
              </Button>
            </form>
          )}
          <Button style={{ marginTop: 16 }} onClick={() => setMode('call')}>Back</Button>
        </div>
      </Modal>
    );
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
      centered={false}
      styles={{
        body: {
          padding: 0,
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(120deg, #2E73FF 0%, #00e6ef 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 8px 32px #2E73FF33, 0 2px 8px #00e6ef22, 0 1.5px 6px #F6C23E22',
          border: '3px solid #F6C23E',
          position: 'fixed',
          right: 24,
          bottom: 24,
          margin: 0,
        }
      }}
      style={{
        top: 'auto',
        bottom: 24,
        right: 24,
        left: 'auto',
        margin: 0,
        padding: 0,
        position: 'fixed',
        boxShadow: 'none',
        zIndex: 1200,
      }}
      closeIcon={
        <span style={{
          fontSize: 22,
          color: '#F6C23E',
          background: 'rgba(46, 115, 255, 0.08)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '50%',
          display: 'inline-block',
          border: '2px solid #F6C23E',
        }}
        onMouseEnter={e => {
          e.target.style.background = '#F6C23E22';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'rgba(46, 115, 255, 0.08)';
          e.target.style.transform = 'scale(1)';
        }}
        >×</span>
      }
      mask={false}
      maskClosable={true}
      zIndex={1200}
    >
      {/* Header with logo and gradient */}
      <div style={{
        background: 'linear-gradient(120deg, #2E73FF 0%, #00e6ef 100%)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderBottom: '2.5px solid #F6C23E',
        padding: '18px 0 10px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px #F6C23E22',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#fff',
          border: '3px solid #F6C23E',
          boxShadow: '0 2px 12px #F6C23E22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={logoSrc || logoLight}
            alt="Calldock Widget Logo"
            style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: '50%' }}
          />
        </div>
        <div style={{
          color: '#fff',
          fontWeight: 900,
          fontSize: 20,
          marginTop: 8,
          letterSpacing: 0.5,
          textShadow: '0 2px 8px #2E73FF55',
        }}>Chat with Us</div>
      </div>
      {/* Main chat area, single rounded container */}
      <div style={{
        padding: 0,
        background: 'transparent',
        borderRadius: 0,
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
                onPressEnter={() => handleSend(input)}
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
                onClick={() => handleSend(input)} 
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
              {/* Show pushed form as a chat bubble */}
              {activeForm && (
                <div style={{ ...agentBubbleStyle, background: '#eaf1ff', color: '#222', margin: '12px 0' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Agent has requested info:</div>
                  <form onSubmit={e => { e.preventDefault(); handleFormSubmit(); }}>
                    {activeForm.fields.map((field, idx) => (
                      <div key={idx} style={{ marginBottom: 10 }}>
                        <label style={{ fontWeight: 500 }}>{field.label}{field.required && ' *'}</label>
                        <Input
                          type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                          value={formValues[field.label] || ''}
                          onChange={e => handleFormFieldChange(field.label, e.target.value)}
                          required={field.required}
                          style={{ borderRadius: 8, marginTop: 4 }}
                        />
                      </div>
                    ))}
                    <Button type="primary" htmlType="submit" loading={formSubmitting} style={{ borderRadius: 8, fontWeight: 600, marginTop: 8 }}>Submit</Button>
                  </form>
                </div>
              )}
              {formResponseMsg && (
                <div style={{ ...agentBubbleStyle, background: '#eaf1ff', color: '#222', margin: '12px 0' }}>{formResponseMsg}</div>
              )}
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
