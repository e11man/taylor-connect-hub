// Server-side email service using Python script
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendVerificationCode = async (email: string, code?: string): Promise<{ success: boolean; code?: string }> => {
  try {
    console.log(`Sending verification code to: ${email}`);
    
    // Generate verification code if not provided
    const verificationCode = code || generateVerificationCode();
    
    // Call the server endpoint that uses the Python script
    const response = await fetch('http://localhost:3001/api/send-verification-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        code: verificationCode
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Server error:', result.error);
      return { success: false };
    }

    console.log('Email sent successfully via Python script:', result);
    return { success: true, code: result.code || verificationCode };
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return { success: false };
  }
};