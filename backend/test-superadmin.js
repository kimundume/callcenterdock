const http = require('http');

function loginSuperAdmin() {
  const postData = JSON.stringify({
    username: 'superadmin',
    password: 'password'
  });

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/super-admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Login Status:', res.statusCode);
      const response = JSON.parse(data);
      console.log('Token:', response.token);
      
      // Now test the calls endpoint with the token
      testCallsEndpoint(response.token);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.write(postData);
  req.end();
}

function testCallsEndpoint(token) {
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/super-admin/calls/active',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\nCalls Status:', res.statusCode);
      console.log('Calls Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.end();
}

loginSuperAdmin(); 