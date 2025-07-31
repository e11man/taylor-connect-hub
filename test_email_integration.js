const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testEmailIntegration() {
  try {
    console.log('Testing email integration...');
    
    // Test the email service
    const { stdout, stderr } = await execAsync('cd email-service && source venv/bin/activate && python3 send_verification_email.py "test@example.com"');
    
    if (stderr) {
      console.error('Python script stderr:', stderr);
    }
    
    console.log('Python script output:', stdout);
    
    // Extract the verification code from the output
    const codeMatch = stdout.match(/CODE:(\d{6})/);
    const generatedCode = codeMatch ? codeMatch[1] : null;
    
    if (generatedCode) {
      console.log('✅ Email sent successfully with code:', generatedCode);
      console.log('✅ Code extraction working correctly');
      console.log('✅ Integration test passed!');
    } else {
      console.error('❌ Failed to extract verification code from output');
      console.error('❌ Integration test failed!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailIntegration(); 