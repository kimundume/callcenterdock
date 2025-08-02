const http = require('http');

const postData = JSON.stringify({
  companyUuid: 'calldocker-company-uuid',
  username: 'calldocker_agent',
  password: 'CallDocker2024!'
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/widget/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('PARSED RESPONSE:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end(); 