// Test script to verify call routing functionality
const https = require('https');

const BACKEND_URL = 'https://callcenterdock.onrender.com';

// Simple fetch implementation for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(jsonData)
          });
        } catch (error) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: () => Promise.resolve(data)
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testCallRouting() {
  console.log('🧪 Testing Call Routing Functionality...\n');

  // Test 1: Health check
  console.log('1. Testing health check...');
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Route call to CallDocker agent
  console.log('\n2. Testing call routing to CallDocker agent...');
  try {
    const routeResponse = await fetch(`${BACKEND_URL}/api/widget/route-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyUuid: 'calldocker-company-uuid',
        visitorId: 'test-visitor-123',
        pageUrl: 'https://calldocker.netlify.app/',
        callType: 'call'
      })
    });
    
    const routeData = await routeResponse.json();
    console.log('✅ Route call response:', routeData);
    
    if (routeData.success) {
      console.log('🎉 Call successfully routed to agent:', routeData.agent);
    } else {
      console.log('❌ Call routing failed:', routeData.error);
    }
  } catch (error) {
    console.log('❌ Route call failed:', error.message);
  }

  // Test 3: Check agent status
  console.log('\n3. Testing agent status...');
  try {
    const statusResponse = await fetch(`${BACKEND_URL}/api/widget/agent/status?username=calldocker_agent`);
    const statusData = await statusResponse.json();
    console.log('✅ Agent status:', statusData);
  } catch (error) {
    console.log('❌ Agent status failed:', error.message);
  }

  // Test 4: Check active calls
  console.log('\n4. Testing active calls...');
  try {
    const callsResponse = await fetch(`${BACKEND_URL}/api/widget/calls/active?username=calldocker_agent`);
    const callsData = await callsResponse.json();
    console.log('✅ Active calls:', callsData);
  } catch (error) {
    console.log('❌ Active calls failed:', error.message);
  }

  console.log('\n🎯 Test completed!');
}

testCallRouting().catch(console.error);
