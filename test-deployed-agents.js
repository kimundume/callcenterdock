const https = require('https');

const options = {
  hostname: 'callcenterdock.onrender.com',
  port: 443,
  path: '/api/widget/agents/calldocker-company-uuid',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🧪 Testing deployed agents endpoint...');
console.log(`📡 URL: https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log(`📊 STATUS: ${res.statusCode}`);
  console.log(`📋 HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 RESPONSE:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('✅ PARSED RESPONSE:', JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        console.log('🎉 AGENTS ENDPOINT SUCCESSFUL!');
        console.log(`👥 Found ${parsed.agents.length} agents`);
        parsed.agents.forEach((agent, index) => {
          console.log(`  ${index + 1}. ${agent.fullName} (${agent.username}) - ${agent.status}`);
        });
      } else {
        console.log('❌ AGENTS ENDPOINT FAILED');
      }
    } catch (e) {
      console.log('❌ Could not parse JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.end(); 