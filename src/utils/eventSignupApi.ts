/**
 * Event Signup API utilities
 * Uses backend API routes with service role key to bypass RLS issues
 */

interface EventSignupResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001' 
  : window.location.origin;

/**
 * Sign up a user for an event
 */
export async function signUpForEvent(
  userId: string, 
  eventId: string, 
  signedUpBy?: string
): Promise<EventSignupResponse> {
  try {
    try {
      // Try API route first (with service role key)
      const response = await fetch(`${API_BASE_URL}/api/event-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          event_id: eventId,
          signed_up_by: signedUpBy
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data;
        } else {
          throw new Error(data.error || 'API signup failed');
        }
      } else {
        // API server not available, try fallback
        throw new Error('API server not available');
      }
    } catch (apiError) {
      console.log('API signup failed, trying direct Supabase call:', apiError);
      
      // Import supabase here to avoid circular dependencies
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      // Fallback to direct Supabase call if API is not available
      const { data, error } = await supabase
        .from('user_events')
        .insert([{ 
          user_id: userId, 
          event_id: eventId,
          signed_up_by: signedUpBy || userId
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data
      };
    }
  } catch (error) {
    console.error('Error signing up for event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}

/**
 * Get all events a user is signed up for
 */
export async function getUserEvents(userId: string): Promise<EventSignupResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user-events/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user events');
    }

    return data;
  } catch (error) {
    console.error('Error fetching user events:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}

/**
 * Cancel a user's event signup
 */
export async function cancelEventSignup(
  userId: string, 
  eventId: string
): Promise<EventSignupResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/event-signup?user_id=${userId}&event_id=${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel event signup');
    }

    return data;
  } catch (error) {
    console.error('Error canceling event signup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}

/**
 * Batch sign up multiple users (for PA group signups)
 */
export async function batchSignUpForEvent(
  signups: Array<{ userId: string; eventId: string; signedUpBy: string }>
): Promise<EventSignupResponse> {
  try {
    const promises = signups.map(signup => 
      signUpForEvent(signup.userId, signup.eventId, signup.signedUpBy)
    );

    const results = await Promise.all(promises);
    const errors = results.filter(r => !r.success);

    if (errors.length > 0) {
      return {
        success: false,
        error: `Failed to sign up ${errors.length} users`,
        data: { errors, successful: results.filter(r => r.success) }
      };
    }

    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Error in batch signup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}