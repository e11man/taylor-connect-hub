import { supabase } from "@/integrations/supabase/client";

interface SignupData {
  userId: string;
  email: string;
  eventId: string;
  eventName: string;
  signedUpBy: string;
  signedUpByEmail: string;
}

export const handleGroupSignup = async ({
  selectedUsers,
  eventId,
  eventName,
  currentUser,
  onSuccess,
  onError
}: {
  selectedUsers: Array<{ userId: string; email: string }>;
  eventId: string;
  eventName: string;
  currentUser: { id: string; email: string };
  onSuccess: () => void;
  onError: (error: Error) => void;
}) => {
  try {
    // Prepare signup data for Supabase
    const signupInserts = selectedUsers.map(user => ({
      user_id: user.userId,
      event_id: eventId,
      signed_up_by: currentUser.id
    }));

    // Batch insert all signups
    const { data: signupData, error: insertError } = await supabase
      .from('event_signups')
      .insert(signupInserts)
      .select();

    if (insertError) {
      throw new Error(`Failed to sign up users: ${insertError.message}`);
    }

    // Prepare email notification data
    const emailData = {
      signups: selectedUsers.map(user => ({
        email: user.email,
        userId: user.userId,
        eventId,
        eventName,
        signedUpBy: currentUser.email
      })),
      eventDetails: {
        id: eventId,
        name: eventName,
      }
    };

    // Send email notifications
    const response = await fetch('/api/notify-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Email notification failed:', errorData);
      // Don't throw here - signups were successful even if emails failed
    }

    onSuccess();
  } catch (error) {
    console.error('Group signup error:', error);
    onError(error as Error);
  }
};