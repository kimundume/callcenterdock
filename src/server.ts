app.get('/test', (req, res) => res.send('Test OK'));
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agents: global.tempStorage.agents.length,
    calls: global.tempStorage.calls.length,
    time: new Date().toISOString(),
  });
}); 