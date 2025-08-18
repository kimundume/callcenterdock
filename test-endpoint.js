// Test script to check POST agent/status endpoint
const https = require('https');

const BACKEND_URL = 'https://callcenterdock.onrender.com';

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoint() {
  console.log('🧪 Testing POST /api/widget/agent/status endpoint...\n');

  try {
    const response = await makeRequest(
      `${BACKEND_URL}/api/widget/agent/status`,
      'POST',
      {
        agentUuid: 'calldocker-main-agent',
        status: 'online',
        availability: 'online'
      }
    );

    console.log('Status Code:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('✅ Endpoint is working!');
    } else {
      console.log('❌ Endpoint returned error status');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testEndpoint();
