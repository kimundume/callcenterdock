// Call Synchronization Service - Ensures perfect sync between visitor and agent
import { Server } from 'socket.io';

interface CallSession {
  sessionId: string;
  visitorSocketId: string;
  agentSocketId: string;
  agentUsername: string;
  companyUuid: string;
  status: 'ringing' | 'connected' | 'ended';
  startTime: Date;
  visitorState: {
    hasAudio: boolean;
    isMuted: boolean;
    isConnected: boolean;
  };
  agentState: {
    hasAudio: boolean;
    isMuted: boolean;
    isConnected: boolean;
  };
}

export class CallSynchronizationService {
  private io: Server;
  private activeCalls: Map<string, CallSession> = new Map();
  private agentCalls: Map<string, string[]> = new Map(); // agentUsername -> sessionIds[]

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[CallSync] Socket connected: ${socket.id}`);

      // Call acceptance - triggers automatic audio connection
      socket.on('accept-call', (data) => {
        this.handleCallAccepted(socket, data);
      });

      // Call termination - ensures both sides disconnect
      socket.on('end-call', (data) => {
        this.handleCallEnded(socket, data);
      });

      // Audio state changes
      socket.on('audio-state-change', (data) => {
        this.handleAudioStateChange(socket, data);
      });

      // Mute/unmute synchronization
      socket.on('toggle-mute', (data) => {
        this.handleToggleMute(socket, data);
      });

      // WebRTC signaling with proper routing
      socket.on('webrtc-offer', (data) => {
        this.handleWebRTCOffer(socket, data);
      });

      socket.on('webrtc-answer', (data) => {
        this.handleWebRTCAnswer(socket, data);
      });

      socket.on('webrtc-ice-candidate', (data) => {
        this.handleWebRTCIceCandidate(socket, data);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        this.handleSocketDisconnect(socket.id);
      });
    });
  }

  // Create a new call session
  createCallSession(data: {
    sessionId: string;
    visitorSocketId: string;
    agentUsername: string;
    companyUuid: string;
  }): CallSession {
    const session: CallSession = {
      sessionId: data.sessionId,
      visitorSocketId: data.visitorSocketId,
      agentSocketId: '', // Will be set when agent accepts
      agentUsername: data.agentUsername,
      companyUuid: data.companyUuid,
      status: 'ringing',
      startTime: new Date(),
      visitorState: {
        hasAudio: false,
        isMuted: false,
        isConnected: false
      },
      agentState: {
        hasAudio: false,
        isMuted: false,
        isConnected: false
      }
    };

    this.activeCalls.set(data.sessionId, session);
    
    // Track agent calls
    if (!this.agentCalls.has(data.agentUsername)) {
      this.agentCalls.set(data.agentUsername, []);
    }
    this.agentCalls.get(data.agentUsername)!.push(data.sessionId);

    console.log(`[CallSync] Created call session: ${data.sessionId}`);
    return session;
  }

  // Handle call acceptance - critical synchronization point
  private handleCallAccepted(socket: any, data: { sessionId: string; agentUsername: string }) {
    const session = this.activeCalls.get(data.sessionId);
    if (!session) {
      console.error(`[CallSync] Session not found: ${data.sessionId}`);
      return;
    }

    // Update session state
    session.agentSocketId = socket.id;
    session.status = 'connected';
    
    console.log(`[CallSync] Call accepted: ${data.sessionId} by agent: ${data.agentUsername}`);

    // Notify both sides that call is connected
    this.syncCallStateToAll(session, {
      type: 'call-connected',
      message: 'Call connected successfully',
      showCallControls: true,
      enableAudio: true
    });

    // Start WebRTC setup process
    this.initiateWebRTCSetup(session);
  }

  // Handle call termination - ensures both sides disconnect
  private handleCallEnded(socket: any, data: { sessionId: string; reason?: string }) {
    const session = this.activeCalls.get(data.sessionId);
    if (!session) {
      console.error(`[CallSync] Session not found for termination: ${data.sessionId}`);
      return;
    }

    console.log(`[CallSync] Call ended: ${data.sessionId}, reason: ${data.reason || 'user_initiated'}`);

    // Update session state
    session.status = 'ended';

    // Notify both sides immediately
    this.syncCallStateToAll(session, {
      type: 'call-ended',
      message: 'Call ended',
      showCallControls: false,
      enableAudio: false,
      reason: data.reason || 'user_initiated'
    });

    // Clean up
    this.cleanupCallSession(session);
  }

  // Synchronize call state to both visitor and agent
  private syncCallStateToAll(session: CallSession, update: any) {
    const syncData = {
      sessionId: session.sessionId,
      callStatus: session.status,
      visitorState: session.visitorState,
      agentState: session.agentState,
      ...update
    };

    // Send to visitor
    if (session.visitorSocketId) {
      this.io.to(session.visitorSocketId).emit('call-state-sync', {
        ...syncData,
        userType: 'visitor'
      });
    }

    // Send to agent
    if (session.agentSocketId) {
      this.io.to(session.agentSocketId).emit('call-state-sync', {
        ...syncData,
        userType: 'agent'
      });
    }

    // Also broadcast to session room
    this.io.to(`session-${session.sessionId}`).emit('call-state-sync', syncData);
  }

  // Handle audio state changes
  private handleAudioStateChange(socket: any, data: { sessionId: string; hasAudio: boolean; userType: 'visitor' | 'agent' }) {
    const session = this.activeCalls.get(data.sessionId);
    if (!session) return;

    // Update state
    if (data.userType === 'visitor') {
      session.visitorState.hasAudio = data.hasAudio;
    } else {
      session.agentState.hasAudio = data.hasAudio;
    }

    // Sync to other party
    this.syncCallStateToAll(session, {
      type: 'audio-state-changed',
      audioUpdate: {
        userType: data.userType,
        hasAudio: data.hasAudio
      }
    });
  }

  // Handle mute/unmute with synchronization
  private handleToggleMute(socket: any, data: { sessionId: string; isMuted: boolean; userType: 'visitor' | 'agent' }) {
    const session = this.activeCalls.get(data.sessionId);
    if (!session) return;

    // Update state
    if (data.userType === 'visitor') {
      session.visitorState.isMuted = data.isMuted;
    } else {
      session.agentState.isMuted = data.isMuted;
    }

    // Sync to other party
    this.syncCallStateToAll(session, {
      type: 'mute-state-changed',
      muteUpdate: {
        userType: data.userType,
        isMuted: data.isMuted
      }
    });
  }

  // Enhanced WebRTC signaling with proper routing
  private handleWebRTCOffer(socket: any, data: { sessionId: string; offer: any }) {
    const session = this.activeCalls.get(data.sessionId);
    if (!session) return;

    console.log(`[CallSync] WebRTC offer from ${socket.id} for session ${data.sessionId}`);

    // Determine target socket
    const targetSocketId = socket.id === session.visitorSocketId ? session.agentSocketId : session.visitorSocketId;
    
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('webrtc-offer', {
        sessionId: data.sessionId,
        offer: data.offer,
        fromSocketId: socket.id
      });
    }
  }

  private handleWebRTCAnswer(socket: any, data: { sessionId: string; answer: any }) {
    const session = this.activeCalls.get(data.sessionId);
    if (!session) return;

    console.log(`[CallSync] WebRTC answer from ${socket.id} for session ${data.sessionId}`);

    // Determine target socket
    const targetSocketId = socket.id === session.visitorSocketId ? session.agentSocketId : session.visitorSocketId;
    
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('webrtc-answer', {
        sessionId: data.sessionId,
        answer: data.answer,
        fromSocketId: socket.id
      });
    }

    // Mark both sides as connected
    session.visitorState.isConnected = true;
    session.agentState.isConnected = true;
    
    this.syncCallStateToAll(session, {
      type: 'webrtc-connected',
      message: 'Audio connection established'
    });
  }

  private handleWebRTCIceCandidate(socket: any, data: { sessionId: string; candidate: any }) {
    const session = this.activeCalls.get(data.sessionId);
    if (!session) return;

    // Determine target socket
    const targetSocketId = socket.id === session.visitorSocketId ? session.agentSocketId : session.visitorSocketId;
    
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('webrtc-ice-candidate', {
        sessionId: data.sessionId,
        candidate: data.candidate,
        fromSocketId: socket.id
      });
    }
  }

  // Initiate WebRTC setup after call acceptance
  private initiateWebRTCSetup(session: CallSession) {
    console.log(`[CallSync] Initiating WebRTC setup for session: ${session.sessionId}`);
    
    // Signal visitor to start WebRTC offer
    if (session.visitorSocketId) {
      this.io.to(session.visitorSocketId).emit('start-webrtc-call', {
        sessionId: session.sessionId,
        agentConnected: true
      });
    }
  }

  // Clean up call session
  private cleanupCallSession(session: CallSession) {
    // Remove from active calls
    this.activeCalls.delete(session.sessionId);
    
    // Remove from agent calls tracking
    const agentSessions = this.agentCalls.get(session.agentUsername);
    if (agentSessions) {
      const index = agentSessions.indexOf(session.sessionId);
      if (index > -1) {
        agentSessions.splice(index, 1);
      }
    }

    console.log(`[CallSync] Cleaned up call session: ${session.sessionId}`);
  }

  // Handle socket disconnection
  private handleSocketDisconnect(socketId: string) {
    // Find sessions with this socket
    for (const [sessionId, session] of this.activeCalls) {
      if (session.visitorSocketId === socketId || session.agentSocketId === socketId) {
        console.log(`[CallSync] Socket disconnected during call: ${socketId}, ending session: ${sessionId}`);
        this.handleCallEnded({ id: socketId }, { 
          sessionId, 
          reason: 'socket_disconnected' 
        });
      }
    }
  }

  // Get active calls for an agent
  getAgentActiveCalls(agentUsername: string): CallSession[] {
    const sessionIds = this.agentCalls.get(agentUsername) || [];
    return sessionIds.map(id => this.activeCalls.get(id)).filter(Boolean) as CallSession[];
  }

  // Check if agent is available for new calls
  isAgentAvailable(agentUsername: string, maxCalls: number = 5): boolean {
    const activeCalls = this.getAgentActiveCalls(agentUsername);
    const connectedCalls = activeCalls.filter(call => call.status === 'connected').length;
    return connectedCalls < maxCalls;
  }

  // Get all active sessions
  getAllActiveSessions(): CallSession[] {
    return Array.from(this.activeCalls.values());
  }
}

export default CallSynchronizationService;
