const https = require('https');

const options = {
  hostname: 'callcenterdock.onrender.com',
  port: 443,
  path: '/api/widget/debug/agents',
  method: 'GET'
};

console.log('🧪 Testing deployed debug agents endpoint...');
console.log(`📡 URL: https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log(`📊 STATUS: ${res.statusCode}`);
  
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
        console.log(`🎉 Found ${parsed.count} agents:`);
        parsed.agents.forEach((agent, index) => {
          console.log(`${index + 1}. ${agent.fullName} (${agent.username})`);
          console.log(`   Company: ${agent.companyUuid}`);
          console.log(`   Status: ${agent.status}`);
          console.log(`   Has Password: ${agent.hasPassword}`);
          console.log('');
        });
      } else {
        console.log('❌ Failed to get agents');
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