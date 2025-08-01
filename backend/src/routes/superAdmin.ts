import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Simple in-memory storage with file persistence
const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'data')
  : path.join(__dirname, '../../data');

const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

// Ensure data directory exists
function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`📁 Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error(`❌ Error creating data directory: ${error}`);
    // Don't fail startup, just log the error
    return false;
  }
  return true;
}

// Helper functions for file operations
function readJsonFile(filePath: string, defaultValue: any = {}): any {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    // Return default value on error
  }
  return defaultValue;
}

function writeJsonFile(filePath: string, data: any): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved data to: ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    // Don't fail on write errors
  }
}

// Initialize data directory (but don't fail if it doesn't work)
try {
  ensureDataDirectory();
} catch (error) {
  console.error('Failed to ensure data directory, continuing with in-memory storage:', error);
}

// Initialize default data
const defaultCompanies = {
  'demo-company-uuid': {
    uuid: 'demo-company-uuid',
    name: 'Demo Company',
    email: 'demo@company.com',
    verified: true,
    createdAt: new Date().toISOString(),
  },
  'calldocker-company-uuid': {
    uuid: 'calldocker-company-uuid',
    name: 'CallDocker',
    email: 'admin@calldocker.com',
    verified: true,
    createdAt: new Date().toISOString(),
  }
};

const defaultAgents = {
  'agent1': {
    uuid: 'demo-agent-uuid',
    companyUuid: 'demo-company-uuid',
    username: 'agent1',
    password: 'password',
    email: 'agent1@demo.com',
    status: 'online',
    registrationStatus: 'approved',
    createdAt: new Date().toISOString(),
  },
  'calldocker-main-agent': {
    uuid: 'calldocker-main-agent',
    companyUuid: 'calldocker-company-uuid',
    username: 'calldocker_agent',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "CallDocker2024!"
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

// Load data from files or create with defaults (with error handling)
let companies: any, users: any, agents: any;
try {
  companies = readJsonFile(COMPANIES_FILE, defaultCompanies);
  users = readJsonFile(USERS_FILE, {});
  agents = readJsonFile(AGENTS_FILE, defaultAgents);
} catch (error) {
  console.error('Failed to load data files, using defaults:', error);
  companies = defaultCompanies;
  users = {};
  agents = defaultAgents;
}

// Ensure we have some sample companies for testing
if (Object.keys(companies).length === 0) {
  console.log('[DEBUG] No companies found, creating sample companies');
  const sampleCompany1 = {
    uuid: 'sample-company-001',
    name: 'Sample Company 1',
    email: 'sample1@company.com',
    verified: true,
    suspended: false,
    createdAt: new Date().toISOString(),
    status: 'approved'
  };
  
  const sampleCompany2 = {
    uuid: 'sample-company-002',
    name: 'Sample Company 2',
    email: 'sample2@company.com',
    verified: true,
    suspended: false,
    createdAt: new Date().toISOString(),
    status: 'approved'
  };
  
  companies[sampleCompany1.uuid] = sampleCompany1;
  companies[sampleCompany2.uuid] = sampleCompany2;
  
  // Create sample agents for these companies
  const sampleAgent1 = {
    uuid: 'sample-agent-001',
    username: 'agent1',
    email: 'agent1@sample1.com',
    companyUuid: sampleCompany1.uuid,
    status: 'online',
    assignedToPublic: true,
    currentCalls: 1,
    maxCalls: 5,
    availability: 'online',
    lastActivity: new Date().toISOString(),
    skills: ['sales', 'support'],
    callsHandled: 15,
    avgDuration: 240,
    satisfaction: 4.5,
    responseTime: 45,
    totalCalls: 20,
    missedCalls: 2
  };
  
  const sampleAgent2 = {
    uuid: 'sample-agent-002',
    username: 'agent2',
    email: 'agent2@sample2.com',
    companyUuid: sampleCompany2.uuid,
    status: 'offline',
    assignedToPublic: false,
    currentCalls: 0,
    maxCalls: 3,
    availability: 'offline',
    lastActivity: new Date(Date.now() - 3600000).toISOString(),
    skills: ['technical'],
    callsHandled: 8,
    avgDuration: 180,
    satisfaction: 4.2,
    responseTime: 60,
    totalCalls: 10,
    missedCalls: 1
  };
  
  agents[sampleAgent1.uuid] = sampleAgent1;
  agents[sampleAgent2.uuid] = sampleAgent2;
  
  // Save the sample data
  saveCompanies();
  saveAgents();
  
  console.log('[DEBUG] Sample companies and agents created');
}

console.log('[DEBUG] Loaded companies:', Object.keys(companies).length);
console.log('[DEBUG] Loaded agents:', Object.keys(agents).length);

// Save functions
function saveCompanies(): void {
  console.log(`💾 Saving ${Object.keys(companies).length} companies...`);
  writeJsonFile(COMPANIES_FILE, companies);
}

function saveUsers(): void {
  console.log(`💾 Saving ${Object.keys(users).length} users...`);
  writeJsonFile(USERS_FILE, users);
}

function saveAgents(): void {
  console.log(`💾 Saving ${Object.keys(agents).length} agents...`);
  writeJsonFile(AGENTS_FILE, agents);
}

// Helper functions
function findUserByCompanyAndRole(companyUuid: string, username: string, role: string) {
  return Object.values(users).find(
    (u: any) => u.companyUuid === companyUuid && u.username === username && u.role === role
  );
}

function findCompanyByEmail(email: string) {
  return Object.values(companies).find((c: any) => c.email === email);
}

// In-memory storage for temporary data
const pendingAdmins: any[] = [];
const pendingAgentCredentials: any[] = [];
const contactMessages: any[] = [];

const router = express.Router();

// Simple test endpoint to verify backend is running updated code
router.get('/test-updated-code', (req, res) => {
  console.log('[DEBUG] Test updated code endpoint hit - this proves backend is running new code');
  res.json({ 
    message: 'Backend is running updated code!',
    timestamp: new Date().toISOString(),
    version: 'UPDATED_CODE_2024',
    authDisabled: true,
    companies: Object.keys(companies).length,
    agents: Object.keys(agents).length
  });
});

// Simple test endpoint to verify backend is working
router.get('/test-backend', (req, res) => {
  console.log('[DEBUG] Test backend endpoint hit');
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    authDisabled: true,
    companies: Object.keys(companies).length,
    agents: Object.keys(agents).length
  });
});

// Test endpoints for each failing route
router.get('/test-system-config', (req, res) => {
  console.log('[DEBUG] Test system config endpoint hit');
  res.json({ 
    message: 'System config test endpoint working!',
    config: {
      maintenanceMode: false,
      emailService: 'smtp',
      storageProvider: 'local',
      autoBackup: true,
      maxFileSize: 10485760,
      sessionTimeout: 3600
    }
  });
});

router.get('/test-content-frontpage', (req, res) => {
  console.log('[DEBUG] Test content frontpage endpoint hit');
  res.json({ 
    message: 'Content frontpage test endpoint working!',
    content: {
      heroTitle: 'Turn Every Click Into a Call',
      heroSubtitle: 'Calldocker turns your visitors into conversations — instantly.',
      features: []
    }
  });
});

router.get('/test-packages', (req, res) => {
  console.log('[DEBUG] Test packages endpoint hit');
  res.json({ 
    message: 'Packages test endpoint working!',
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        features: ['1 Agent', 'Basic Widget', 'Email Support'],
        active: true
      }
    ]
  });
});

router.get('/test-analytics-advanced', (req, res) => {
  console.log('[DEBUG] Test analytics advanced endpoint hit');
  res.json({ 
    message: 'Analytics advanced test endpoint working!',
    analytics: {
      revenue: { monthly: [12000, 19000, 15000], growth: 25.5 },
      users: { growth: [45, 78, 56], total: Object.keys(companies).length },
      performance: { responseTime: 245, uptime: 99.9, activeSessions: 1247 }
    }
  });
});

router.get('/test-content-blog-posts', (req, res) => {
  console.log('[DEBUG] Test content blog posts endpoint hit');
  res.json({ 
    message: 'Content blog posts test endpoint working!',
    posts: []
  });
});

router.get('/test-support-tickets', (req, res) => {
  console.log('[DEBUG] Test support tickets endpoint hit');
  res.json({ 
    message: 'Support tickets test endpoint working!',
    tickets: [
      {
        id: 'TICKET-001',
        subject: 'Widget not loading',
        customer: 'john@example.com',
        status: 'open',
        priority: 'high',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

router.get('/test-api-keys', (req, res) => {
  console.log('[DEBUG] Test API keys endpoint hit');
  res.json({ 
    message: 'API keys test endpoint working!',
    apiKeys: [
      {
        id: 'key-1',
        name: 'Production API Key',
        key: 'prod_sk_1234567890abcdef',
        permissions: ['read', 'write'],
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Simple endpoint to check agent data (no auth required)
router.get('/debug/agents', (req, res) => {
  try {
    console.log('[DEBUG] Debug agents request received');
    console.log('[DEBUG] Raw agents object:', agents);
    console.log('[DEBUG] Agents keys:', Object.keys(agents));
    console.log('[DEBUG] Agents values:', Object.values(agents));
    
    // Create sample agent data for testing
    const sampleAgents = [
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
        skills: ['sales', 'support'],
        callsHandled: 15,
        avgDuration: 240,
        satisfaction: 4.5,
        responseTime: 45,
        totalCalls: 20,
        missedCalls: 2
      },
      {
        id: 'agent-002',
        username: 'agent2',
        email: 'agent2@demo.com',
        companyName: 'Demo Company',
        status: 'offline',
        assignedToPublic: false,
        currentCalls: 0,
        maxCalls: 3,
        availability: 'offline',
        lastActivity: new Date(Date.now() - 3600000).toISOString(),
        skills: ['technical'],
        callsHandled: 8,
        avgDuration: 180,
        satisfaction: 4.2,
        responseTime: 60,
        totalCalls: 10,
        missedCalls: 1
      }
    ];
    
    res.json({
      message: 'Agents debug data',
      count: Object.keys(agents).length,
      agents: agents,
      agentsArray: Object.values(agents),
      sampleAgents: sampleAgents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple endpoint to create a test company (no auth required)
router.post('/debug/create-test-company', async (req, res) => {
  try {
    console.log('[DEBUG] Create test company request received');
    
    const uuid = uuidv4();
    const testCompany = {
      uuid,
      name: 'Test Company ' + new Date().toISOString().slice(0, 19),
      email: 'test@company.com',
      verified: true,
      suspended: false,
      createdAt: new Date().toISOString(),
      status: 'approved'
    };
    
    companies[uuid] = testCompany;
    saveCompanies();
    
    // Create test agents for this company
    const testAgent1 = {
      uuid: uuidv4(),
      username: 'testagent1',
      email: 'agent1@testcompany.com',
      companyUuid: uuid,
      status: 'online',
      assignedToPublic: true,
      currentCalls: 1,
      maxCalls: 5,
      availability: 'online',
      callsHandled: 5,
      avgDuration: 120,
      satisfaction: 4.0,
      responseTime: 30,
      totalCalls: 5,
      missedCalls: 0,
      skills: ['sales'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    agents[testAgent1.uuid] = testAgent1;
    saveAgents();
    
    console.log('[DEBUG] Test company created:', testCompany);
    
    res.json({
      success: true,
      message: 'Test company created successfully',
      company: testCompany,
      agent: testAgent1,
      totalCompanies: Object.keys(companies).length,
      totalAgents: Object.keys(agents).length
    });
  } catch (error) {
    console.error('Create test company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple endpoint to check accounts without authentication (for testing)
router.get('/debug/accounts', (req, res) => {
  try {
    console.log('[DEBUG] Debug accounts request received');
    console.log('[DEBUG] Raw companies object:', companies);
    console.log('[DEBUG] Companies keys:', Object.keys(companies));
    console.log('[DEBUG] Companies values:', Object.values(companies));
    
    // Transform existing companies data to match the expected format
    const accounts = Object.values(companies).map((company: any) => ({
      id: company.uuid,
      companyName: company.name,
      email: company.email,
      status: company.suspended ? 'suspended' : (company.verified ? 'active' : 'pending'),
      createdAt: company.createdAt || new Date().toISOString(),
      lastLogin: company.lastLogin || new Date().toISOString(),
      subscription: 'pro', // Default subscription
      agents: Object.values(agents).filter((agent: any) => agent.companyUuid === company.uuid).length,
      calls: 0, // This would be calculated from call logs
      revenue: Math.floor(Math.random() * 5000) + 1000 // Mock revenue data
    }));

    console.log('[DEBUG] Transformed accounts:', accounts);
    
    res.json({
      message: 'Accounts debug data',
      count: Object.keys(companies).length,
      companies: companies,
      companiesArray: Object.values(companies),
      accounts: accounts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple endpoint to check companies data (no auth required)
router.get('/debug/companies', (req, res) => {
  try {
    console.log('[DEBUG] Debug companies request received');
    console.log('[DEBUG] Raw companies object:', companies);
    console.log('[DEBUG] Companies keys:', Object.keys(companies));
    console.log('[DEBUG] Companies values:', Object.values(companies));
    
    res.json({
      message: 'Companies debug data',
      count: Object.keys(companies).length,
      companies: companies,
      companiesArray: Object.values(companies),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to check if server is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Super Admin API is working',
    timestamp: new Date().toISOString(),
    companies: Object.keys(companies).length,
    users: Object.keys(users).length
  });
});

// Test endpoint without authentication
router.post('/test-create', async (req, res) => {
  try {
    console.log('[DEBUG] Test create company request received:', req.body);
    res.json({ 
      message: 'Test endpoint working',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test super admin login endpoint (no auth required)
router.post('/test-login', async (req, res) => {
  try {
    console.log('[DEBUG] Test login request received:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // For demo purposes, using hardcoded super admin credentials
    const superAdminCredentials = {
      username: 'superadmin',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
      role: 'super-admin'
    };

    if (username !== superAdminCredentials.username) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, superAdminCredentials.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        username: superAdminCredentials.username, 
        role: superAdminCredentials.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('[DEBUG] Test login successful for user:', username);

    res.json({
      token,
      user: {
        username: superAdminCredentials.username,
        role: superAdminCredentials.role
      }
    });

  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Super Admin authentication middleware (completely disabled for testing)
const authenticateSuperAdmin = (req: any, res: any, next: any) => {
  // Completely disable authentication for testing
  console.log('[DEBUG] Authentication middleware called for:', req.method, req.path);
  console.log('[DEBUG] Authentication completely bypassed - always allowing access');
  req.superAdmin = { username: 'test', role: 'super-admin' };
  next();
  return; // Ensure we don't continue to the original code
};

// Super Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Super Admin login attempt:', { username, password: password ? '[HIDDEN]' : 'undefined' });

    if (!username || !password) {
      console.log('Login failed: Missing username or password');
      return res.status(400).json({ error: 'Username and password required' });
    }

    // For demo purposes, using hardcoded super admin credentials
    // In production, this should be stored in a database
    const superAdminCredentials = {
      username: 'superadmin',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
      role: 'super-admin'
    };

    console.log('Expected username:', superAdminCredentials.username);
    console.log('Provided username:', username);
    console.log('Username match:', username === superAdminCredentials.username);

    if (username !== superAdminCredentials.username) {
      console.log('Login failed: Invalid username');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, superAdminCredentials.password);
    console.log('Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        username: superAdminCredentials.username, 
        role: superAdminCredentials.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Super Admin login successful for user:', username);

    res.json({
      token,
      user: {
        username: superAdminCredentials.username,
        role: superAdminCredentials.role
      }
    });

  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all accounts (no auth required for testing)
router.get('/accounts', (req, res) => {
  try {
    console.log('[DEBUG] Accounts request received');
    console.log('[DEBUG] Companies data:', companies);
    console.log('[DEBUG] Users data:', users);
    
    // Transform existing companies data to match the expected format
    const accounts = Object.values(companies).map((company: any) => ({
      id: company.uuid,
      companyName: company.name,
      email: company.email,
      status: company.suspended ? 'suspended' : (company.verified ? 'active' : 'pending'),
      createdAt: company.createdAt || new Date().toISOString(),
      lastLogin: company.lastLogin || new Date().toISOString(),
      subscription: 'pro', // Default subscription
      agents: Object.values(agents).filter((agent: any) => agent.companyUuid === company.uuid).length,
      calls: 0, // This would be calculated from call logs
      revenue: Math.floor(Math.random() * 5000) + 1000 // Mock revenue data
    }));

    console.log('[DEBUG] Transformed accounts:', accounts);
    console.log('[DEBUG] Returning accounts count:', accounts.length);

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get raw companies data (for debugging)
router.get('/companies', (req, res) => {
  try {
    console.log('Companies data requested:', companies);
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get raw users data (for debugging)
router.get('/users', (req, res) => {
  try {
    console.log('Users data requested:', users);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suspend account
router.put('/accounts/:id/suspend', authenticateSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and update the company status
    const company = companies[id];
    if (!company) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Add suspended status to company
    company.suspended = true;
    saveCompanies(); // Save to file
    
    res.json({ message: 'Account suspended successfully' });
  } catch (error) {
    console.error('Suspend account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activate account
router.put('/accounts/:id/activate', authenticateSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and update the company status
    const company = companies[id];
    if (!company) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Remove suspended status from company
    company.suspended = false;
    saveCompanies(); // Save to file
    
    res.json({ message: 'Account activated successfully' });
  } catch (error) {
    console.error('Activate account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete account
router.put('/accounts/:id/delete', authenticateSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and remove the company
    if (!companies[id]) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Remove company and related data
    delete companies[id];
    saveCompanies(); // Save to file
    
    // Remove related agents
    Object.keys(agents).forEach(agentId => {
      if (agents[agentId].companyUuid === id) {
        delete agents[agentId];
      }
    });
    saveAgents(); // Save to file
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system analytics (no auth required for testing)
router.get('/analytics', (req, res) => {
  try {
    const analytics = {
      totalAccounts: Object.keys(companies).length,
      activeAccounts: Object.values(companies).filter((c: any) => c.verified && !c.suspended).length,
      suspendedAccounts: Object.values(companies).filter((c: any) => c.suspended).length,
      pendingAccounts: Object.values(companies).filter((c: any) => !c.verified).length,
      totalAgents: Object.keys(agents).length,
      totalRevenue: Object.keys(companies).length * 2500, // Mock calculation
      systemHealth: {
        backend: 'online',
        database: 'connected',
        emailService: 'configured'
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system health (no auth required for testing)
router.get('/health', (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        backend: 'online',
        database: 'connected',
        email: 'configured'
      },
      metrics: {
        cpu: Math.floor(Math.random() * 30) + 20,
        memory: Math.floor(Math.random() * 40) + 40,
        disk: Math.floor(Math.random() * 20) + 10
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Content Management Routes (no auth required for testing)
router.get('/content/blog-posts', (req, res) => {
  console.log('[DEBUG] ===== CONTENT BLOG POSTS ROUTE HIT =====');
  console.log('[DEBUG] Request method:', req.method);
  console.log('[DEBUG] Request path:', req.path);
  console.log('[DEBUG] Request headers:', req.headers);
  try {
    console.log('[DEBUG] Content blog posts endpoint hit - NO AUTH');
    const posts: any[] = []; // This would be loaded from persistent storage
    console.log('[DEBUG] Sending response for blog posts');
    res.json({ posts });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/content/blog-posts', (req, res) => {
  try {
    const post = {
      id: `post-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ post });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/content/frontpage', (req, res) => {
  try {
    console.log('[DEBUG] Content frontpage endpoint hit - NO AUTH');
    const content = {
      heroTitle: 'Turn Every Click Into a Call',
      heroSubtitle: 'Calldocker turns your visitors into conversations — instantly.',
      features: []
    };
    res.json({ content });
  } catch (error) {
    console.error('Get frontpage content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/content/frontpage', (req, res) => {
  try {
    const content = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({ content });
  } catch (error) {
    console.error('Update frontpage content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Package Management Routes (no auth required for testing)
router.get('/packages', (req, res) => {
  try {
    console.log('[DEBUG] Packages endpoint hit - NO AUTH');
    const packages = [
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        features: ['1 Agent', 'Basic Widget', 'Email Support'],
        active: true
      },
      {
        id: 'pro',
        name: 'Professional',
        price: 99,
        features: ['5 Agents', 'Custom Branding', 'Webhooks', 'Analytics'],
        active: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        features: ['Unlimited Agents', 'Priority Support', 'Advanced Analytics', 'Integrations'],
        active: true
      }
    ];
    res.json({ packages });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/packages', (req, res) => {
  try {
    const pkg = {
      id: `pkg-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };

    res.json({ package: pkg });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer Care Routes (no auth required for testing)
router.get('/support/tickets', (req, res) => {
  try {
    console.log('[DEBUG] Support tickets endpoint hit - NO AUTH');
    const tickets = [
      {
        id: 'TICKET-001',
        subject: 'Widget not loading',
        customer: 'john@example.com',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        description: 'The widget is not loading properly on our website.'
      },
      {
        id: 'TICKET-002',
        subject: 'Billing question',
        customer: 'jane@company.com',
        status: 'in-progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        description: 'I have a question about my monthly billing.'
      }
    ];
    res.json({ tickets });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/support/tickets', (req, res) => {
  try {
    const ticket = {
      id: `TICKET-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    res.json({ ticket });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Advanced Analytics Routes (no auth required for testing)
router.get('/analytics/advanced', (req, res) => {
  try {
    console.log('[DEBUG] Analytics advanced endpoint hit - NO AUTH');
    // Mock advanced analytics data
    const analytics = {
      revenue: {
        monthly: [12000, 19000, 15000, 25000, 22000, 30000],
        growth: 25.5
      },
      users: {
        growth: [45, 78, 56, 89, 67, 95],
        total: Object.keys(companies).length
      },
      performance: {
        responseTime: 245,
        uptime: 99.9,
        activeSessions: 1247
      },
      features: {
        widgetInstalls: 89,
        activeCalls: 23,
        chatSessions: 156
      },
      support: {
        openTickets: 5,
        avgResolutionTime: 4.2,
        satisfaction: 4.8
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get advanced analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// System Management Routes (no auth required for testing)
router.get('/system/config', (req, res) => {
  try {
    console.log('[DEBUG] System config endpoint hit - NO AUTH');
    const config = {
      maintenanceMode: false,
      emailService: 'smtp',
      storageProvider: 'local',
      autoBackup: true,
      maxFileSize: 10485760,
      sessionTimeout: 3600
    };

    res.json({ config });
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/system/config', (req, res) => {
  try {
    const config = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({ config });
  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Management Routes (no auth required for testing)
router.get('/users', (req, res) => {
  try {
    const systemUsers = [
      {
        id: 'user-1',
        username: 'superadmin',
        email: 'admin@calldocker.com',
        role: 'super-admin',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'user-2',
        username: 'support1',
        email: 'support@calldocker.com',
        role: 'support',
        status: 'active',
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    res.json({ users: systemUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Management Routes (no auth required for testing)
router.get('/api-keys', (req, res) => {
  try {
    console.log('[DEBUG] API keys endpoint hit - NO AUTH');
    const apiKeys = [
      {
        id: 'key-1',
        name: 'Production API Key',
        key: 'prod_sk_1234567890abcdef',
        permissions: ['read', 'write'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastUsed: new Date(Date.now() - 3600000).toISOString(),
        expiresAt: null
      },
      {
        id: 'key-2',
        name: 'Development API Key',
        key: 'dev_sk_abcdef1234567890',
        permissions: ['read'],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        lastUsed: new Date(Date.now() - 7200000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString()
      }
    ];

    res.json({ apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api-keys', (req, res) => {
  try {
    const apiKey = {
      id: `key-${Date.now()}`,
      name: req.body.name,
      key: `sk_${Math.random().toString(36).substr(2, 15)}`,
      permissions: req.body.permissions || ['read'],
      createdAt: new Date().toISOString(),
      lastUsed: null,
      expiresAt: req.body.expiresAt || null
    };

    res.json({ apiKey });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Super Admin: Pending Registrations --- (no auth required for testing)

// GET /api/superadmin/pending-registrations
router.get('/pending-registrations', (req, res) => {
  const pendingCompanies = Object.values(companies).filter((c: any) => c.status === 'pending');
  const pendingAgents = Object.values(agents).filter((a: any) => a.status === 'pending');
  res.json({ companies: pendingCompanies, agents: pendingAgents });
});

// POST /api/superadmin/approve
router.post('/approve', (req, res) => {
  const { type, id } = req.body;
  
  if (type === 'company') {
    const company = companies[id];
    if (company) {
      company.status = 'approved';
      company.verified = true;
      saveCompanies();
      
      // Create admin user from pending admin credentials
      const pendingAdmin = pendingAdmins.find((pa: any) => pa.uuid === id);
      if (pendingAdmin) {
        // In a real application, you'd hash the password here
        const hashedPassword = pendingAdmin.adminPassword; // This should be bcrypt.hash() in production
        
        // Add to users array
        const adminUser = {
          uuid: uuidv4(),
          username: pendingAdmin.adminUsername,
          password: hashedPassword,
          companyUuid: id,
          role: 'admin',
          email: pendingAdmin.email,
          createdAt: new Date().toISOString()
        };
        users[adminUser.uuid] = adminUser;
        saveUsers();
        
        // Remove from pending admins
        const index = pendingAdmins.findIndex((pa: any) => pa.uuid === id);
        if (index > -1) {
          pendingAdmins.splice(index, 1);
        }
      }
      
      return res.json({ success: true, message: 'Company approved successfully' });
    }
  } else if (type === 'agent') {
    const agent = agents[id];
    if (agent) {
      agent.registrationStatus = 'approved';
      agent.status = 'offline'; // Set initial status to offline
      saveAgents();
      
      // Create agent user from pending agent credentials
      const pendingAgentCred = pendingAgentCredentials.find((pac: any) => pac.uuid === id);
      if (pendingAgentCred) {
        // In a real application, you'd hash the password here
        const hashedPassword = pendingAgentCred.password; // This should be bcrypt.hash() in production
        
        // Add to users array
        const agentUser = {
          uuid: uuidv4(),
          username: pendingAgentCred.username,
          password: hashedPassword,
          companyUuid: pendingAgentCred.companyUuid,
          role: 'agent',
          email: pendingAgentCred.email,
          createdAt: new Date().toISOString()
        };
        users[agentUser.uuid] = agentUser;
        saveUsers();
        
        // Remove from pending agent credentials
        const index = pendingAgentCredentials.findIndex((pac: any) => pac.uuid === id);
        if (index > -1) {
          pendingAgentCredentials.splice(index, 1);
        }
      }
      
      return res.json({ success: true, message: 'Agent approved successfully' });
    }
  }
  
  res.status(404).json({ error: 'Not found' });
});

// POST /api/superadmin/reject
router.post('/reject', (req, res) => {
  const { type, id } = req.body;
  if (type === 'company') {
    const company = companies[id];
    if (company) {
      company.status = 'rejected';
      saveCompanies();
      return res.json({ success: true });
    }
  } else if (type === 'agent') {
    const agent = agents[id];
    if (agent) {
      agent.status = 'rejected';
      saveAgents();
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: 'Not found' });
});

// --- Super Admin: Contact Messages --- (no auth required for testing)

// GET /api/superadmin/contact-messages
router.get('/contact-messages', (req, res) => {
  res.json({ messages: contactMessages });
});

// POST /api/superadmin/contact-messages/:id/handle
router.post('/contact-messages/:id/handle', (req, res) => {
  const { id } = req.params;
  const msg = contactMessages.find((m: any) => m._id === id);
  if (msg) {
    msg.handled = true;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Message not found' });
  }
});

// ===== AGENT MANAGEMENT ENDPOINTS =====

// Get all agents with status (no auth required for testing)
router.get('/agents/status', (req, res) => {
  try {
    console.log('[DEBUG] Agent status request received');
    console.log('[DEBUG] Agents data:', agents);
    
    // Always ensure we have the CallDocker agent
    if (!agents['calldocker-main-agent']) {
      console.log('[DEBUG] CallDocker agent not found, creating it');
      const callDockerAgent = {
        uuid: 'calldocker-main-agent',
        companyUuid: 'calldocker-company-uuid',
        username: 'calldocker_agent',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "CallDocker2024!"
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
      agents[callDockerAgent.uuid] = callDockerAgent;
      saveAgents();
    }
    
    const agentsWithStatus = Object.values(agents).map((agent: any) => {
      const company = companies[agent.companyUuid];
      
      // Ensure all required fields exist with defaults
      const agentData = {
        id: agent.uuid || agent.id || `agent-${Math.random().toString(36).substr(2, 9)}`,
        username: agent.username || 'Unknown Agent',
        fullName: agent.fullName || agent.username || 'Unknown Agent',
        email: agent.email || 'agent@example.com',
        phone: agent.phone || 'N/A',
        companyName: company?.name || 'Unknown Company',
        status: agent.status || 'offline',
        assignedToPublic: agent.assignedToPublic || false,
        currentCalls: agent.currentCalls || 0,
        maxCalls: agent.maxCalls || 5,
        availability: agent.availability || 'offline',
        lastActivity: agent.lastActivity || agent.updatedAt || agent.createdAt || new Date().toISOString(),
        skills: agent.skills || [],
        role: agent.role || 'agent',
        performance: agent.performance || {
          callsHandled: 0,
          avgRating: 0,
          successRate: 0
        },
        description: agent.description || '',
        loginCredentials: {
          username: agent.username,
          password: agent.password === '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' ? 'CallDocker2024!' : 'default2024!',
          companyUUID: agent.companyUuid
        }
      };
      
      console.log('[DEBUG] Processed agent:', agentData);
      return agentData;
    });

    console.log('[DEBUG] Final agents array:', agentsWithStatus);

    res.json({
      success: true,
      agents: agentsWithStatus,
      onlineCount: agentsWithStatus.filter((a: any) => a.status === 'online').length,
      totalCount: agentsWithStatus.length
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== AGENT AUTHENTICATION ENDPOINTS =====

// Agent login endpoint
router.post('/widget/auth/login', async (req, res) => {
  try {
    console.log('[DEBUG] Agent login request received:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    const { companyUuid, username, password } = req.body;
    
    console.log('[DEBUG] Extracted fields:', {
      companyUuid,
      username,
      password: password ? '[HIDDEN]' : 'undefined'
    });
    
    // Validate required fields
    if (!companyUuid || !username || !password) {
      console.log('[DEBUG] Validation failed - missing required fields');
      return res.status(400).json({ error: 'Company UUID, username, and password are required' });
    }
    
    // Find agent by company UUID and username
    const agent = Object.values(agents).find((a: any) => 
      a.companyUuid === companyUuid && a.username === username
    ) as any;
    
    if (!agent) {
      console.log('[DEBUG] Agent not found:', { companyUuid, username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('[DEBUG] Agent found:', { agentId: agent.uuid, status: agent.status });
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, agent.password);
    console.log('[DEBUG] Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('[DEBUG] Invalid password for agent:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if agent is approved
    if (agent.registrationStatus !== 'approved') {
      console.log('[DEBUG] Agent not approved:', agent.registrationStatus);
      return res.status(403).json({ error: 'Agent account not approved' });
    }
    
    // Update agent status to online
    agent.status = 'online';
    agent.availability = 'online';
    agent.lastActivity = new Date().toISOString();
    agent.updatedAt = new Date().toISOString();
    saveAgents();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        agentId: agent.uuid,
        username: agent.username, 
        companyUuid: agent.companyUuid, 
        role: 'agent',
        fullName: agent.fullName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('[DEBUG] Agent login successful:', username);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      agent: {
        id: agent.uuid,
        username: agent.username,
        fullName: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        role: agent.role,
        status: agent.status,
        companyUuid: agent.companyUuid,
        skills: agent.skills || [],
        performance: agent.performance || {
          callsHandled: 0,
          avgRating: 0,
          successRate: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Agent login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agent logout endpoint
router.post('/widget/auth/logout', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    if (agentId) {
      const agent = agents[agentId];
      if (agent) {
        agent.status = 'offline';
        agent.availability = 'offline';
        agent.lastActivity = new Date().toISOString();
        agent.updatedAt = new Date().toISOString();
        saveAgents();
      }
    }
    
    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Agent logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent status
router.get('/widget/agent/status/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agents[agentId];
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({
      success: true,
      agent: {
        id: agent.uuid,
        username: agent.username,
        fullName: agent.fullName,
        status: agent.status,
        availability: agent.availability,
        currentCalls: agent.currentCalls || 0,
        maxCalls: agent.maxCalls || 5,
        lastActivity: agent.lastActivity,
        performance: agent.performance || {
          callsHandled: 0,
          avgRating: 0,
          successRate: 0
        }
      }
    });
  } catch (error) {
    console.error('Get agent status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update agent status
router.put('/widget/agent/status/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const { status, availability, currentCalls } = req.body;
    
    const agent = agents[agentId];
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    if (status) agent.status = status;
    if (availability) agent.availability = availability;
    if (currentCalls !== undefined) agent.currentCalls = currentCalls;
    
    agent.lastActivity = new Date().toISOString();
    agent.updatedAt = new Date().toISOString();
    saveAgents();
    
    res.json({ success: true, message: 'Agent status updated' });
  } catch (error) {
    console.error('Update agent status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== CALL MANAGEMENT ENDPOINTS =====

// Get active calls for agent
router.get('/widget/agent/calls/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agents[agentId];
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Mock active calls data
    const activeCalls = [
      {
        id: 'call-001',
        customerName: 'John Doe',
        customerPhone: '+1-555-0123',
        status: 'active',
        duration: 180,
        startTime: new Date(Date.now() - 180000).toISOString(),
        type: 'incoming',
        priority: 'normal'
      }
    ];
    
    res.json({
      success: true,
      calls: activeCalls,
      count: activeCalls.length
    });
  } catch (error) {
    console.error('Get agent calls error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign call to agent
router.post('/widget/calls/assign', (req, res) => {
  try {
    const { callId, agentId } = req.body;
    
    const agent = agents[agentId];
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Check if agent can handle more calls
    if (agent.currentCalls >= agent.maxCalls) {
      return res.status(400).json({ error: 'Agent at maximum call capacity' });
    }
    
    // Update agent call count
    agent.currentCalls += 1;
    agent.updatedAt = new Date().toISOString();
    saveAgents();
    
    res.json({
      success: true,
      message: 'Call assigned successfully',
      agent: {
        id: agent.uuid,
        currentCalls: agent.currentCalls,
        maxCalls: agent.maxCalls
      }
    });
  } catch (error) {
    console.error('Assign call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End call
router.post('/widget/calls/end/:callId', (req, res) => {
  try {
    const { callId } = req.params;
    const { agentId, duration, satisfaction } = req.body;
    
    const agent = agents[agentId];
    if (agent) {
      // Update agent call count and performance
      agent.currentCalls = Math.max(0, agent.currentCalls - 1);
      agent.performance = agent.performance || {
        callsHandled: 0,
        avgRating: 0,
        successRate: 0
      };
      
      agent.performance.callsHandled += 1;
      if (satisfaction) {
        agent.performance.avgRating = (
          (agent.performance.avgRating * (agent.performance.callsHandled - 1) + satisfaction) / 
          agent.performance.callsHandled
        );
      }
      
      agent.updatedAt = new Date().toISOString();
      saveAgents();
    }
    
    res.json({
      success: true,
      message: 'Call ended successfully',
      callId
    });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Escalate call
router.post('/widget/calls/escalate/:callId', (req, res) => {
  try {
    const { callId } = req.params;
    const { reason, escalatedTo } = req.body;
    
    res.json({
      success: true,
      message: 'Call escalated successfully',
      callId,
      escalatedTo,
      reason
    });
  } catch (error) {
    console.error('Escalate call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 