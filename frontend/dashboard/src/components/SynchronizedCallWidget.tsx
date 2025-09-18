// Synchronized Call Widget - Ensures perfect sync between visitor and agent
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getBackendUrl } from '../config';

interface CallState {
  status: 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended';
  sessionId: string | null;
  agentName: string | null;
  showCallControls: boolean;
  isAudioEnabled: boolean;
  isMuted: boolean;
  audioConnected: boolean;
  remoteAudioAvailable: boolean;
}

interface SynchronizedCallWidgetProps {
  companyUuid: string;
  visitorId: string;
  pageUrl: string;
  onCallStateChange?: (state: CallState) => void;
}

export const SynchronizedCallWidget: React.FC<SynchronizedCallWidgetProps> = ({
  companyUuid,
  visitorId,
  pageUrl,
  onCallStateChange
}) => {
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    sessionId: null,
    agentName: null,
    showCallControls: false,
    isAudioEnabled: false,
    isMuted: false,
    audioConnected: false,
    remoteAudioAvailable: false
  });

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Update parent component when call state changes
  useEffect(() => {
    onCallStateChange?.(callState);
  }, [callState, onCallStateChange]);

  // Initialize socket connection
  useEffect(() => {
    const socket = io(getBackendUrl(), {
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SyncWidget] Socket connected:', socket.id);
      
      // Join visitor room for this session
      socket.emit('join-room', { 
        room: `visitor-${visitorId}`,
        userType: 'visitor',
        visitorId: visitorId
      });
    });

    // Listen for call state synchronization
    socket.on('call-state-sync', (data) => {
      console.log('[SyncWidget] Call state sync received:', data);
      handleCallStateSync(data);
    });

    // Listen for WebRTC signaling
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('ice-candidate', handleWebRTCIceCandidate);
    socket.on('start-webrtc-call', handleStartWebRTCCall);

    // Listen for call events
    socket.on('call-accepted', (data) => {
      console.log('[SyncWidget] Call accepted by agent:', data);
      updateCallState({ 
        status: 'connected', 
        showCallControls: true,
        agentName: data.agentName 
      });
    });

    socket.on('call-ended', (data) => {
      console.log('[SyncWidget] Call ended:', data);
      endCall('remote_ended');
    });

    return () => {
      socket.disconnect();
    };
  }, [visitorId]);

  // Handle synchronized call state updates
  const handleCallStateSync = useCallback((data: any) => {
    if (data.userType !== 'visitor') return;

    const stateUpdate: Partial<CallState> = {};

    switch (data.type) {
      case 'call-connected':
        stateUpdate.status = 'connected';
        stateUpdate.showCallControls = true;
        if (data.enableAudio) {
          initializeAudio();
        }
        break;

      case 'call-ended':
        stateUpdate.status = 'ended';
        stateUpdate.showCallControls = false;
        stateUpdate.isAudioEnabled = false;
        cleanupCall();
        break;

      case 'audio-state-changed':
        if (data.audioUpdate?.userType === 'agent') {
          stateUpdate.remoteAudioAvailable = data.audioUpdate.hasAudio;
        }
        break;

      case 'mute-state-changed':
        if (data.muteUpdate?.userType === 'agent') {
          // Agent muted/unmuted - we could show this in UI
          console.log('[SyncWidget] Agent mute state:', data.muteUpdate.isMuted);
        }
        break;

      case 'webrtc-connected':
        stateUpdate.audioConnected = true;
        break;
    }

    if (Object.keys(stateUpdate).length > 0) {
      updateCallState(stateUpdate);
    }
  }, []);

  // Update call state helper
  const updateCallState = useCallback((updates: Partial<CallState>) => {
    setCallState(prev => ({ ...prev, ...updates }));
  }, []);

  // Start a call
  const startCall = async () => {
    try {
      updateCallState({ status: 'connecting' });

      const response = await fetch(`${getBackendUrl()}/api/widget/route-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyUuid,
          visitorId,
          pageUrl,
          callType: 'call'
        })
      });

      const data = await response.json();

      if (data.success) {
        updateCallState({
          status: 'ringing',
          sessionId: data.sessionId,
          agentName: data.agent
        });

        // Join session room for this call
        socketRef.current?.emit('join-room', {
          room: `session-${data.sessionId}`,
          userType: 'visitor',
          sessionId: data.sessionId
        });

        console.log('[SyncWidget] Call initiated successfully:', data.sessionId);
      } else {
        updateCallState({ status: 'idle' });
        alert(data.message || 'Call failed to connect');
      }
    } catch (error) {
      console.error('[SyncWidget] Call start error:', error);
      updateCallState({ status: 'idle' });
    }
  };

  // Initialize audio
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      updateCallState({ isAudioEnabled: true });
      
      // Notify server of audio state
      socketRef.current?.emit('audio-state-change', {
        sessionId: callState.sessionId,
        hasAudio: true,
        userType: 'visitor'
      });

      console.log('[SyncWidget] Audio initialized successfully');
    } catch (error) {
      console.error('[SyncWidget] Audio initialization failed:', error);
    }
  };

  // WebRTC Handlers
  const handleStartWebRTCCall = useCallback(async (data: any) => {
    console.log('[SyncWidget] Starting WebRTC for call:', data);
    await setupWebRTCConnection();
    await createAndSendOffer();
  }, []);

  const setupWebRTCConnection = async () => {
    const configuration = {
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
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('[SyncWidget] Remote track received');
      const remoteStream = event.streams[0];
      
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play();
      }
      
      updateCallState({ 
        audioConnected: true,
        remoteAudioAvailable: true 
      });
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', {
          sessionId: callState.sessionId,
          candidate: event.candidate
        });
      }
    };
  };

  const createAndSendOffer = async () => {
    if (!peerConnectionRef.current) return;

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current?.emit('webrtc-offer', {
        sessionId: callState.sessionId,
        offer: offer
      });

      console.log('[SyncWidget] WebRTC offer sent');
    } catch (error) {
      console.error('[SyncWidget] Failed to create offer:', error);
    }
  };

  const handleWebRTCOffer = useCallback(async (data: any) => {
    console.log('[SyncWidget] Received WebRTC offer (unexpected for visitor)');
    // Visitors typically don't receive offers, but handle it just in case
  }, []);

  const handleWebRTCAnswer = useCallback(async (data: any) => {
    if (!peerConnectionRef.current || data.sessionId !== callState.sessionId) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
      console.log('[SyncWidget] WebRTC answer processed');
    } catch (error) {
      console.error('[SyncWidget] Failed to process answer:', error);
    }
  }, [callState.sessionId]);

  const handleWebRTCIceCandidate = useCallback(async (data: any) => {
    if (!peerConnectionRef.current || data.sessionId !== callState.sessionId) return;

    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('[SyncWidget] Failed to add ICE candidate:', error);
    }
  }, [callState.sessionId]);

  // Toggle mute
  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const newMutedState = !audioTrack.enabled;
      
      updateCallState({ isMuted: newMutedState });
      
      // Notify server
      socketRef.current?.emit('toggle-mute', {
        sessionId: callState.sessionId,
        isMuted: newMutedState,
        userType: 'visitor'
      });

      console.log('[SyncWidget] Mute toggled:', newMutedState);
    }
  };

  // End call
  const endCall = (reason = 'user_initiated') => {
    console.log('[SyncWidget] Ending call, reason:', reason);

    // Notify server
    socketRef.current?.emit('end-call', {
      sessionId: callState.sessionId,
      reason: reason
    });

    cleanupCall();
    updateCallState({
      status: 'idle',
      sessionId: null,
      agentName: null,
      showCallControls: false,
      isAudioEnabled: false,
      isMuted: false,
      audioConnected: false,
      remoteAudioAvailable: false
    });
  };

  // Cleanup call resources
  const cleanupCall = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear remote audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  return (
    <div className="synchronized-call-widget">
      {/* Hidden remote audio element */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline 
        style={{ display: 'none' }}
      />
      
      {/* Call Status Display */}
      <div className="call-status">
        <p>Status: {callState.status}</p>
        {callState.agentName && <p>Agent: {callState.agentName}</p>}
        {callState.sessionId && <p>Session: {callState.sessionId}</p>}
      </div>

      {/* Call Controls */}
      {callState.status === 'idle' && (
        <button 
          onClick={startCall}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          📞 Start Call
        </button>
      )}

      {callState.status === 'connecting' && (
        <div className="text-blue-600">
          📞 Connecting...
        </div>
      )}

      {callState.status === 'ringing' && (
        <div className="text-orange-600">
          📞 Ringing... Waiting for agent to answer
        </div>
      )}

      {callState.showCallControls && callState.status === 'connected' && (
        <div className="call-controls flex gap-4">
          <button 
            onClick={toggleMute}
            className={`px-4 py-2 rounded ${
              callState.isMuted 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-600 text-white'
            }`}
          >
            {callState.isMuted ? '🔇 Muted' : '🎤 Unmute'}
          </button>
          
          <button 
            onClick={() => endCall()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            📞 End Call
          </button>
          
          <div className="status-indicators flex gap-2">
            <span className={`px-2 py-1 rounded text-sm ${
              callState.audioConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}>
              {callState.audioConnected ? '🔊 Audio Connected' : '🔇 No Audio'}
            </span>
            
            {callState.remoteAudioAvailable && (
              <span className="px-2 py-1 rounded text-sm bg-blue-200 text-blue-800">
                👤 Agent Audio Active
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SynchronizedCallWidget;
