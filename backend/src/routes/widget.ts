// @ts-nocheck
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory storage
const companies: Record<string, any> = {};
const agents: Record<string, any> = {};
const sessions: any[] = [];

// Simple save function
function saveSessions() {
  console.log('Sessions saved (in-memory)');
}

const router = express.Router();

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Call history endpoint
router.get('/calls/history', (req, res) => {
  try {
    const { page = 1, limit = 10, status, agentId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Mock call history data
    const allCalls = [
      {
        id: 'call-001',
        visitorId: 'visitor-123',
        pageUrl: 'http://localhost:5173/',
        status: 'ended',
        assignedAgent: 'agent-001',
        startTime: new Date(Date.now() - 300000).toISOString(),
        endTime: new Date(Date.now() - 240000).toISOString(),
        duration: 60,
        callType: 'chat',
        priority: 'normal',
        routingType: 'public',
        companyId: 'company-001',
        sessionId: 'session-001'
      },
      {
        id: 'call-002',
        visitorId: 'visitor-456',
        pageUrl: 'http://localhost:5173/demo',
        status: 'ended',
        assignedAgent: 'agent-002',
        startTime: new Date(Date.now() - 600000).toISOString(),
        endTime: new Date(Date.now() - 540000).toISOString(),
        duration: 60,
        callType: 'chat',
        priority: 'normal',
        routingType: 'company',
        companyId: 'company-002',
        sessionId: 'session-002'
      }
    ];

    let filteredCalls = allCalls;

    if (status) {
      filteredCalls = filteredCalls.filter(call => call.status === status);
    }

    if (agentId) {
      filteredCalls = filteredCalls.filter(call => call.assignedAgent === agentId);
    }

    const paginatedCalls = filteredCalls.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      calls: paginatedCalls,
      total: filteredCalls.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(filteredCalls.length / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CallDocker agents endpoint
router.get('/calldocker-agents', (req, res) => {
  try {
    // Mock CallDocker agents data
    const agents = [
      {
        id: 'agent-001',
        name: 'Agent 1',
        online: true,
        companyUuid: 'demo-company-uuid',
        lastSeen: new Date().toISOString(),
        status: 'online',
        assignedToPublic: true,
        currentCalls: 1,
        maxCalls: 5
      },
      {
        id: 'agent-002',
        name: 'Agent 2',
        online: false,
        companyUuid: 'demo-company-uuid',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        status: 'offline',
        assignedToPublic: false,
        currentCalls: 0,
        maxCalls: 3
      }
    ];

    res.json({
      success: true,
      agents: agents,
      onlineCount: agents.filter(a => a.online).length,
      totalCount: agents.length
    });
  } catch (error) {
    console.error('Error fetching CallDocker agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Company agents endpoint
router.get('/company-agents', (req, res) => {
  try {
    const { companyUuid } = req.query;
    
    if (!companyUuid) {
      return res.status(400).json({ error: 'companyUuid is required' });
    }

    // Mock company agents data
    const agents = [
      {
        id: 'agent-001',
        name: 'Agent 1',
        online: true,
        companyUuid: companyUuid,
        lastSeen: new Date().toISOString(),
        status: 'online',
        assignedToPublic: true,
        currentCalls: 1,
        maxCalls: 5
      }
    ];

    res.json({
      success: true,
      agents: agents,
      onlineCount: agents.filter(a => a.online).length,
      totalCount: agents.length
    });
  } catch (error) {
    console.error('Error fetching company agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agent status endpoint
router.get('/agents/status', (req, res) => {
  try {
    // Mock agent status data
    const agentsWithStatus = [
      {
        id: 'agent-001',
        username: 'agent1',
        email: 'agent1@demo.com',
        companyName: 'Demo Company',
        status: 'online',
        assignedToPublic: true,
        currentCalls: 1,
        maxCalls: 5,
        availability: 'online',
        lastActivity: new Date().toISOString(),
        skills: ['sales', 'support']
      }
    ];

    res.json({
      success: true,
      agents: agentsWithStatus,
      onlineCount: agentsWithStatus.filter(a => a.status === 'online').length,
      totalCount: agentsWithStatus.length
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Call analytics endpoint
router.get('/calls/analytics', (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const analytics = {
      totalCalls: 15,
      activeCalls: 2,
      avgDuration: 240,
      callsByStatus: {
        waiting: 1,
        active: 2,
        ended: 12,
        missed: 0
      },
      callsByType: {
        chat: 15,
        voice: 0
      }
    };

    res.json({
      success: true,
      analytics,
      period
    });
  } catch (error) {
    console.error('Error fetching call analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Active calls endpoint
router.get('/calls/active', (req, res) => {
  try {
    const activeCalls = [
      {
        id: 'call-001',
        visitorId: 'visitor-123',
        pageUrl: 'http://localhost:5173/',
        status: 'active',
        assignedAgent: 'agent-001',
        startTime: new Date(Date.now() - 300000).toISOString(),
        callType: 'chat',
        priority: 'normal',
        routingType: 'public',
        companyId: 'company-001',
        sessionId: 'session-001'
      }
    ];

    res.json({
      success: true,
      calls: activeCalls,
      count: activeCalls.length
    });
  } catch (error) {
    console.error('Error fetching active calls:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;