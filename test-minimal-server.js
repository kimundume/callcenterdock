// Minimal test server to verify basic functionality
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Basic CORS setup
app.use(cors({
  origin: [
    'https://calldocker.netlify.app',
    'https://main--calldocker.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());

// Test endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Minimal test server running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: 'minimal-test',
    timestamp: new Date().toISOString()
  });
});

// Mock the failing endpoints
app.get('/api/agents/calldocker-company-uuid', (req, res) => {
  res.json([
    {
      username: 'calldocker_agent',
      status: 'online',
      availability: 'online',
      currentCalls: 0,
      maxCalls: 5
    }
  ]);
});

app.get('/api/widget/queue/calldocker-company-uuid', (req, res) => {
  res.json({
    queueLength: 0,
    estimatedWaitTime: 0,
    availableAgents: 1
  });
});

app.get('/api/widget/agent/status', (req, res) => {
  res.json({
    username: 'calldocker_agent',
    status: 'online',
    currentCalls: 0,
    maxCalls: 5
  });
});

app.post('/api/widget/agent/end-call', (req, res) => {
  res.json({
    success: true,
    message: 'Call ended successfully'
  });
});

app.post('/api/widget/agent/auto-reset', (req, res) => {
  res.json({
    success: true,
    message: 'Agents reset successfully',
    affectedAgents: 1
  });
});

app.post('/api/widget/route-call', (req, res) => {
  res.json({
    success: true,
    message: 'Call connected successfully!',
    sessionId: `session_${Date.now()}_test`,
    agent: 'calldocker_agent',
    agentId: 'calldocker-main-agent'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🧪 Minimal test server running on port ${PORT}`);
  console.log(`🌐 Test URL: http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log('\n📋 Available endpoints:');
  console.log('   GET  /api/agents/calldocker-company-uuid');
  console.log('   GET  /api/widget/queue/calldocker-company-uuid');
  console.log('   GET  /api/widget/agent/status');
  console.log('   POST /api/widget/agent/end-call');
  console.log('   POST /api/widget/agent/auto-reset');
  console.log('   POST /api/widget/route-call');
});

module.exports = server;
