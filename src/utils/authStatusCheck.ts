import { supabase } from "@/integrations/supabase/client";

export async function checkUserStatus(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking user status:', error);
      return { status: 'error', message: 'Could not verify user status' };
    }

    return { status: profile?.status || 'active' };
  } catch (error) {
    console.error('Error in status check:', error);
    return { status: 'error', message: 'Status check failed' };
  }
}

export async function shouldSignOutUser(userId: string) {
  const result = await checkUserStatus(userId);
  
  if (result.status === 'error') {
    return { shouldSignOut: true, reason: result.message };
  }
  
  if (result.status === 'pending') {
    return { 
      shouldSignOut: true, 
      reason: 'Account pending approval' 
    };
  }
  
  if (result.status === 'blocked') {
    return { 
      shouldSignOut: true, 
      reason: 'Account blocked' 
    };
  }
  
  return { shouldSignOut: false };
}