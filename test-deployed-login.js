const https = require('https');

const postData = JSON.stringify({
  companyUuid: 'calldocker-company-uuid',
  username: 'calldocker_agent',
  password: 'CallDocker2024!'
});

const options = {
  hostname: 'callcenterdock.onrender.com',
  port: 443,
  path: '/api/widget/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing deployed login endpoint...');
console.log(`📡 URL: https://${options.hostname}${options.path}`);
console.log(`🔑 Credentials: calldocker_agent / CallDocker2024!`);

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
        console.log('🎉 LOGIN SUCCESSFUL!');
        console.log(`👤 Agent: ${parsed.agent.fullName}`);
        console.log(`🏢 Company: ${parsed.agent.companyUuid}`);
        console.log(`🔑 Token: ${parsed.token.substring(0, 20)}...`);
      } else {
        console.log('❌ LOGIN FAILED');
      }
    } catch (e) {
      console.log('❌ Could not parse JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.write(postData);
req.end(); 