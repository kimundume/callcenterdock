"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSignalingHandlers = registerSignalingHandlers;
const path_1 = __importDefault(require("path"));
// Import persistentStorage with robust fallback
let persistentStorage;
let agents;
let sessions;
let saveSessions;
try {
    // Try multiple import strategies for persistentStorage
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
            console.log(`✅ persistentStorage imported successfully from: ${importPath}`);
            importSuccess = true;
            break;
        }
        catch (pathError) {
            console.log(`⚠️  Failed to import from: ${importPath}`);
        }
    }
    // If persistentStorage failed, try tempDB as fallback
    if (!importSuccess) {
        console.log('🔄 Falling back to tempDB...');
        const tempDBPaths = [
            '../data/tempDB',
            path_1.default.resolve(__dirname, '../data/tempDB'),
            path_1.default.resolve(__dirname, '../data/tempDB.js'),
            path_1.default.join(__dirname, '../data/tempDB'),
            path_1.default.join(__dirname, '../data/tempDB.js')
        ];
        for (const importPath of tempDBPaths) {
            try {
                const tempDB = require(importPath);
                agents = tempDB.agents || ((_a = tempDB.tempStorage) === null || _a === void 0 ? void 0 : _a.agents) || {};
                sessions = tempDB.sessions || ((_b = tempDB.tempStorage) === null || _b === void 0 ? void 0 : _b.sessions) || [];
                saveSessions = () => console.log('tempDB saveSessions called (no-op)');
                console.log(`✅ tempDB imported successfully from: ${importPath}`);
                importSuccess = true;
                break;
            }
            catch (pathError) {
                console.log(`⚠️  Failed to import tempDB from: ${importPath}`);
            }
        }
    }
    if (!importSuccess) {
        throw new Error('All import paths failed for both persistentStorage and tempDB');
    }
    // Ensure CallDocker agent exists regardless of which storage is used
    if (!agents['calldocker-main-agent']) {
        console.log('[DEBUG] CallDocker agent not found, creating it');
        agents['calldocker-main-agent'] = {
            uuid: 'calldocker-main-agent',
            companyUuid: 'calldocker-company-uuid',
            username: 'calldocker_agent',
            password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // "CallDocker2024!"
            email: 'agent@calldocker.com',
            phone: '+1-555-CALL-DOCKER',
            fullName: 'CallDocker Main Agent',
            role: 'senior_agent',
            status: 'online',
            registrationStatus: 'approved',
            skills: ['customer_service', 'technical_support', 'sales', 'enquiry_handling', 'billing'],
            performance: {
                callsHandled: 1250,
                avgRating: 4.9,
                successRate: 98.5
            },
            currentCalls: 0,
            maxCalls: 10,
            availability: 'online',
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            description: 'Main CallDocker agent responsible for handling all incoming calls from the CallDocker landing page. This agent is always available and ready to assist customers.'
        };
        console.log('[DEBUG] CallDocker agent created successfully');
    }
}
catch (error) {
    console.error('❌ Failed to import storage:', error.message);
    console.error('📁 Current directory:', __dirname);
    try {
        const fs = require('fs');
        const dataDir = path_1.default.join(__dirname, '../data');
        if (fs.existsSync(dataDir)) {
            console.error('📁 Available files in dist/data:', fs.readdirSync(dataDir).join(', '));
        }
    }
    catch (fsError) {
        console.error('📁 Could not read data directory');
    }
    // Create minimal fallback data
    console.log('🔄 Creating minimal fallback data...');
    agents = {
        'calldocker-main-agent': {
            uuid: 'calldocker-main-agent',
            companyUuid: 'calldocker-company-uuid',
            username: 'calldocker_agent',
            password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
            email: 'agent@calldocker.com',
            phone: '+1-555-CALL-DOCKER',
            fullName: 'CallDocker Main Agent',
            role: 'senior_agent',
            status: 'online',
            registrationStatus: 'approved',
            skills: ['customer_service', 'technical_support', 'sales', 'enquiry_handling', 'billing'],
            performance: {
                callsHandled: 1250,
                avgRating: 4.9,
                successRate: 98.5
            },
            currentCalls: 0,
            maxCalls: 10,
            availability: 'online',
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            description: 'Main CallDocker agent responsible for handling all incoming calls from the CallDocker landing page. This agent is always available and ready to assist customers.'
        }
    };
    sessions = [];
    saveSessions = () => console.log('Fallback saveSessions called (no-op)');
    console.log('✅ Fallback data created successfully');
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
            if (!global.tempStorage.callQueue[uuid])
                global.tempStorage.callQueue[uuid] = [];
            // Add to queue if not already present
            if (!global.tempStorage.callQueue[uuid].includes(socket.id))
                global.tempStorage.callQueue[uuid].push(socket.id);
            // If no agents online
            if (!agents[uuid] || Object.keys(agents[uuid]).length === 0) {
                socket.emit('call-routed', { success: false, reason: 'No agents online' });
                global.tempStorage.callQueue[uuid] = global.tempStorage.callQueue[uuid].filter(id => id !== socket.id);
                return;
            }
            // Calculate position and estimate
            const position = global.tempStorage.callQueue[uuid].indexOf(socket.id) + 1;
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
                    if (!global.tempStorage.calls[uuid])
                        global.tempStorage.calls[uuid] = [];
                    const callLog = { from: socket.id, to: agentId, time: new Date().toISOString(), status: 'routed' };
                    global.tempStorage.calls[uuid].push(callLog);
                    socket.emit('call-routed', { success: true, agentSocketId: agent.socketId });
                }
            }
        });
        // Periodically broadcast queue positions/estimates
        const queueInterval = setInterval(() => {
            Object.keys(global.tempStorage.callQueue).forEach(uuid => {
                global.tempStorage.callQueue[uuid].forEach((sid, idx) => {
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
            if (global.tempStorage.callQueue[uuid])
                global.tempStorage.callQueue[uuid] = global.tempStorage.callQueue[uuid].filter(id => id !== fromSocketId);
            // Update call log
            if (global.tempStorage.calls[uuid]) {
                const call = global.tempStorage.calls[uuid].find((c) => c.from === fromSocketId && c.to === agentId && c.status === 'routed');
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
            if (global.tempStorage.callQueue[uuid]) {
                global.tempStorage.callQueue[uuid].forEach((sid, idx) => {
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
            if (global.tempStorage.callQueue[uuid])
                global.tempStorage.callQueue[uuid] = global.tempStorage.callQueue[uuid].filter(id => id !== fromSocketId);
            // Update call log
            if (global.tempStorage.calls[uuid]) {
                const call = global.tempStorage.calls[uuid].find((c) => c.from === fromSocketId && c.to === agentId && c.status === 'routed');
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
            if (global.tempStorage.callQueue[uuid]) {
                global.tempStorage.callQueue[uuid].forEach((sid, idx) => {
                    const estimate = Math.max(1, idx + 1) * 30;
                    io.to(sid).emit('queue-update', { position: idx + 1, estimate });
                });
            }
        });
        // On disconnect, remove from queue
        socket.on('disconnect', () => {
            Object.keys(global.tempStorage.callQueue).forEach(uuid => {
                global.tempStorage.callQueue[uuid] = global.tempStorage.callQueue[uuid].filter(id => id !== socket.id);
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
            if (!global.tempStorage.chatSessions[data.sessionId]) {
                global.tempStorage.chatSessions[data.sessionId] = {
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
            if (global.tempStorage.chatSessions[data.sessionId]) {
                global.tempStorage.chatSessions[data.sessionId].messages.push(msg);
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
