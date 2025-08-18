const fetch = require('node-fetch');

async function testLandingPageCall() {
  const backendUrl = 'https://callcenterdock.onrender.com';
  
  console.log('🧪 Testing Landing Page Call System...\n');
  
  // Test 1: Check availability
  console.log('1️⃣ Testing availability endpoint...');
  try {
    const availabilityRes = await fetch(`${backendUrl}/api/widget/availability`);
    const availabilityData = await availabilityRes.json();
    console.log('✅ Availability response:', availabilityData);
  } catch (error) {
    console.log('❌ Availability test failed:', error.message);
  }
  
  // Test 2: Test route-call with calldocker-company-uuid
  console.log('\n2️⃣ Testing route-call endpoint...');
  try {
    const routeCallRes = await fetch(`${backendUrl}/api/widget/route-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyUuid: 'calldocker-company-uuid',
        visitorId: 'test-visitor-' + Date.now(),
        pageUrl: 'https://calldocker.netlify.app/',
        callType: 'chat'
      })
    });
    const routeCallData = await routeCallRes.json();
    console.log('✅ Route call response:', routeCallData);
  } catch (error) {
    console.log('❌ Route call test failed:', error.message);
  }
  
  // Test 3: Test agents endpoint for calldocker-company-uuid
  console.log('\n3️⃣ Testing agents endpoint...');
  try {
    const agentsRes = await fetch(`${backendUrl}/api/widget/agents/calldocker-company-uuid`);
    const agentsData = await agentsRes.json();
    console.log('✅ Agents response:', agentsData);
  } catch (error) {
    console.log('❌ Agents test failed:', error.message);
  }
  
  console.log('\n🎯 Test completed!');
}

testLandingPageCall();
