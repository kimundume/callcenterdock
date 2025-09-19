import express from 'express';
const router = express.Router();

// Simple availability endpoint
router.get('/availability', (req, res) => {
  try {
    const { companyUuid } = req.query;
    console.log('[DEBUG] Getting availability for company:', companyUuid);
    
    res.json({
      success: true,
      online: true,
      available: true,
      agentsOnline: 1,
      availableAgents: 1,
      estimatedWaitTime: 0,
      message: 'Agents are available',
      routingType: 'direct'
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
