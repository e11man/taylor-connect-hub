import { supabase } from '@/integrations/supabase/client';

export interface DormUpdateData {
  dorm: string;
  wing: string;
}

export interface DormUpdateResponse {
  data?: any;
  error?: {
    message: string;
  };
}

/**
 * Update user's dorm information in the profiles table
 * @param userId - The user's profile ID (not user_id field)
 * @param dormData - Object containing dorm and wing information
 * @returns Promise<DormUpdateResponse> - Update result
 */
export const updateUserDorm = async (
  userId: string, 
  dormData: DormUpdateData
): Promise<DormUpdateResponse> => {
  try {
    console.log('Updating dorm for user ID:', userId, 'with data:', dormData);
    
    // Update the profiles table using the profile ID (not user_id field)
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        dorm: dormData.dorm, 
        wing: dormData.wing 
      })
      .eq('id', userId) // Use 'id' field, not 'user_id'
      .select('id, email, dorm, wing')
      .single();

    if (error) {
      console.error('Error updating dorm:', error);
      return { error: { message: error.message } };
    }

    console.log('Successfully updated dorm:', data);
    return { data, error: undefined };
  } catch (error: any) {
    console.error('Error in updateUserDorm:', error);
    return { 
      data: undefined, 
      error: { message: error.message || 'Failed to update dorm information' } 
    };
  }
};

/**
 * Validate dorm and wing data
 * @param dorm - Dorm name
 * @param wing - Wing name
 * @returns boolean - Whether the data is valid
 */
export const validateDormData = (dorm: string, wing: string): boolean => {
  return dorm.trim().length > 0 && wing.trim().length > 0;
};