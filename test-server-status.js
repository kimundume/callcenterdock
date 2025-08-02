const https = require('https');

const options = {
  hostname: 'callcenterdock.onrender.com',
  port: 443,
  path: '/test',
  method: 'GET'
};

console.log('🧪 Testing deployed server status...');
console.log(`📡 URL: https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log(`📊 STATUS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 RESPONSE:', data);
    console.log('✅ Server is responding!');
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.end(); 