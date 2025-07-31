/**
 * Send verification code via our Express server
 */
export const sendVerificationCode = async (email: string, code: string): Promise<boolean> => {
  console.log('Attempting to send verification code to:', email);
  
  try {
    const response = await fetch('http://localhost:3001/api/send-verification-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return false;
  }
}; 