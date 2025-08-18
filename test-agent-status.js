const fetch = require('node-fetch');

const BACKEND_URL = 'https://callcenterdock.onrender.com';

async function testAgentStatus() {
    console.log('🔍 Testing Agent Status...');
    
    try {
        // Test 1: Get agent status
        const statusResponse = await fetch(`${BACKEND_URL}/api/widget/agent/status?username=calldocker_agent`);
        const statusData = await statusResponse.json();
        
        console.log('📊 Agent Status Response:', JSON.stringify(statusData, null, 2));
        
        if (statusData.success) {
            console.log('✅ Agent status retrieved successfully');
            console.log('   - Status:', statusData.agent.status);
            console.log('   - Availability:', statusData.agent.availability);
            console.log('   - Current Calls:', statusData.agent.currentCalls);
            console.log('   - Max Calls:', statusData.agent.maxCalls);
        } else {
            console.log('❌ Failed to get agent status');
        }
        
        // Test 2: Test call routing
        console.log('\n🔍 Testing Call Routing...');
        const routingResponse = await fetch(`${BACKEND_URL}/api/widget/route-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                companyUuid: 'calldocker-company-uuid',
                visitorId: 'test-visitor-' + Date.now(),
                pageUrl: 'https://test.com',
                callType: 'call'
            })
        });
        
        const routingData = await routingResponse.json();
        console.log('📊 Call Routing Response:', JSON.stringify(routingData, null, 2));
        
        if (routingData.success) {
            console.log('✅ Call routing successful');
            console.log('   - Session ID:', routingData.sessionId);
            console.log('   - Status:', routingData.status);
        } else {
            console.log('❌ Call routing failed:', routingData.error);
        }
        
        // Test 3: Check queue
        console.log('\n🔍 Testing Queue...');
        const queueResponse = await fetch(`${BACKEND_URL}/api/widget/queue/calldocker-company-uuid`);
        const queueData = await queueResponse.json();
        
        console.log('📊 Queue Response:', JSON.stringify(queueData, null, 2));
        
        if (queueData.success) {
            console.log('✅ Queue check successful');
            console.log('   - Queue Length:', queueData.queueLength);
        } else {
            console.log('❌ Queue check failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAgentStatus();
