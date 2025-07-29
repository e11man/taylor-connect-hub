import { supabase } from "@/integrations/supabase/client";

export interface OrganizationDebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  suggestion?: string;
}

/**
 * Debug utility to trace organization login issues
 * Checks auth state, organization record, and RLS response
 */
export async function debugOrganizationLookup(email: string): Promise<OrganizationDebugResult[]> {
  const results: OrganizationDebugResult[] = [];

  // Step 1: Check if user exists in auth
  try {
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    results.push({
      step: "Auth Check",
      success: !authError && !!authUser.user,
      data: authUser.user ? { 
        id: authUser.user.id, 
        email: authUser.user.email,
        confirmed_at: authUser.user.email_confirmed_at
      } : null,
      error: authError?.message,
      suggestion: authError ? "User needs to log in first" : "Auth user found"
    });

    if (authError || !authUser.user) {
      return results;
    }

    // Step 2: Check organization record exists
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', authUser.user.id)
      .single();

    results.push({
      step: "Organization Lookup",
      success: !orgError && !!orgData,
      data: orgData,
      error: orgError?.message,
      suggestion: orgError ? 
        orgError.code === 'PGRST116' ? 
          "Organization record not found - may need manual creation" :
          `RLS may be blocking access: ${orgError.message}` :
        `Organization found with status: ${orgData?.status}`
    });

    if (orgError) {
      // Step 3: Check if organization exists but RLS is blocking
      const { data: adminCheck, error: adminError } = await supabase.rpc('check_is_admin');
      
      results.push({
        step: "Admin Check",
        success: !adminError,
        data: { is_admin: adminCheck },
        error: adminError?.message,
        suggestion: adminCheck ? "User has admin access" : "User is not admin"
      });

      // Step 4: Try raw SQL query (as admin if possible)
      if (adminCheck) {
        const { data: rawOrgData, error: rawError } = await supabase
          .from('organizations')
          .select('*')
          .eq('contact_email', email.toLowerCase());

        results.push({
          step: "Raw Email Lookup",
          success: !rawError,
          data: rawOrgData,
          error: rawError?.message,
          suggestion: rawOrgData?.length ? 
            "Organization exists but user_id mismatch" : 
            "No organization found with this email"
        });
      }
    }

    // Step 5: Check user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authUser.user.id);

    results.push({
      step: "User Roles Check",
      success: !rolesError,
      data: userRoles,
      error: rolesError?.message,
      suggestion: userRoles?.length ? 
        `User has roles: ${userRoles.map(r => r.role).join(', ')}` : 
        "No roles found for user"
    });

  } catch (error: any) {
    results.push({
      step: "Debug Process",
      success: false,
      error: error.message,
      suggestion: "Unexpected error during debug process"
    });
  }

  return results;
}

/**
 * Log debug results to console for developer inspection
 */
export function logDebugResults(results: OrganizationDebugResult[], email: string) {
  console.group(`🔍 Organization Login Debug for: ${email}`);
  
  results.forEach((result, index) => {
    const icon = result.success ? "✅" : "❌";
    console.group(`${icon} Step ${index + 1}: ${result.step}`);
    
    if (result.data) {
      console.log("Data:", result.data);
    }
    
    if (result.error) {
      console.error("Error:", result.error);
    }
    
    if (result.suggestion) {
      console.info("Suggestion:", result.suggestion);
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
}