// Test script to verify call routing fixes
const https = require('https');
const http = require('http');

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
        } catch (e) {
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

const BACKEND_URL = 'https://callcenterdock.onrender.com';

async function testCallRouting() {
  console.log('🧪 Testing Call Routing Fixes...\n');

  // Test 1: Health check
  console.log('1. Testing health check...');
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Route call without company UUID (should use fallback)
  console.log('\n2. Testing route call without company UUID...');
  try {
    const routeResponse = await fetch(`${BACKEND_URL}/api/widget/route-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: 'test_visitor_123',
        pageUrl: 'https://calldocker.netlify.app',
        callType: 'call'
      })
    });
    const routeData = await routeResponse.json();
    console.log('✅ Route call response:', routeData);
  } catch (error) {
    console.log('❌ Route call failed:', error.message);
  }

  // Test 3: Route call with CallDocker company UUID
  console.log('\n3. Testing route call with CallDocker company UUID...');
  try {
    const routeResponse2 = await fetch(`${BACKEND_URL}/api/widget/route-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyUuid: 'calldocker-company-uuid',
        visitorId: 'test_visitor_456',
        pageUrl: 'https://calldocker.netlify.app',
        callType: 'call'
      })
    });
    const routeData2 = await routeResponse2.json();
    console.log('✅ Route call with UUID response:', routeData2);
  } catch (error) {
    console.log('❌ Route call with UUID failed:', error.message);
  }

  // Test 4: Get online agents
  console.log('\n4. Testing get online agents...');
  try {
    const agentsResponse = await fetch(`${BACKEND_URL}/api/widget/agents/online?companyUuid=calldocker-company-uuid`);
    const agentsData = await agentsResponse.json();
    console.log('✅ Online agents:', agentsData);
  } catch (error) {
    console.log('❌ Get agents failed:', error.message);
  }

  console.log('\n🎉 Test completed!');
}

testCallRouting().catch(console.error);
