import { Router, Request, Response } from 'express';
const router = Router();

// --- Create CallDocker Agent ---
router.post('/calldocker-agent/create', (req: Request, res: Response) => {
  const { username, fullName, email, phone, role, skills } = req.body;
  if (!username || !fullName || !email || !phone || !role) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const exists = global.tempStorage.agents.find(
    (a: any) => a.username === username && a.companyUuid === 'calldocker-company-uuid'
  );
  if (exists) return res.status(400).json({ error: 'Username already exists' });

  const agent = {
    uuid: `cd-${Date.now()}`,
    username,
    fullName,
    email,
    phone,
    role,
    skills: skills || ['enquiry_handling'],
    status: 'online',
    registrationStatus: 'approved',
    companyUuid: 'calldocker-company-uuid',
    createdAt: new Date().toISOString(),
  };
  global.tempStorage.agents.push(agent);
  res.json({ success: true, agent });
});

// --- List CallDocker Agents ---
router.get('/calldocker-agents', (req: Request, res: Response) => {
  const agents = global.tempStorage.agents.filter(
    (a: any) => a.companyUuid === 'calldocker-company-uuid'
  );
  res.json({ success: true, agents });
});

// --- Create Tenant Agent ---
router.post('/company-agent/create', (req: Request, res: Response) => {
  const { username, fullName, email, phone, role, skills, companyUuid } = req.body;
  if (!username || !fullName || !email || !phone || !role || !companyUuid) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const exists = global.tempStorage.agents.find(
    (a: any) => a.username === username && a.companyUuid === companyUuid
  );
  if (exists) return res.status(400).json({ error: 'Username already exists' });

  const agent = {
    uuid: `tenant-${Date.now()}`,
    username,
    fullName,
    email,
    phone,
    role,
    skills: skills || ['enquiry_handling'],
    status: 'online',
    registrationStatus: 'approved',
    companyUuid,
    createdAt: new Date().toISOString(),
  };
  global.tempStorage.agents.push(agent);
  res.json({ success: true, agent });
});

// --- List Tenant Agents ---
router.get('/company-agents', (req: Request, res: Response) => {
  const { companyUuid } = req.query;
  let agents = global.tempStorage.agents.filter(
    (a: any) => a.companyUuid !== 'calldocker-company-uuid'
  );
  if (companyUuid) {
    agents = agents.filter((a: any) => a.companyUuid === companyUuid);
  }
  res.json({ success: true, agents });
});

export default router; 