"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSignalingHandlers = registerSignalingHandlers;
const tempDB_1 = require("../data/tempDB");
function registerSignalingHandlers(io) {
    io.on('connection', (socket) => {
        // Agent registration
        socket.on('register-agent', (data) => {
            const { uuid, agentId } = data;
            if (!uuid || !agentId)
                return;
            if (!tempDB_1.agents[uuid])
                tempDB_1.agents[uuid] = {};
            tempDB_1.agents[uuid][agentId] = { socketId: socket.id, online: true, registeredAt: new Date().toISOString() };
            socket.data = { uuid, agentId };
            socket.emit('agent-registered', { success: true, uuid, agentId });
            // PATCH: Also update tempStorage.agents
            if (global.tempStorage && Array.isArray(global.tempStorage.agents)) {
                const agent = global.tempStorage.agents.find(a => a.companyUuid === uuid && a.username === agentId);
                if (agent) {
                    agent.status = 'online';
                    agent.registrationStatus = 'approved';
                }
            }
        });
        // Call request and queueing
        socket.on('call-request', (data) => {
            const { uuid } = data;
            if (!uuid) {
                socket.emit('call-routed', { success: false, reason: 'No company specified' });
                return;
            }
            if (!tempDB_1.callQueue[uuid])
                tempDB_1.callQueue[uuid] = [];
            // Add to queue if not already present
            if (!tempDB_1.callQueue[uuid].includes(socket.id))
                tempDB_1.callQueue[uuid].push(socket.id);
            // If no agents online
            if (!tempDB_1.agents[uuid] || Object.keys(tempDB_1.agents[uuid]).length === 0) {
                socket.emit('call-routed', { success: false, reason: 'No agents online' });
                tempDB_1.callQueue[uuid] = tempDB_1.callQueue[uuid].filter(id => id !== socket.id);
                return;
            }
            // Calculate position and estimate
            const position = tempDB_1.callQueue[uuid].indexOf(socket.id) + 1;
            const estimate = Math.max(1, position) * 30; // 30s per call as a rough estimate
            socket.emit('queue-update', { position, estimate });
            // If first in queue, try to route to agent
            if (position === 1) {
                const agentIds = Object.keys(tempDB_1.agents[uuid]);
                if (agentIds.length > 0) {
                    const agentId = agentIds[0];
                    const agent = tempDB_1.agents[uuid][agentId];
                    io.to(agent.socketId).emit('incoming-call', { uuid, agentId, callTime: new Date().toISOString(), fromSocketId: socket.id });
                    // Log the call
                    if (!tempDB_1.calls[uuid])
                        tempDB_1.calls[uuid] = [];
                    const callLog = { from: socket.id, to: agentId, time: new Date().toISOString(), status: 'routed' };
                    tempDB_1.calls[uuid].push(callLog);
                    socket.emit('call-routed', { success: true, agentSocketId: agent.socketId });
                }
            }
        });
        // Periodically broadcast queue positions/estimates
        const queueInterval = setInterval(() => {
            Object.keys(tempDB_1.callQueue).forEach(uuid => {
                tempDB_1.callQueue[uuid].forEach((sid, idx) => {
                    const estimate = Math.max(1, idx + 1) * 30;
                    io.to(sid).emit('queue-update', { position: idx + 1, estimate });
                });
            });
        }, 5000);
        // Agent accepts call
        socket.on('accept-call', (data) => {
            const { uuid, agentId, fromSocketId, sessionId } = data;
            if (!uuid || !agentId || !fromSocketId || !sessionId)
                return;
            // Remove caller from queue
            if (tempDB_1.callQueue[uuid])
                tempDB_1.callQueue[uuid] = tempDB_1.callQueue[uuid].filter(id => id !== fromSocketId);
            // Update call log
            if (tempDB_1.calls[uuid]) {
                const call = tempDB_1.calls[uuid].find((c) => c.from === fromSocketId && c.to === agentId && c.status === 'routed');
                if (call)
                    call.status = 'accepted';
            }
            // Update session status
            if (global.tempStorage && Array.isArray(global.tempStorage.sessions)) {
                const session = global.tempStorage.sessions.find(s => s.sessionId === sessionId);
                if (session)
                    session.status = 'active';
            }
            // Notify widget/client
            io.to(fromSocketId).emit('call-status', { status: 'accepted', agentId });
            // Update queue positions for others
            if (tempDB_1.callQueue[uuid]) {
                tempDB_1.callQueue[uuid].forEach((sid, idx) => {
                    const estimate = Math.max(1, idx + 1) * 30;
                    io.to(sid).emit('queue-update', { position: idx + 1, estimate });
                });
            }
        });
        // Agent rejects call
        socket.on('reject-call', (data) => {
            const { uuid, agentId, fromSocketId, sessionId } = data;
            if (!uuid || !agentId || !fromSocketId || !sessionId)
                return;
            // Remove caller from queue
            if (tempDB_1.callQueue[uuid])
                tempDB_1.callQueue[uuid] = tempDB_1.callQueue[uuid].filter(id => id !== fromSocketId);
            // Update call log
            if (tempDB_1.calls[uuid]) {
                const call = tempDB_1.calls[uuid].find((c) => c.from === fromSocketId && c.to === agentId && c.status === 'routed');
                if (call)
                    call.status = 'rejected';
            }
            // Update session status
            if (global.tempStorage && Array.isArray(global.tempStorage.sessions)) {
                const session = global.tempStorage.sessions.find(s => s.sessionId === sessionId);
                if (session)
                    session.status = 'ended';
            }
            // Notify widget/client
            io.to(fromSocketId).emit('call-status', { status: 'rejected', agentId });
            // Update queue positions for others
            if (tempDB_1.callQueue[uuid]) {
                tempDB_1.callQueue[uuid].forEach((sid, idx) => {
                    const estimate = Math.max(1, idx + 1) * 30;
                    io.to(sid).emit('queue-update', { position: idx + 1, estimate });
                });
            }
        });
        // On disconnect, remove from queue
        socket.on('disconnect', () => {
            Object.keys(tempDB_1.callQueue).forEach(uuid => {
                tempDB_1.callQueue[uuid] = tempDB_1.callQueue[uuid].filter(id => id !== socket.id);
            });
            const { uuid, agentId } = socket.data || {};
            if (uuid && agentId && tempDB_1.agents[uuid] && tempDB_1.agents[uuid][agentId]) {
                delete tempDB_1.agents[uuid][agentId];
            }
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
        // Test call request from admin
        socket.on('test-call-request', (data) => {
            const { uuid } = data;
            if (!uuid || !tempDB_1.agents[uuid]) {
                socket.emit('test-call-result', { success: false, reason: 'No such company or no agents online' });
                return;
            }
            const agentIds = Object.keys(tempDB_1.agents[uuid]);
            if (agentIds.length === 0) {
                socket.emit('test-call-result', { success: false, reason: 'No agents online' });
                return;
            }
            // Route to first available agent
            const agentId = agentIds[0];
            const agent = tempDB_1.agents[uuid][agentId];
            io.to(agent.socketId).emit('test-incoming-call', { uuid, agentId, fromSocketId: socket.id, test: true });
            socket.emit('test-call-result', { success: true, agentId });
        });
        // --- Chat Events (MVP, non-breaking) ---
        socket.on('chat:join', (data) => {
            // data: { sessionId, companyUuid, visitorId, pageUrl }
            if (!data.sessionId || !data.companyUuid || !data.visitorId)
                return;
            if (!tempDB_1.chatSessions[data.sessionId]) {
                tempDB_1.chatSessions[data.sessionId] = {
                    companyUuid: data.companyUuid,
                    visitorId: data.visitorId,
                    pageUrl: data.pageUrl,
                    startedAt: new Date().toISOString(),
                    messages: []
                };
            }
            socket.join(data.sessionId);
            socket.emit('chat:joined', { sessionId: data.sessionId });
        });
        socket.on('chat:message', (data) => {
            // data: { sessionId, message, from, timestamp }
            if (!data.sessionId || !data.message || !data.from)
                return;
            const msg = {
                message: data.message,
                from: data.from,
                timestamp: data.timestamp || new Date().toISOString()
            };
            if (tempDB_1.chatSessions[data.sessionId]) {
                tempDB_1.chatSessions[data.sessionId].messages.push(msg);
            }
            // Also save to backend storage for persistence
            const chatMessage = {
                _id: Math.random().toString(36).substr(2, 9),
                companyId: data.companyId || 'demo-company-001',
                sessionId: data.sessionId,
                message: data.message,
                from: data.from,
                timestamp: data.timestamp || new Date().toISOString()
            };
            // Access the tempStorage from the global scope (we'll need to pass it)
            if (global.tempStorage) {
                global.tempStorage.chatMessages.push(chatMessage);
                console.log('Chat message saved to backend storage:', chatMessage);
            }
            io.to(data.sessionId).emit('chat:message', Object.assign(Object.assign({}, msg), { sessionId: data.sessionId }));
        });
        socket.on('chat:typing', (data) => {
            // data: { sessionId, from }
            // To be implemented: broadcast typing indicator
            socket.to(data.sessionId).emit('chat:typing', data);
        });
        socket.on('chat:end', (data) => {
            // data: { sessionId }
            // To be implemented: end chat session
            socket.leave(data.sessionId);
            socket.emit('chat:ended', { sessionId: data.sessionId });
        });
    });
}
