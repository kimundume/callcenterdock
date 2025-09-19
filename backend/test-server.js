const express = require('express');
const app = express();

// Test basic route
app.get('/test', (req, res) => {
  res.json({ message: 'Test OK' });
});

// Test availability endpoint
app.get('/api/widget/availability', (req, res) => {
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
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
