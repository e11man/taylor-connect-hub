import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = 3001;

// Supabase client for content management
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Content management API routes
app.get('/api/content', async (req, res) => {
  try {
    const { data: content, error } = await supabase
      .from('content')
      .select('*')
      .order('page')
      .order('section')
      .order('key');

    if (error) throw error;
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/content', async (req, res) => {
  try {
    const { page, section, key, value, language_code = 'en' } = req.body;
    
    if (!page || !section || !key || !value) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data: newContent, error } = await supabase
      .from('content')
      .insert({ page, section, key, value, language_code })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: newContent });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/content', async (req, res) => {
  try {
    const { id, value: updateValue } = req.body;
    
    if (!id || !updateValue) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data: updatedContent, error } = await supabase
      .from('content')
      .update({ value: updateValue })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data: updatedContent });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/content', async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing content ID' });
    }

    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ success: false, error: error.message });
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