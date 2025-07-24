import { Server, Socket } from 'socket.io';
import { agents, calls } from '../data/tempDB';

export function registerSignalingHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // Agent registration
    socket.on('register-agent', (data) => {
      const { uuid, agentId } = data;
      if (!uuid || !agentId) return;
      if (!agents[uuid]) agents[uuid] = {};
      agents[uuid][agentId] = { socketId: socket.id, online: true, registeredAt: new Date().toISOString() };
      socket.data = { uuid, agentId };
      socket.emit('agent-registered', { success: true, uuid, agentId });
    });

    // Handle agent disconnect
    socket.on('disconnect', () => {
      const { uuid, agentId } = socket.data || {};
      if (uuid && agentId && agents[uuid] && agents[uuid][agentId]) {
        delete agents[uuid][agentId];
      }
    });

    // Call request and routing
    socket.on('call-request', (data) => {
      const { uuid } = data;
      if (!uuid || !agents[uuid]) {
        socket.emit('call-routed', { success: false, reason: 'No such company or no agents online' });
        return;
      }
      const agentIds = Object.keys(agents[uuid]);
      if (agentIds.length === 0) {
        socket.emit('call-routed', { success: false, reason: 'No agents online' });
        return;
      }
      // Route to first available agent
      const agentId = agentIds[0];
      const agent = agents[uuid][agentId];
      io.to(agent.socketId).emit('incoming-call', { uuid, agentId, callTime: new Date().toISOString(), fromSocketId: socket.id });
      // Log the call
      if (!calls[uuid]) calls[uuid] = [];
      const callLog = { from: socket.id, to: agentId, time: new Date().toISOString(), status: 'routed' };
      calls[uuid].push(callLog);
      // Respond to widget with agentSocketId for signaling
      console.log('[Backend] Sending call-routed with agentSocketId:', agent.socketId); // Debug log
      socket.emit('call-routed', { success: true, agentSocketId: agent.socketId });
    });

    // Agent accepts call
    socket.on('accept-call', (data) => {
      const { uuid, agentId, fromSocketId } = data;
      if (!uuid || !agentId || !fromSocketId) return;
      // Update call log
      if (calls[uuid]) {
        const call = calls[uuid].find((c: any) => c.from === fromSocketId && c.to === agentId && c.status === 'routed');
        if (call) call.status = 'accepted';
      }
      // Notify widget/client
      io.to(fromSocketId).emit('call-status', { status: 'accepted', agentId });
    });

    // Agent rejects call
    socket.on('reject-call', (data) => {
      const { uuid, agentId, fromSocketId } = data;
      if (!uuid || !agentId || !fromSocketId) return;
      // Update call log
      if (calls[uuid]) {
        const call = calls[uuid].find((c: any) => c.from === fromSocketId && c.to === agentId && c.status === 'routed');
        if (call) call.status = 'rejected';
      }
      // Notify widget/client
      io.to(fromSocketId).emit('call-status', { status: 'rejected', agentId });
    });

    // WebRTC signaling: offer
    socket.on('webrtc-offer', (data) => {
      const { toSocketId, offer } = data;
      if (toSocketId && offer) {
        io.to(toSocketId).emit('webrtc-offer', { fromSocketId: socket.id, offer });
      }
    });

    // WebRTC signaling: answer
    socket.on('webrtc-answer', (data) => {
      const { toSocketId, answer } = data;
      if (toSocketId && answer) {
        io.to(toSocketId).emit('webrtc-answer', { fromSocketId: socket.id, answer });
      }
    });

    // WebRTC signaling: ICE candidate
    socket.on('webrtc-ice-candidate', (data) => {
      const { toSocketId, candidate } = data;
      if (toSocketId && candidate) {
        io.to(toSocketId).emit('webrtc-ice-candidate', { fromSocketId: socket.id, candidate });
      }
    });
    // ... other events
  });
} 