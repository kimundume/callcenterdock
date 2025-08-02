const https = require('https');

const options = {
  hostname: 'callcenterdock.onrender.com',
  port: 443,
  path: '/api/widget/test-callDocker-agent',
  method: 'GET'
};

console.log('🧪 Testing deployed CallDocker agent endpoint...');
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
        console.log('🎉 CallDocker agent found!');
        console.log(`👤 Agent: ${parsed.agent.fullName}`);
        console.log(`🏢 Company: ${parsed.agent.companyUuid}`);
        console.log(`📊 Status: ${parsed.agent.status}`);
      } else {
        console.log('❌ CallDocker agent not found');
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