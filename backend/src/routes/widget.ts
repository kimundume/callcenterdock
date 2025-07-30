import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { 
  companies, 
  agents, 
  sessions, 
  saveCompanies, 
  saveAgents, 
  saveSessions,
  findUserByCompanyAndRole,
  findCompanyByEmail,
  findPendingCompanyByEmail
} from '../data/persistentStorage';
import { EmailService } from '../services/emailService';
import type { TempStorage } from '../server';
import { generateId } from '../server';

declare global {
  // eslint-disable-next-line no-var
  var tempStorage: TempStorage;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-prod';

// Password strength regex (min 8 chars, 1 upper, 1 lower, 1 number)
function isStrongPassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(pw);
}

// Email validation regex
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Input validation
function validateString(str: string) {
  return typeof str === 'string' && str.trim().length > 0;
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many authentication attempts, please try again later.'
});

// JWT middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/company/register - Now requires Super Admin approval
router.post('/company/register', async (req: Request, res: Response) => {
  const { companyName, displayName, adminUsername, adminPassword, email } = req.body;
  
  // Validate all required fields
  if (![companyName, adminUsername, adminPassword, email].every((v: string) => validateString(v))) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate password strength
  if (!isStrongPassword(adminPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
  }
  
  // Check if company already exists (by email)
  const existingCompany = global.tempStorage.companies.find(c => c.email === email);
  if (existingCompany) {
    return res.status(400).json({ error: 'A company with this email already exists' });
  }
  
  // Generate UUID
  const uuid = uuidv4();
  
  // Store company with pending status in tempStorage
  global.tempStorage.companies.push({
    uuid,
    name: companyName,
    displayName: displayName || companyName,
    email,
    verified: false,
    suspended: false,
    createdAt: new Date().toISOString(),
    status: 'pending' // Set status to pending for Super Admin approval
  });
  
  // Store admin credentials for later use (when approved)
  // Note: In a real application, you'd want to hash this and store it securely
  global.tempStorage.pendingAdmins = global.tempStorage.pendingAdmins || [];
  global.tempStorage.pendingAdmins.push({
    uuid,
    adminUsername,
    adminPassword, // This should be hashed in production
    email,
    createdAt: new Date().toISOString()
  });
  
  res.json({ 
    message: 'Registration submitted successfully! Your account will be reviewed by our team and you will be notified once approved.',
    uuid,
    email,
    requiresApproval: true
  });
});

// POST /api/company/verify-email
router.post('/company/verify-email', async (req: Request, res: Response) => {
  const { email, token } = req.body;
  
  if (!email || !token) {
    return res.status(400).json({ error: 'Email and verification token required' });
  }
  
  // Verify token
  if (!EmailService.verifyToken(email, token, 'email')) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }
  
  // Find pending company
  const pendingCompany = findPendingCompanyByEmail(email);
  if (!pendingCompany) {
    return res.status(404).json({ error: 'No pending registration found for this email' });
  }
  
  try {
    // Create the actual company
    companies[pendingCompany.uuid] = {
      uuid: pendingCompany.uuid,
      name: pendingCompany.companyName,
      companyName: pendingCompany.companyName,
      displayName: pendingCompany.displayName,
      email: pendingCompany.email,
      verified: true,
      createdAt: new Date().toISOString()
    };
    
    // Create admin user
    const hashedPassword = await bcrypt.hash(pendingCompany.adminPassword, 10);
    users[pendingCompany.adminUsername + '@' + pendingCompany.uuid] = {
      username: pendingCompany.adminUsername,
      password: hashedPassword,
      companyUuid: pendingCompany.uuid,
      role: 'admin',
      email: pendingCompany.email,
      createdAt: new Date().toISOString()
    };
    
    // Remove from pending
    delete pendingCompanies[pendingCompany.uuid];
    
    // Generate JWT token
    const token = jwt.sign({ 
      username: pendingCompany.adminUsername, 
      companyUuid: pendingCompany.uuid, 
      role: 'admin' 
    }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ 
      message: 'Email verified successfully! Your account is now active.',
      uuid: pendingCompany.uuid,
      token,
      companyName: pendingCompany.companyName,
      displayName: pendingCompany.displayName
    });
    
  } catch (error) {
    console.error('Error creating company after verification:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login - Updated to support email login
router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, companyUuid, username, password, role } = req.body;
  
  let uuid = companyUuid;
  let user = null;
  
  // If email is provided, find company by email
  if (email && !companyUuid) {
    // Check both storage locations for companies
    let company = findCompanyByEmail(email);
    if (!company) {
      // Check global.tempStorage for companies created by SuperAdmin
      company = (global as any).tempStorage?.companies?.find((c: any) => c.email === email);
    }
    if (!company) {
      return res.status(404).json({ error: 'Company not found with this email' });
    }
    uuid = company.uuid;
  }
  
  if (!uuid || !password || !role) {
    return res.status(400).json({ error: 'Company UUID, password, and role are required' });
  }
  
  // Try to find user by username first - check both storage locations
  if (username) {
    user = findUserByCompanyAndRole(uuid, username, role);
    if (!user) {
      // Check global.tempStorage for users created by SuperAdmin
      user = (global as any).tempStorage?.authUsers?.find((u: any) => 
        u.companyUuid === uuid && u.username === username && u.role === role
      );
    }
  }
  
  // If no user found and email provided, try to find admin by email
  if (!user && email && role === 'admin') {
    let company = findCompanyByEmail(email);
    if (!company) {
      company = (global as any).tempStorage?.companies?.find((c: any) => c.email === email);
    }
    if (company) {
      // Check both storage locations for admin user
      user = Object.values(users).find((u: any) => 
        u.companyUuid === company.uuid && 
        u.role === 'admin' && 
        u.email === email
      );
      if (!user) {
        user = (global as any).tempStorage?.authUsers?.find((u: any) => 
          u.companyUuid === company.uuid && 
          u.role === 'admin' && 
          u.email === email
        );
      }
    }
  }
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ 
    username: user.username, 
    companyUuid: uuid, 
    role 
  }, JWT_SECRET, { expiresIn: '1h' });
  
  // Get company info for response - check both storage locations
  let company = companies[uuid];
  if (!company) {
    company = (global as any).tempStorage?.companies?.find((c: any) => c.uuid === uuid);
  }
  
  res.json({ 
    token,
    companyUuid: uuid,
    username: user.username,
    role,
    companyName: company?.name || company?.companyName,
    displayName: company?.displayName
  });
});

// POST /api/auth/forgot-password
router.post('/auth/forgot-password', authLimiter as any, async (req: Request, res: Response) => {
  const { email, companyUuid, username } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  let uuid = companyUuid;
  let user = null;
  
  // Find company by email if UUID not provided
  if (!uuid) {
    const company = findCompanyByEmail(email);
    if (!company) {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    uuid = company.uuid;
  }
  
  // Find user
  if (username) {
    user = findUserByCompanyAndRole(uuid, username, 'admin');
  } else {
    // Find admin by email
    user = Object.values(users).find((u: any) => 
      u.companyUuid === uuid && 
      u.role === 'admin' && 
      u.email === email
    );
  }
  
  if (!user) {
    return res.status(404).json({ error: 'No account found with the provided information' });
  }
  
  // Generate reset token
  const resetToken = EmailService.generateToken();
  EmailService.storeToken(email, resetToken, 'password');
  
  // Send password reset email
  const emailSent = await EmailService.sendPasswordReset(email, user.username, resetToken);
  
  if (!emailSent) {
    return res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
  }
  
  res.json({ message: 'Password reset email sent. Please check your inbox.' });
});

// POST /api/auth/reset-password
router.post('/auth/reset-password', async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;
  
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Email, token, and new password are required' });
  }
  
  // Validate password strength
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
  }
  
  // Verify token
  if (!EmailService.verifyToken(email, token, 'password')) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  
  // Find company and user
  const company = findCompanyByEmail(email);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  const user = Object.values(users).find((u: any) => 
    u.companyUuid === company.uuid && 
    u.role === 'admin' && 
    u.email === email
  );
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  try {
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

// POST /api/auth/forgot-uuid
router.post('/auth/forgot-uuid', authLimiter as any, async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // Find company by email
  const company = findCompanyByEmail(email);
  if (!company) {
    return res.status(404).json({ error: 'No company found with this email' });
  }
  
  // Send UUID reminder email
  const emailSent = await EmailService.sendCompanyUuidReminder(email, company.companyName || company.name, company.uuid);
  
  if (!emailSent) {
    return res.status(500).json({ error: 'Failed to send UUID reminder. Please try again.' });
  }
  
  res.json({ message: 'Company UUID reminder sent. Please check your inbox.' });
});

// POST /api/agent/add (admin only, protected) - Updated with email support
router.post('/agent/add', authMiddleware, async (req: Request, res: Response) => {
  const { agentUsername, agentPassword, agentEmail } = req.body;
  
  if (!validateString(agentUsername) || !validateString(agentPassword)) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (agentEmail && !isValidEmail(agentEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (!isStrongPassword(agentPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
  }
  
  const decoded = req.user;
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Check if agent already exists - check both storage locations
  const key = agentUsername + '@' + decoded.companyUuid;
  let existingUser = users[key];
  
  if (!existingUser) {
    // Check global.tempStorage for users created by SuperAdmin
    existingUser = (global as any).tempStorage?.authUsers?.find((u: any) => 
      u.username === agentUsername && u.companyUuid === decoded.companyUuid
    );
  }
  
  if (existingUser) {
    return res.status(400).json({ error: 'Agent already exists' });
  }
  
  try {
    const hashed = await bcrypt.hash(agentPassword, 10);
    
    // Get company info - check both storage locations
    let company = companies[decoded.companyUuid];
    if (!company) {
      company = (global as any).tempStorage?.companies?.find((c: any) => c.uuid === decoded.companyUuid);
    }
    
    // Create agent in the appropriate storage location
    if (company && (global as any).tempStorage?.companies?.find((c: any) => c.uuid === decoded.companyUuid)) {
      // Company was created by SuperAdmin, store in global.tempStorage
      const newAgent = {
        uuid: generateId(),
        username: agentUsername,
        password: hashed,
        companyUuid: decoded.companyUuid,
        role: 'agent',
        email: agentEmail,
        status: 'online',
        registrationStatus: 'approved',
        createdAt: new Date().toISOString()
      };
      
      (global as any).tempStorage.authUsers = (global as any).tempStorage.authUsers || [];
      (global as any).tempStorage.authUsers.push(newAgent);
      
      // Also add to agents array for consistency
      (global as any).tempStorage.agents = (global as any).tempStorage.agents || [];
      (global as any).tempStorage.agents.push(newAgent);
      
    } else {
      // Company was created through regular registration, store in users object
      users[key] = {
        username: agentUsername,
        password: hashed,
        companyUuid: decoded.companyUuid,
        role: 'agent',
        email: agentEmail,
        createdAt: new Date().toISOString()
      };
    }
    
    // Send invitation email if email provided
    if (agentEmail && company) {
      const companyName: string = (company && typeof company.name === 'string' && company.name.trim())
        ? company.name
        : (company && typeof company.companyName === 'string' && company.companyName.trim())
          ? company.companyName
          : 'Company';
      const emailSent = await EmailService.sendAgentInvitation(
        agentEmail,
        agentUsername,
        companyName,
        decoded.companyUuid,
        agentPassword // Send temporary password
      );
      
      if (!emailSent) {
        console.warn('Failed to send agent invitation email');
      }
    }
    
    res.json({ 
      success: true, 
      message: agentEmail ? 'Agent created and invitation email sent' : 'Agent created successfully'
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent. Please try again.' });
  }
});

// POST /api/agent/reset-password (admin only, protected)
router.post('/agent/reset-password', authMiddleware, async (req: Request, res: Response) => {
  const { companyUuid, agentUsername, newPassword } = req.body;
  
  if (!validateString(agentUsername) || !validateString(newPassword)) {
    return res.status(400).json({ error: 'Agent username and new password are required' });
  }
  
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
  }
  
  const decoded = req.user;
  if (decoded.role !== 'admin' || decoded.companyUuid !== companyUuid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    // Find agent in both storage locations
    const key = agentUsername + '@' + companyUuid;
    let agent = users[key];
    
    if (!agent) {
      // Check global.tempStorage for agents created by SuperAdmin
      agent = (global as any).tempStorage?.authUsers?.find((u: any) => 
        u.username === agentUsername && u.companyUuid === companyUuid && u.role === 'agent'
      );
    }
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    agent.password = hashedPassword;
    
    res.json({ success: true, message: 'Agent password updated successfully' });
  } catch (error) {
    console.error('Error updating agent password:', error);
    res.status(500).json({ error: 'Failed to update agent password. Please try again.' });
  }
});

// POST /api/agent/register - Public agent registration requiring Super Admin approval
router.post('/agent/register', async (req: Request, res: Response) => {
  const { username, password, email, companyUuid } = req.body;
  
  // Validate all required fields
  if (![username, password, email, companyUuid].every((v: string) => validateString(v))) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate password strength
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
  }
  
  // Check if company exists and is approved
  const company = global.tempStorage.companies.find(c => c.uuid === companyUuid);
  if (!company) {
    return res.status(400).json({ error: 'Company not found' });
  }
  
  if (company.status !== 'approved') {
    return res.status(400).json({ error: 'Company is not approved yet' });
  }
  
  // Check if agent already exists
  const existingAgent = global.tempStorage.agents.find((a: any) => 
    a.username === username && a.companyUuid === companyUuid
  );
  if (existingAgent) {
    return res.status(400).json({ error: 'Agent with this username already exists for this company' });
  }
  
  // Generate UUID
  const uuid = uuidv4();
  
  // Store agent with pending status in tempStorage
  global.tempStorage.agents.push({
    uuid,
    companyUuid,
    username,
    email,
    status: 'offline',
    registrationStatus: 'pending', // Set status to pending for Super Admin approval
    createdAt: new Date().toISOString()
  });
  
  // Store agent credentials for later use (when approved)
  global.tempStorage.pendingAgentCredentials = global.tempStorage.pendingAgentCredentials || [];
  global.tempStorage.pendingAgentCredentials.push({
    uuid,
    username,
    password, // This should be hashed in production
    email,
    companyUuid,
    createdAt: new Date().toISOString()
  });
  
  res.json({ 
    message: 'Agent registration submitted successfully! Your account will be reviewed by our team and you will be notified once approved.',
    uuid,
    email,
    requiresApproval: true
  });
});

// PUT /api/company/update-display-name (admin only, protected)
router.put('/company/update-display-name', authMiddleware, async (req: Request, res: Response) => {
  const { displayName } = req.body;
  
  if (!validateString(displayName)) {
    return res.status(400).json({ error: 'Display name is required' });
  }
  
  const decoded = req.user;
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const company = companies[decoded.companyUuid];
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  company.displayName = displayName;
  company.updatedAt = new Date().toISOString();
  
  res.json({ 
    success: true, 
    message: 'Display name updated successfully',
    displayName
  });
});

// GET /api/company/info (protected)
router.get('/company/info', authMiddleware, async (req: Request, res: Response) => {
  const decoded = req.user;
  
  // Check both storage locations for company
  let company = companies[decoded.companyUuid];
  if (!company) {
    // Check global.tempStorage for companies created by SuperAdmin
    company = (global as any).tempStorage?.companies?.find((c: any) => c.uuid === decoded.companyUuid);
  }
  
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  res.json({
    uuid: company.uuid,
    companyName: company.companyName || company.name,
    displayName: company.displayName,
    email: company.email,
    verified: company.verified,
    createdAt: company.createdAt
  });
});

// POST /api/widget/register
router.post('/register', (req: Request, res: Response) => {
  const { companyName, email } = req.body;
  if (!companyName || !email) {
    return res.status(400).json({ error: 'companyName and email are required' });
  }
  // Check if company already exists (by email)
  const existing = Object.values(companies).find((c: any) => c.email === email);
  if (existing) {
    return res.json({ uuid: existing.uuid });
  }
  const uuid = uuidv4();
  companies[uuid] = { 
    uuid, 
    name: companyName,
    companyName, 
    email, 
    verified: false,
    createdAt: new Date().toISOString() 
  };
  res.json({ uuid });
});

// GET /api/widget/calls/:uuid
router.get('/calls/:uuid', (req: Request, res: Response) => {
  const { uuid } = req.params;
  // Import calls from tempDB
  // (import at top if not already)
  // @ts-ignore
  const { calls } = require('../data/tempDB');
  if (!calls[uuid]) {
    return res.json([]);
  }
  res.json(calls[uuid]);
});

// POST /api/call/log (save call log)
router.post('/call/log', (req: Request, res: Response) => {
  const { companyUuid, agent, notes, disposition, duration, sessionId, tags, time } = req.body;
  if (!companyUuid || !agent || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!calls[companyUuid]) calls[companyUuid] = [];
  calls[companyUuid].unshift({
    time: time || new Date().toISOString(),
    agent,
    notes,
    disposition,
    duration,
    sessionId,
    tags: tags || [],
  });
  res.json({ success: true });
});

// GET /api/call/logs/:companyUuid (fetch all call logs for a company)
router.get('/call/logs/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  res.json(calls[companyUuid] || []);
});

// GET /api/agents/:companyUuid (list all agents for a company with online status)
router.get('/agents/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  
  // Get agents from both storage locations
  let agentList = Object.values(users)
    .filter((u: any) => u.companyUuid === companyUuid && u.role === 'agent')
    .map((u: any) => ({
      username: u.username,
      role: u.role,
      online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
    }));
  
  // Add agents from global.tempStorage (SuperAdmin-created companies)
  const globalAgents = (global as any).tempStorage?.authUsers?.filter((u: any) => 
    u.companyUuid === companyUuid && u.role === 'agent'
  ) || [];
  
  const globalAgentList = globalAgents.map((u: any) => ({
    username: u.username,
    role: u.role,
    online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
  }));
  
  // Combine both lists, avoiding duplicates
  const combinedAgents = [...agentList];
  const safeGlobalAgentList = Array.isArray(globalAgentList) ? globalAgentList : [];
  safeGlobalAgentList.forEach((globalAgent: any) => {
    if (!combinedAgents.find((agent: any) => agent.username === globalAgent.username)) {
      combinedAgents.push(globalAgent);
    }
  });
  
  res.json(combinedAgents);
});

// PATCH /api/agent/:companyUuid/:username (update agent role/active)
router.patch('/agent/:companyUuid/:username', (req: Request, res: Response) => {
  const { companyUuid, username } = req.params;
  const { role, active } = req.body;
  const key = username + '@' + companyUuid;
  if (!users[key]) return res.status(404).json({ error: 'Agent not found' });
  if (role) users[key].role = role;
  if (typeof active === 'boolean') users[key].active = active;
  res.json({ success: true, user: users[key] });
});

// DELETE /api/agent/:companyUuid/:username (remove agent)
router.delete('/agent/:companyUuid/:username', (req: Request, res: Response) => {
  const { companyUuid, username } = req.params;
  const key = username + '@' + companyUuid;
  if (!users[key]) return res.status(404).json({ error: 'Agent not found' });
  delete users[key];
  res.json({ success: true });
});

// GET /api/widget/settings/:companyUuid
router.get('/settings/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const settings = widgetSettings[companyUuid] || {
    text: 'Call Us',
    color: '#00e6ef',
    shape: 'round',
    img: 'https://via.placeholder.com/24',
    position: 'bottom-right',
    animation: 'none',
    dark: false,
  };
  res.json(settings);
});

// POST /api/widget/settings/:companyUuid (admin only)
router.post('/settings/:companyUuid', authMiddleware, (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const decoded = req.user;
  if (!decoded || decoded.companyUuid !== companyUuid || decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { text, color, shape, img, position, animation, dark } = req.body;
  // Basic validation
  if (!text || !color || !shape || !position || !animation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  widgetSettings[companyUuid] = { text, color, shape, img, position, animation, dark: !!dark };
  res.json({ success: true, settings: widgetSettings[companyUuid] });
});

// GET /api/widget/ivr/:companyUuid
router.get('/ivr/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const config = ivrConfigs[companyUuid] || {
    steps: [
      {
        prompt: 'Welcome to CallDocker! Press 1 for Sales, 2 for Support.',
        routes: {
          '1': { prompt: 'Connecting you to Sales...' },
          '2': { prompt: 'Connecting you to Support...' },
          'sales': { prompt: 'Connecting you to Sales...' },
          'support': { prompt: 'Connecting you to Support...' },
        },
        fallback: { prompt: 'Sorry, I didn\'t get that. Please type 1 for Sales or 2 for Support.' }
      }
    ]
  };
  res.json(config);
});

// POST /api/widget/ivr/:companyUuid (admin only)
router.post('/ivr/:companyUuid', authMiddleware, (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const decoded = req.user;
  if (!decoded || decoded.companyUuid !== companyUuid || decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { steps } = req.body;
  if (!Array.isArray(steps)) {
    return res.status(400).json({ error: 'Invalid IVR config' });
  }
  ivrConfigs[companyUuid] = { steps };
  res.json({ success: true, config: ivrConfigs[companyUuid] });
});

// DEV ONLY: Create demo agent for demo company (no auth)
router.post('/demo/create-demo-agent', async (req: Request, res: Response) => {
  const { companyUuid, username, password } = req.body;
  if (!companyUuid || !username || !password) return res.status(400).json({ error: 'Missing fields' });

  // 1. Create the demo company if it doesn't exist
  if (!global.tempStorage.companies) global.tempStorage.companies = [];
  let company = global.tempStorage.companies.find((c: any) => c.uuid === companyUuid);
  if (!company) {
    company = {
      uuid: companyUuid,
      name: 'Demo Company',
      email: 'demo@calldocker.com',
      status: 'approved',
      createdAt: new Date().toISOString(),
      verified: true,
      displayName: 'Demo Company',
    };
    global.tempStorage.companies.push(company);
  }

  // 2. Create the agent in users (for legacy compatibility)
  const key = username + '@' + companyUuid;
  if (!users[key]) {
    const hashed = await bcrypt.hash(password, 10);
    users[key] = { username, password: hashed, companyUuid, role: 'agent' };
  }

  // 3. Add the agent to global.tempStorage.agents as online and approved
  if (!global.tempStorage.agents) global.tempStorage.agents = [];
  let agent = global.tempStorage.agents.find((a: any) => a.username === username && a.companyUuid === companyUuid);
  if (!agent) {
    agent = {
      uuid: username + '-' + companyUuid,
      username,
      companyUuid,
      email: 'demo-agent@calldocker.com',
      status: 'online',
      registrationStatus: 'approved',
      createdAt: new Date().toISOString(),
    };
    global.tempStorage.agents.push(agent);
  } else {
    agent.status = 'online';
    agent.registrationStatus = 'approved';
  }

  res.json({
    success: true,
    company,
    agent,
    alreadyExists: !!users[key] && !!agent
  });
});

// DEV ONLY: Save widget settings without auth
router.post('/demo/settings/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const { text, color, shape, img, position, animation, dark } = req.body;
  if (!text || !color || !shape || !position || !animation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  widgetSettings[companyUuid] = { text, color, shape, img, position, animation, dark: !!dark };
  res.json({ success: true, settings: widgetSettings[companyUuid] });
});
// DEV ONLY: Save IVR config without auth
router.post('/demo/ivr/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const { steps } = req.body;
  if (!Array.isArray(steps)) {
    return res.status(400).json({ error: 'Invalid IVR config' });
  }
  ivrConfigs[companyUuid] = { steps };
  res.json({ success: true, config: ivrConfigs[companyUuid] });
});

// --- Widget Availability & Contact Form Endpoints ---

// GET /api/widget/availability
router.get('/availability', (req, res) => {
  const { companyUuid } = req.query;
  
  // If no companyUuid provided, this is the public landing page widget
  if (!companyUuid) {
    // Check if CallDocker agents are online
    const callDockerAgents = global.tempStorage.agents.filter(agent => 
      agent.companyUuid === 'calldocker-company-uuid' &&
      agent.registrationStatus === 'approved' && 
      agent.status === 'online'
    );
    
    const isOnline = callDockerAgents.length > 0;
    res.json({ 
      online: isOnline,
      routingType: 'public',
      availableAgents: callDockerAgents.length
    });
    return;
  }
  
  // If companyUuid provided, this is a company-specific widget
  const company = global.tempStorage.companies.find(c => c.uuid === companyUuid);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  if (company.status !== 'approved') {
    return res.status(403).json({ error: 'Company not approved' });
  }
  
  // Check if this company has online agents
  const companyAgents = global.tempStorage.agents.filter(agent => 
    agent.companyUuid === companyUuid &&
    agent.registrationStatus === 'approved' &&
    agent.status === 'online'
  );
  
  const isOnline = companyAgents.length > 0;
  res.json({ 
    online: isOnline,
    routingType: 'company',
    companyName: company.name,
    availableAgents: companyAgents.length
  });
});

// POST /api/widget/contact
router.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!global.tempStorage.contactMessages) {
    global.tempStorage.contactMessages = [];
  }
  global.tempStorage.contactMessages.push({
    _id: Math.random().toString(36).substr(2, 9),
    name,
    email,
    phone,
    message,
    timestamp: new Date().toISOString()
  });
  res.json({ success: true });
});

// POST /api/widget/route-call - Enhanced routing for soft launch
router.post('/route-call', (req: Request, res: Response) => {
  const { companyUuid, visitorId, pageUrl, callType = 'call', routingConfig } = req.body;
  console.log('[route-call] Incoming request:', { companyUuid, visitorId, pageUrl, callType, routingConfig });

  // Generate session ID
  const sessionId = `call-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
  const createdAt = new Date().toISOString();

  function createSession({
    companyUuid,
    visitorId,
    agentId,
    type,
    status,
    createdAt,
    pageUrl,
    queuePosition
  }: {
    companyUuid: string;
    visitorId: string;
    agentId?: string;
    type: 'call' | 'chat';
    status: 'waiting' | 'active' | 'ended' | 'ringing';
    createdAt: string;
    pageUrl?: string;
    queuePosition?: number;
  }) {
    const session = {
      sessionId,
      companyUuid,
      visitorId,
      agentId,
      type,
      status,
      createdAt,
      pageUrl,
      queuePosition
    };
    sessions.push(session);
    saveSessions(); // Save to file
    console.log('[route-call] Session created:', session);
    return session;
  }

  // Find company
  const company = companies[companyUuid];
  if (!company) {
    console.log('[route-call] Company not found:', companyUuid);
    return res.status(404).json({ success: false, error: 'Company not found' });
  }

  // Find available agents
  const availableAgents = Object.values(agents).filter((a: any) => 
    a.companyUuid === companyUuid && 
    a.status === 'online' && 
    a.registrationStatus === 'approved'
  );
  console.log('[route-call] Available agents:', availableAgents.map((a: any) => a.username));
  if (availableAgents.length === 0) {
    return res.status(200).json({ success: false, error: 'No agents online' });
  }
  const assignedAgent = availableAgents[0] as any;
  console.log('[route-call] Assigned agent:', assignedAgent.username);

  // Find agent socketId (if available)
  let agentSocketId: string | undefined = undefined;
  // Note: We'll need to implement socketId tracking properly
  console.log('[route-call] Agent socketId lookup:', { companyUuid, username: assignedAgent.username, agentSocketId: 'Not implemented yet' });

  // Create session
  const session = createSession({
    companyUuid,
    visitorId,
    agentId: assignedAgent.username,
    type: callType === 'call' ? 'call' : 'chat',
    status: 'ringing' as 'ringing', // Fix: use correct union type
    createdAt: new Date().toISOString(),
    pageUrl
  });
  console.log('[route-call] Session created with type:', session.type);

  // Emit incoming-call to agent dashboard via socket.io
  const io = req.app.get('io');
  if (io && agentSocketId) {
    console.log('[route-call] Emitting incoming-call to agent with callType:', callType);
    io.to(agentSocketId).emit('incoming-call', {
      sessionId,
      companyUuid,
      visitorId,
      callType,
      pageUrl
    });
    console.log('[route-call] Emitted incoming-call to agent:', assignedAgent.username, 'socketId:', agentSocketId);
  } else {
    console.log('[route-call] No socketId found for agent:', assignedAgent.username);
  }

  return res.json({ success: true, sessionId, agent: assignedAgent.username });
});

// POST /api/widget/agent/status
router.post('/agent/status', (req, res) => {
  const { agentUuid, status } = req.body;
  
  if (!agentUuid || !status || !['online', 'offline'].includes(status)) {
    return res.status(400).json({ error: 'Invalid agent UUID or status' });
  }
  
  const agent = agents[agentUuid];
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  if (agent.registrationStatus !== 'approved') {
    return res.status(403).json({ error: 'Agent not approved' });
  }
  
  agent.status = status;
  agent.updatedAt = new Date().toISOString();
  saveAgents();
  
  res.json({ success: true, agent });
});

// GET /api/widget/agent/status/:agentUuid
router.get('/agent/status/:agentUuid', (req, res) => {
  const { agentUuid } = req.params;
  
  const agent = global.tempStorage.agents.find((a: any) => a.uuid === agentUuid);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json({
    uuid: agent.uuid,
    username: agent.username,
    status: agent.status,
    companyUuid: agent.companyUuid,
    registrationStatus: agent.registrationStatus
  });
});

// GET /api/widget/agents/online
router.get('/agents/online', (req, res) => {
  const { companyUuid } = req.query;
  
  let onlineAgents;
  
  if (companyUuid) {
    // Get online agents for specific company
    onlineAgents = Object.values(agents).filter((agent: any) => 
      agent.companyUuid === companyUuid &&
      agent.registrationStatus === 'approved' &&
      agent.status === 'online'
    );
  } else {
    // Get all online agents (for public routing)
    onlineAgents = Object.values(agents).filter((agent: any) => 
      agent.registrationStatus === 'approved' &&
      agent.status === 'online' &&
      Object.values(companies).find((company: any) => 
        company.uuid === agent.companyUuid && 
        company.status === 'approved'
      )
    );
  }
  
  res.json({
    count: onlineAgents.length,
    agents: onlineAgents.map((agent: any) => ({
      uuid: agent.uuid,
      username: agent.username,
      email: agent.email,
      status: agent.status,
      companyUuid: agent.companyUuid
    }))
  });
});

// GET /api/widget/agents/:agentUuid/socket
router.get('/agents/:agentUuid/socket', (req, res) => {
  const { agentUuid } = req.params;
  
  const agent = agents[agentUuid];
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  // For now, return a placeholder socketId
  // In a real implementation, you'd track socket connections
  res.json({ 
    agentUuid, 
    socketId: agent.socketId || null || null,
    status: agent.status 
  });
});

// POST /api/widget/calldocker-agent/create
router.post('/calldocker-agent/create', async (req: Request, res: Response) => {
  const { username, fullName, email, phone, role, skills } = req.body;
  
  // Validate required fields
  if (!username || !fullName || !email || !phone || !role) {
    return res.status(400).json({ error: 'Username, full name, email, phone, and role are required' });
  }
  
  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Check if username already exists for CallDocker
  const existingUser = Object.values(users).find((u: any) => 
    u.companyUuid === 'calldocker-company-uuid' && u.username === username
  );
  
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists for CallDocker' });
  }
  
  // Generate password and user ID
  const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `cd-${Date.now()}`;
  
  // Create CallDocker agent user
  const newUser = {
    id: userId,
    username: username,
    fullName: fullName,
    email: email,
    phone: phone,
    role: role,
    skills: skills || ['enquiry_handling'],
    status: 'active',
    companyUuid: 'calldocker-company-uuid',
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    performance: {
      callsHandled: 0,
      avgRating: 0,
      successRate: 0
    }
  };
  
  // Store in users object
  users[userId] = newUser;
  
  // Also store in agents for compatibility
  const agentId = `agent-${userId}`;
  global.tempStorage.agents.push({
    uuid: userId,
    username: username,
    email: email,
    status: 'online',
    companyUuid: 'calldocker-company-uuid',
    registrationStatus: 'approved',
    createdAt: new Date().toISOString()
  });
  
  console.log(`[Widget] CallDocker agent created: ${username} (${userId})`);
  
  res.json({
    success: true,
    message: 'CallDocker agent created successfully',
    agent: {
      id: userId,
      username: username,
      fullName: fullName,
      email: email,
      phone: phone,
      role: role,
      skills: skills || ['enquiry_handling'],
      status: 'active',
      companyUuid: 'calldocker-company-uuid',
      // Return plain text password for display
      password: password,
      createdAt: new Date().toISOString()
    }
  });
});

// GET /api/widget/calldocker-agents - Get all CallDocker agents
router.get('/calldocker-agents', async (req: Request, res: Response) => {
  try {
    // Get all CallDocker agents from users object
    const callDockerAgents = Object.values(users).filter((u: any) => 
      u.companyUuid === 'calldocker-company-uuid'
    );

    // Also get from global.tempStorage.agents for compatibility
    const tempStorageAgents = global.tempStorage.agents.filter((a: any) => 
      a.companyUuid === 'calldocker-company-uuid'
    );

    // Merge and format the data
    const formattedAgents = callDockerAgents.map((user: any) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      skills: user.skills,
      performance: user.performance,
      createdAt: user.createdAt,
      companyUUID: user.companyUuid
    }));

    console.log(`[Widget] Retrieved ${formattedAgents.length} CallDocker agents`);
    
    res.json({
      success: true,
      agents: formattedAgents
    });
  } catch (error) {
    console.error('[Widget] Error fetching CallDocker agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/widget/company-agents - Get all company agents
router.get('/company-agents', async (req: Request, res: Response) => {
  try {
    // Get all non-CallDocker agents from users object
    const companyAgents = Object.values(users).filter((u: any) => 
      u.companyUuid !== 'calldocker-company-uuid'
    );

    // Also get from global.tempStorage.agents for compatibility
    const tempStorageAgents = global.tempStorage.agents.filter((a: any) => 
      a.companyUuid !== 'calldocker-company-uuid'
    );

    // Merge and format the data
    const formattedAgents = companyAgents.map((user: any) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      skills: user.skills,
      performance: user.performance,
      createdAt: user.createdAt,
      companyId: user.companyUuid,
      companyName: user.companyName || 'Unknown Company'
    }));

    console.log(`[Widget] Retrieved ${formattedAgents.length} company agents`);
    
    res.json({
      success: true,
      agents: formattedAgents
    });
  } catch (error) {
    console.error('[Widget] Error fetching company agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/widget/calls/active - Get active calls (optionally filter by agentUuid)
router.get('/calls/active', async (req: Request, res: Response) => {
  try {
    const { agentUuid } = req.query;
    // Get active calls from global.tempStorage.calls
    let activeCalls = global.tempStorage.calls.filter((call: any) => 
      ['waiting', 'connecting', 'active'].includes(call.status)
    );
    if (agentUuid) {
      activeCalls = activeCalls.filter((call: any) => call.assignedAgent === agentUuid);
    }
    console.log(`[Widget] Retrieved ${activeCalls.length} active calls${agentUuid ? ` for agent ${agentUuid}` : ''}`);
    res.json({
      success: true,
      calls: activeCalls
    });
  } catch (error) {
    console.error('[Widget] Error fetching active calls:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/widget/calls/history - Get call history
router.get('/calls/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get completed calls from global.tempStorage.calls
    const completedCalls = global.tempStorage.calls.filter((call: any) => 
      ['ended', 'missed'].includes(call.status)
    );

    // Paginate the results
    const paginatedCalls = completedCalls.slice(offset, offset + limit);

    console.log(`[Widget] Retrieved ${paginatedCalls.length} call history records (page ${page})`);
    
    res.json({
      success: true,
      calls: paginatedCalls,
      total: completedCalls.length,
      page: page,
      limit: limit
    });
  } catch (error) {
    console.error('[Widget] Error fetching call history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/widget/calls/analytics - Get call analytics
router.get('/calls/analytics', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '7d';
    
    // Calculate analytics from global.tempStorage.calls
    const allCalls = global.tempStorage.calls;
    const totalCalls = allCalls.length;
    const completedCalls = allCalls.filter((call: any) => call.status === 'ended');
    const avgDuration = completedCalls.length > 0 
      ? completedCalls.reduce((sum: number, call: any) => sum + (call.duration || 0), 0) / completedCalls.length 
      : 0;
    
    // Mock satisfaction and response time for now
    const satisfaction = 4.8;
    const responseTime = 45;

    console.log(`[Widget] Retrieved call analytics for period: ${period}`);
    
    res.json({
      success: true,
      analytics: {
        totalCalls,
        avgDuration,
        satisfaction,
        responseTime
      }
    });
  } catch (error) {
    console.error('[Widget] Error fetching call analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/widget/test-call (test widget functionality)
router.post('/test-call', async (req: Request, res: Response) => {
  const { companyUuid } = req.body;
  
  if (!companyUuid) {
    return res.status(400).json({ error: 'Company UUID is required' });
  }
  
  try {
    // Get agents for the company
    let agentList = Object.values(users)
      .filter((u: any) => u.companyUuid === companyUuid && u.role === 'agent')
      .map((u: any) => ({
        username: u.username,
        role: u.role,
        online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
      }));
    
    // Add agents from global.tempStorage (SuperAdmin-created companies)
    const globalAgents = (global as any).tempStorage?.authUsers?.filter((u: any) => 
      u.companyUuid === companyUuid && u.role === 'agent'
    ) || [];
    
    const globalAgentList = globalAgents.map((u: any) => ({
      username: u.username,
      role: u.role,
      online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
    }));
    
    // Combine both lists
    const combinedAgents = [...agentList];
    const safeGlobalAgentList = Array.isArray(globalAgentList) ? globalAgentList : [];
    safeGlobalAgentList.forEach((globalAgent: any) => {
      if (!combinedAgents.find((agent: any) => agent.username === globalAgent.username)) {
        combinedAgents.push(globalAgent);
      }
    });
    
    // Check if any agents are online
    const onlineAgentsList = combinedAgents.filter(agent => agent.online);
    
    if (onlineAgentsList.length === 0) {
      return res.json({ 
        success: false, 
        reason: 'No agents are currently online. Please ensure at least one agent is logged in to their dashboard.' 
      });
    }
    
    // Simulate a test call being routed to a random online agent
    const randomAgent = onlineAgentsList[Math.floor(Math.random() * onlineAgentsList.length)];
    const sessionId = `test-call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the call object for active calls system
    const callObject = {
      id: sessionId,
      sessionId: sessionId,
      companyUuid: companyUuid,
      assignedAgent: randomAgent.username,
      status: 'waiting', // This will make it appear in active calls
      type: 'test',
      startedAt: new Date().toISOString(),
      visitorInfo: {
        name: 'Test Caller',
        email: 'test@example.com',
        phone: 'Test Phone',
        pageUrl: 'Test Widget',
        userAgent: 'Test Widget'
      },
      notes: 'Test call from widget',
      tags: ['test', 'widget']
    };
    
    // Add to global.tempStorage.calls for active calls system
    if (!(global as any).tempStorage.calls) {
      (global as any).tempStorage.calls = [];
    }
    (global as any).tempStorage.calls.push(callObject);
    
    // Log the test call in the call logs
    if (!calls[companyUuid]) calls[companyUuid] = [];
    calls[companyUuid].unshift({
      time: new Date().toISOString(),
      agent: randomAgent.username,
      notes: 'Test call from widget',
      disposition: 'test',
      duration: '0:00',
      sessionId,
      tags: ['test', 'widget'],
    });
    
    console.log(`[Widget] Test call created: ${sessionId} assigned to agent ${randomAgent.username}`);
    
    res.json({ 
      success: true, 
      message: `Test call sent to agent ${randomAgent.username}`,
      sessionId,
      agent: randomAgent.username,
      callId: sessionId
    });
    
  } catch (error) {
    console.error('Error processing test call:', error);
    res.status(500).json({ error: 'Failed to process test call' });
  }
});

// POST /api/agent/register - Public agent registration requiring Super Admin approval
router.post('/agent/register', async (req: Request, res: Response) => {
  const { username, password, email, companyUuid } = req.body;
  
  // Validate all required fields
  if (![username, password, email, companyUuid].every((v: string) => validateString(v))) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate password strength
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
  }
  
  // Check if company exists and is approved
  const company = global.tempStorage.companies.find(c => c.uuid === companyUuid);
  if (!company) {
    return res.status(400).json({ error: 'Company not found' });
  }
  
  if (company.status !== 'approved') {
    return res.status(400).json({ error: 'Company is not approved yet' });
  }
  
  // Check if agent already exists
  const existingAgent = global.tempStorage.agents.find((a: any) => 
    a.username === username && a.companyUuid === companyUuid
  );
  if (existingAgent) {
    return res.status(400).json({ error: 'Agent with this username already exists for this company' });
  }
  
  // Generate UUID
  const uuid = uuidv4();
  
  // Store agent with pending status in tempStorage
  global.tempStorage.agents.push({
    uuid,
    companyUuid,
    username,
    email,
    status: 'offline',
    registrationStatus: 'pending', // Set status to pending for Super Admin approval
    createdAt: new Date().toISOString()
  });
  
  // Store agent credentials for later use (when approved)
  global.tempStorage.pendingAgentCredentials = global.tempStorage.pendingAgentCredentials || [];
  global.tempStorage.pendingAgentCredentials.push({
    uuid,
    username,
    password, // This should be hashed in production
    email,
    companyUuid,
    createdAt: new Date().toISOString()
  });
  
  res.json({ 
    message: 'Agent registration submitted successfully! Your account will be reviewed by our team and you will be notified once approved.',
    uuid,
    email,
    requiresApproval: true
  });
});

// Add debug logging for form push
router.post('/form-push', (req: Request, res: Response) => {
  const { companyId, sessionId, from, type, fields } = req.body;
  console.log('[form-push] Request:', req.body);
  // ... existing form creation logic ...
  // Emit to widget socket
  const io = req.app.get('io');
  const onlineWidgets = (global as any).onlineWidgets || {};
  let widgetSocketId;
  if (onlineWidgets[companyId] && onlineWidgets[companyId][sessionId]) {
    widgetSocketId = onlineWidgets[companyId][sessionId].socketId;
  }
  console.log('[form-push] Widget socketId lookup:', { companyId, sessionId, widgetSocketId });
  if (io && widgetSocketId) {
    io.to(widgetSocketId).emit('form-push', { sessionId, type, fields });
    console.log('[form-push] Emitted form-push to widget:', widgetSocketId);
  } else {
    console.log('[form-push] No socketId found for widget:', companyId, sessionId);
  }
  res.json({ success: true });
});

export default router; 