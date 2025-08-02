const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/widget/call/logs/calldocker-company-uuid',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing call logs endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end(); 