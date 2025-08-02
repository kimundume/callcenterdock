const https = require('https');

const postData = JSON.stringify({
  companyUuid: 'calldocker-company-uuid',
  visitorId: 'test-123',
  pageUrl: 'https://calldocker.netlify.app/',
  callType: 'chat'
});

const options = {
  hostname: 'callcenterdock.onrender.com',
  port: 443,
  path: '/api/widget/route-call',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing deployed route-call endpoint...');
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
        console.log('🎉 ROUTE-CALL SUCCESSFUL!');
        console.log(`👤 Agent: ${parsed.agent}`);
        console.log(`🆔 Session ID: ${parsed.sessionId}`);
        console.log(`💬 Call Type: ${parsed.callType}`);
      } else {
        console.log('❌ ROUTE-CALL FAILED');
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