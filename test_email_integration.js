// Test script to verify email service integration
const fetch = require('node-fetch');

async function testEmailService() {
  console.log('Testing email service integration...');
  
  try {
    // Test the email service endpoint
    const response = await fetch('http://localhost:3001/api/send-verification-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        code: '123456'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Email service test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Email service test failed!');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Email service test failed with error:', error.message);
    console.log('Make sure the email server is running with: npm run email-server');
  }
}

// Test health endpoint
async function testHealthEndpoint() {
  console.log('\nTesting health endpoint...');
  
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Health endpoint working!');
      console.log('Status:', result);
    } else {
      console.log('❌ Health endpoint failed!');
    }
  } catch (error) {
    console.log('❌ Health endpoint failed with error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testHealthEndpoint();
  await testEmailService();
}

runTests(); 