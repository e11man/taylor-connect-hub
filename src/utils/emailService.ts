import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const sendVerificationCode = async (email: string, code?: string): Promise<{ success: boolean; code?: string }> => {
  try {
    console.log(`Sending verification code to: ${email}`);
    
    // Call the new Python script with the email address using the virtual environment
    const { stdout, stderr } = await execAsync(`cd email-service && source venv/bin/activate && python3 send_verification_email.py "${email}"`);
    
    if (stderr) {
      console.error('Python script stderr:', stderr);
    }
    
    console.log('Python script output:', stdout);
    
    // Extract the verification code from the output
    const codeMatch = stdout.match(/CODE:(\d{6})/);
    const generatedCode = codeMatch ? codeMatch[1] : null;
    
    if (generatedCode) {
      console.log('Email sent successfully with code:', generatedCode);
      return { success: true, code: generatedCode };
    } else {
      console.error('Failed to extract verification code from output');
      return { success: false };
    }
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return { success: false };
  }
}; 