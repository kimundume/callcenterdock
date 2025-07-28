const http = require('http');

function testRouteCall() {
  const postData = JSON.stringify({
    visitorId: 'test-123',
    pageUrl: 'http://localhost:5173/',
    callType: 'chat'
  });

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/widget/route-call',
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
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.write(postData);
  req.end();
}

testRouteCall(); 