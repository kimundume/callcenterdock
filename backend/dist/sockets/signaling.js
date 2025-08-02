"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSignalingHandlers = registerSignalingHandlers;
const path_1 = __importDefault(require("path"));
// Import persistentStorage with robust fallback
let persistentStorage;
let agents;
let sessions;
let saveSessions;
let callQueue;
let calls;

try {
    // Try multiple import strategies
    const possiblePaths = [
        '../data/persistentStorage',
        path_1.default.resolve(__dirname, '../data/persistentStorage'),
        path_1.default.resolve(__dirname, '../data/persistentStorage.js'),
        path_1.default.join(__dirname, '../data/persistentStorage'),
        path_1.default.join(__dirname, '../data/persistentStorage.js')
    ];
    let importSuccess = false;
    for (const importPath of possiblePaths) {
        try {
            persistentStorage = require(importPath);
            agents = persistentStorage.agents;
            sessions = persistentStorage.sessions;
            saveSessions = persistentStorage.saveSessions;
            callQueue = persistentStorage.callQueue;
            calls = persistentStorage.calls;
            console.log(`✅ persistentStorage imported successfully from: ${importPath}`);
            importSuccess = true;
            break;
        }
        catch (pathError) {
            console.log(`⚠️  Failed to import from: ${importPath}`);
        }
    }
    if (!importSuccess) {
        throw new Error('All import paths failed');
    }
}
catch (error) {
    console.error('❌ Failed to import persistentStorage:', error.message);
    console.error('📁 Current directory:', __dirname);
    console.error('📁 Available files in dist/data:', require('fs').readdirSync(path_1.default.join(__dirname, '../data')).join(', '));
    throw new Error(`Failed to import persistentStorage: ${error.message}`);
}
// In-memory storage for socket connections
const socketConnections = {}; // agentId -> socketId
function registerSignalingHandlers(io) {
    io.on('connection', (socket) => {
        // Agent registration
        socket.on('register-agent', (data) => {
            const { uuid, agentId } = data;
            if (!uuid || !agentId)
                return;
            // Find agent in persistent storage
            const agent = Object.values(agents).find((a) => a.companyUuid === uuid && a.username === agentId);
            if (agent) {
                // Store socket connection
                socketConnections[agentId] = socket.id;
                socket.data = { uuid, agentId };
                socket.join(`company-${uuid}`);
                socket.emit('agent-registered', { success: true });
            }
        });
        // Join room for agent-specific events
        socket.on('join-room', (data) => {
            const { room } = data;
            if (room) {
                socket.join(room);
                console.log(`Socket ${socket.id} joined room: ${room}`);
            }
        });
        // Agent status update
        // Call request and queueing
        socket.on('call-request', (data) => {
            const { uuid } = data;
            if (!uuid) {
                socket.emit('call-routed', { success: false, reason: 'No company specified' });
                return;
            }
            if (!callQueue[uuid])
                callQueue[uuid] = [];
            // Add to queue if not already present
            if (!callQueue[uuid].includes(socket.id))
                callQueue[uuid].push(socket.id);
            // If no agents online
            if (!agents[uuid] || Object.keys(agents[uuid]).length === 0) {
                socket.emit('call-routed', { success: false, reason: 'No agents online' });
                callQueue[uuid] = callQueue[uuid].filter(id => id !== socket.id);
                return;
            }
            // Calculate position and estimate
            const position = callQueue[uuid].indexOf(socket.id) + 1;
            const estimate = Math.max(1, position) * 30; // 30s per call as a rough estimate
            socket.emit('queue-update', { position, estimate });
            // If first in queue, try to route to agent
            if (position === 1) {
                const agentIds = Object.keys(agents[uuid]);
                if (agentIds.length > 0) {
                    const agentId = agentIds[0];
                    const agent = agents[uuid][agentId];
                    io.to(agent.socketId).emit('incoming-call', { uuid, agentId, callTime: new Date().toISOString(), fromSocketId: socket.id });
                    // Log the call
                    if (!calls[uuid])
                        calls[uuid] = [];
                    const callLog = { from: socket.id, to: agentId, time: new Date().toISOString(), status: 'routed' };
                    calls[uuid].push(callLog);
                    socket.emit('call-routed', { success: true, agentSocketId: agent.socketId });
                }
            }
        });
        // Periodically broadcast queue positions/estimates
        const queueInterval = setInterval(() => {
            Object.keys(callQueue).forEach(uuid => {
                callQueue[uuid].forEach((sid, idx) => {
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
            if (callQueue[uuid])
                callQueue[uuid] = callQueue[uuid].filter(id => id !== fromSocketId);
            // Update call log
            if (calls[uuid]) {
                const call = calls[uuid].find((c) => c.from === fromSocketId && c.to === agentId && c.status === 'routed');
                if (call)
                    call.status = 'accepted';
            }
            // Update session status
            socket.on('update-session-status', (data) => {
                const { sessionId, status } = data;
                if (!sessionId || !status)
                    return;
                // Find session in persistent storage
                const session = Object.values(sessions).find((s) => s.sessionId === sessionId);
                if (session) {
                    session.status = status;
                    saveSessions();
                }
            });
            // Notify widget/client
            io.to(fromSocketId).emit('call-status', { status: 'accepted', agentId });
            // Update queue positions for others
            if (callQueue[uuid]) {
                callQueue[uuid].forEach((sid, idx) => {
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
            if (callQueue[uuid])
                callQueue[uuid] = callQueue[uuid].filter(id => id !== fromSocketId);
            // Update call log
            if (calls[uuid]) {
                const call = calls[uuid].find((c) => c.from === fromSocketId && c.to === agentId && c.status === 'routed');
                if (call)
                    call.status = 'rejected';
            }
            // Update session status
            if (persistentStorage && Array.isArray(persistentStorage.sessions)) {
                const session = persistentStorage.sessions.find(s => s.sessionId === sessionId);
                if (session)
                    session.status = 'ended';
            }
            // Notify widget/client
            io.to(fromSocketId).emit('call-status', { status: 'rejected', agentId });
            // Update queue positions for others
            if (callQueue[uuid]) {
                callQueue[uuid].forEach((sid, idx) => {
                    const estimate = Math.max(1, idx + 1) * 30;
                    io.to(sid).emit('queue-update', { position: idx + 1, estimate });
                });
            }
        });
        // On disconnect, remove from queue
        socket.on('disconnect', () => {
            Object.keys(callQueue).forEach(uuid => {
                callQueue[uuid] = callQueue[uuid].filter(id => id !== socket.id);
            });
            const { uuid, agentId } = socket.data || {};
            if (uuid && agentId && agents[uuid] && agents[uuid][agentId]) {
                delete agents[uuid][agentId];
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
            if (!uuid || !agents[uuid]) {
                socket.emit('test-call-result', { success: false, reason: 'No such company or no agents online' });
                return;
            }
            const agentIds = Object.keys(agents[uuid]);
            if (agentIds.length === 0) {
                socket.emit('test-call-result', { success: false, reason: 'No agents online' });
                return;
            }
            // Route to first available agent
            const agentId = agentIds[0];
            const agent = agents[uuid][agentId];
            io.to(agent.socketId).emit('test-incoming-call', { uuid, agentId, fromSocketId: socket.id, test: true });
            socket.emit('test-call-result', { success: true, agentId });
        });
        // --- Chat Events (MVP, non-breaking) ---
        socket.on('chat:join', (data) => {
            // data: { sessionId, companyUuid, visitorId, pageUrl }
            if (!data.sessionId || !data.companyUuid || !data.visitorId)
                return;
            if (!persistentStorage.chatSessions[data.sessionId]) {
                persistentStorage.chatSessions[data.sessionId] = {
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
            if (persistentStorage.chatSessions[data.sessionId]) {
                persistentStorage.chatSessions[data.sessionId].messages.push(msg);
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
            if (persistentStorage) {
                persistentStorage.chatMessages.push(chatMessage);
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
