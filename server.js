import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email sending endpoint using Python script
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Sending verification code to:', email);

    // Call the Python script
    const pythonScriptPath = path.join(process.cwd(), 'email-service', 'send_verification_email.py');
    
    return new Promise((resolve, reject) => {
      // If code is provided, pass it to the Python script, otherwise let it generate one
      const args = code ? [pythonScriptPath, email, code] : [pythonScriptPath, email];
      
      // Set up environment to use the virtual environment
      const env = { ...process.env };
      const venvPath = path.join(process.cwd(), 'email-service', 'venv');
      env.PYTHONPATH = path.join(venvPath, 'lib', 'python3.13', 'site-packages');
      env.VIRTUAL_ENV = venvPath;
      env.PATH = path.join(venvPath, 'bin') + ':' + env.PATH;
      
      // Use the virtual environment's Python directly
      const venvPythonPath = path.join(venvPath, 'bin', 'python');
      const pythonProcess = spawn(venvPythonPath, args, { env });
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Extract the verification code from the output
          const codeMatch = output.match(/CODE:(\d{6})/);
          const sentCode = codeMatch ? codeMatch[1] : code;
          
          console.log('Email sent successfully via Python script');
          res.json({ 
            success: true, 
            message: 'Verification code sent successfully',
            code: sentCode
          });
          resolve();
        } else {
          console.error('Python script error:', errorOutput);
          res.status(500).json({ 
            error: 'Failed to send verification email',
            details: errorOutput
          });
          reject();
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        res.status(500).json({ 
          error: 'Failed to start email service',
          details: error.message
        });
        reject();
      });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email server is running' });
});

app.listen(port, () => {
  console.log(`Email server running on http://localhost:${port}`);
  console.log('Resend API key available:', !!process.env.RESEND_API_KEY);
}); 