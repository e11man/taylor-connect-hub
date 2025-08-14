import { createClient } from '@supabase/supabase-js';

// Database connection
const supabaseUrl = 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emJqaWZtcnd2cWJrd2J5dmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDI1NDUsImV4cCI6MjA2ODg3ODU0NX0.vf4y-DvpEemwUJiqguqI1ot-g0LrlpQZbhW0tIEs03o';
const supabase = createClient(supabaseUrl, supabaseKey);

// Static content that needs to be migrated
const staticContent = [
  // Error Boundary
  { page: 'errors', section: 'boundary', key: 'title', value: 'Something went wrong' },
  { page: 'errors', section: 'boundary', key: 'description', value: 'We encountered an error while loading this page. This could be due to:' },
  { page: 'errors', section: 'boundary', key: 'database_permissions', value: 'The database permissions are not configured correctly' },
  { page: 'errors', section: 'boundary', key: 'missing_tables', value: 'Required tables or columns are missing' },
  { page: 'errors', section: 'boundary', key: 'admin_access', value: 'The Supabase client is trying to access admin-only features' },
  { page: 'errors', section: 'boundary', key: 'unexpected_error', value: 'An unexpected error occurred. Please try refreshing the page.' },
  { page: 'errors', section: 'boundary', key: 'error_details', value: 'Error Details (Development Only)' },
  { page: 'errors', section: 'boundary', key: 'refresh_button', value: 'Refresh Page' },
  { page: 'errors', section: 'boundary', key: 'go_home_button', value: 'Go Home' },

  // Content Test Page
  { page: 'contentTest', section: 'page', key: 'title', value: 'Content Loading Test Page' },
  { page: 'contentTest', section: 'page', key: 'individual_hooks_title', value: 'Individual Content Hooks' },
  { page: 'contentTest', section: 'page', key: 'section_hook_title', value: 'Section Content Hook' },
  { page: 'contentTest', section: 'page', key: 'dynamic_text_title', value: 'DynamicText Component' },
  { page: 'contentTest', section: 'page', key: 'direct_content_title', value: 'Direct Content Display from heroContent' },
  { page: 'contentTest', section: 'page', key: 'loading_text', value: 'Loading:' },
  { page: 'contentTest', section: 'page', key: 'yes', value: 'Yes' },
  { page: 'contentTest', section: 'page', key: 'no', value: 'No' },
  { page: 'contentTest', section: 'page', key: 'not_loaded', value: '[not loaded]' },

  // Test Database Page
  { page: 'testDatabase', section: 'page', key: 'title', value: 'Database Connection Test' },
  { page: 'testDatabase', section: 'page', key: 'env_vars_title', value: 'Environment Variables' },
  { page: 'testDatabase', section: 'page', key: 'connection_status_title', value: 'Connection Status' },
  { page: 'testDatabase', section: 'page', key: 'content_data_title', value: 'Content Data (First 5 items)' },
  { page: 'testDatabase', section: 'page', key: 'debug_info_title', value: 'Debug Information' },
  { page: 'testDatabase', section: 'page', key: 'not_set', value: 'Not set' },
  { page: 'testDatabase', section: 'page', key: 'status_label', value: 'Status:' },
  { page: 'testDatabase', section: 'page', key: 'error_label', value: 'Error:' },
  { page: 'testDatabase', section: 'page', key: 'current_url_label', value: 'Current URL:' },
  { page: 'testDatabase', section: 'page', key: 'user_agent_label', value: 'User Agent:' },
  { page: 'testDatabase', section: 'page', key: 'local_storage_label', value: 'Local Storage Available:' },

  // Admin Dashboard
  { page: 'adminDashboard', section: 'statistics', key: 'title', value: 'Site Statistics' },
  { page: 'adminDashboard', section: 'statistics', key: 'error_loading', value: 'Error loading statistics:' },
  { page: 'adminDashboard', section: 'page', key: 'no_statistics', value: 'No statistics available' },
  { page: 'adminDashboard', section: 'page', key: 'last_calculated', value: 'Last calculated:' },
  { page: 'adminDashboard', section: 'page', key: 'individual_users', value: 'Individual Users' },
  { page: 'adminDashboard', section: 'page', key: 'partner_organizations', value: 'Partner Organizations' },
  { page: 'adminDashboard', section: 'page', key: 'total_events', value: 'Total Events' },
  { page: 'adminDashboard', section: 'page', key: 'quick_actions', value: 'Quick Actions' },
  { page: 'adminDashboard', section: 'page', key: 'recent_users_title', value: 'Recent Individual Users' },
  { page: 'adminDashboard', section: 'page', key: 'recent_users_desc', value: 'Students, PAs, faculty, student leaders, and admins' },
  { page: 'adminDashboard', section: 'page', key: 'recent_orgs_title', value: 'Recent Partner Organizations' },
  { page: 'adminDashboard', section: 'page', key: 'recent_orgs_desc', value: 'Organizations that host events' },
  { page: 'adminDashboard', section: 'page', key: 'users_vs_orgs_title', value: 'Users vs Organizations' },
  { page: 'adminDashboard', section: 'page', key: 'users_vs_orgs_desc', value: 'This tab shows individual users only (students, PAs, faculty, student leaders, admins). Partner organizations are managed separately in the Organizations tab.' },
  { page: 'adminDashboard', section: 'page', key: 'organizations_vs_users_title', value: 'Organizations vs Users' },
  { page: 'adminDashboard', section: 'page', key: 'organizations_vs_users_desc', value: 'This tab shows partner organizations only (entities that host events). Individual users are managed separately in the Users tab.' },
  { page: 'adminDashboard', section: 'page', key: 'all_roles', value: 'All Roles' },
  { page: 'adminDashboard', section: 'page', key: 'students', value: 'Students' },
  { page: 'adminDashboard', section: 'page', key: 'pas', value: 'PAs' },
  { page: 'adminDashboard', section: 'page', key: 'faculty', value: 'Faculty' },
  { page: 'adminDashboard', section: 'page', key: 'student_leaders', value: 'Student Leaders' },
  { page: 'adminDashboard', section: 'page', key: 'admins', value: 'Admins' },
  { page: 'adminDashboard', section: 'page', key: 'all_leadership', value: 'All (Leadership)' },
  { page: 'adminDashboard', section: 'page', key: 'pending_leadership', value: 'Pending Leadership Only' },
  { page: 'adminDashboard', section: 'page', key: 'all_organizations', value: 'All Organizations' },
  { page: 'adminDashboard', section: 'page', key: 'pending_organizations', value: 'Pending' },

  // Content Management
  { page: 'contentManagement', section: 'page', key: 'title', value: 'Content Management' },
  { page: 'contentManagement', section: 'page', key: 'error_loading', value: 'Error loading content:' },
  { page: 'contentManagement', section: 'page', key: 'page_title', value: 'Page' },
  { page: 'contentManagement', section: 'page', key: 'key_header', value: 'Key' },
  { page: 'contentManagement', section: 'page', key: 'value_status_header', value: 'Value / Status' },
  { page: 'contentManagement', section: 'page', key: 'actions_header', value: 'Actions' },
  { page: 'contentManagement', section: 'page', key: 'edit_content_title', value: 'Edit Content' },
  { page: 'contentManagement', section: 'page', key: 'value_label', value: 'Value' },
  { page: 'contentManagement', section: 'page', key: 'delete_content_title', value: 'Delete Content' },
  { page: 'contentManagement', section: 'page', key: 'cancel_button', value: 'Cancel' },
  { page: 'contentManagement', section: 'page', key: 'no_content_found', value: 'No content found.' },

  // Search Section
  { page: 'search', section: 'filters', key: 'title', value: 'Filter Opportunities' },
  { page: 'search', section: 'filters', key: 'description', value: 'Click on a category to filter opportunities' },

  // Update Password Modal
  { page: 'modals', section: 'updatePassword', key: 'current_password_label', value: 'Current Password' },
  { page: 'modals', section: 'updatePassword', key: 'new_password_label', value: 'New Password' },
  { page: 'modals', section: 'updatePassword', key: 'confirm_password_label', value: 'Confirm New Password' },
  { page: 'modals', section: 'updatePassword', key: 'current_password_placeholder', value: 'Enter current password' },
  { page: 'modals', section: 'updatePassword', key: 'new_password_placeholder', value: 'Enter new password' },
  { page: 'modals', section: 'updatePassword', key: 'confirm_password_placeholder', value: 'Confirm new password' },
  { page: 'modals', section: 'updatePassword', key: 'password_min_requirement', value: 'Password must be at least 6 characters long' },
  { page: 'modals', section: 'updatePassword', key: 'update_button', value: 'Update Password' },
  { page: 'modals', section: 'updatePassword', key: 'cancel_button', value: 'Cancel' },

  // Organization Rejection Modal
  { page: 'modals', section: 'organizationRejection', key: 'title', value: 'Reject Organization' },
  { page: 'modals', section: 'organizationRejection', key: 'important_note', value: 'Important:' },
  { page: 'modals', section: 'organizationRejection', key: 'rejection_warning', value: 'Once rejected, the organization will be notified via email and cannot reapply with the same account.' },
  { page: 'modals', section: 'organizationRejection', key: 'reject_button', value: 'Reject Organization' },

  // Forgot Password Modal
  { page: 'modals', section: 'forgotPassword', key: 'email_display', value: 'Email' },

  // Event Chat Modal
  { page: 'modals', section: 'eventChat', key: 'no_messages_title', value: 'No messages yet' },
  { page: 'modals', section: 'eventChat', key: 'no_messages_subtitle', value: 'Start the conversation!' },
  { page: 'modals', section: 'eventChat', key: 'loading_messages', value: 'Loading messages...' },

  // Taylor User Sign Up
  { page: 'auth', section: 'signup', key: 'create_account_title', value: 'Create Account' },
  { page: 'auth', section: 'signup', key: 'leadership_role_label', value: 'Leadership role (optional)' },
  { page: 'auth', section: 'signup', key: 'none_option', value: 'None' },
  { page: 'auth', section: 'signup', key: 'pa_option', value: 'PA' },
  { page: 'auth', section: 'signup', key: 'faculty_option', value: 'Faculty' },
  { page: 'auth', section: 'signup', key: 'student_leader_option', value: 'Student Leader' },
  { page: 'auth', section: 'signup', key: 'admin_approval_note', value: 'Admin approval required. Approved leaders can sign up groups.' },
  { page: 'auth', section: 'signup', key: 'passwords_dont_match', value: 'Passwords do not match' },
  { page: 'auth', section: 'signup', key: 'residence_hall_label', value: 'Residence Hall' },
  { page: 'auth', section: 'signup', key: 'optional_text', value: '(Optional)' },
  { page: 'auth', section: 'signup', key: 'floor_wing_label', value: 'Floor/Wing' },
  { page: 'auth', section: 'signup', key: 'non_taylor_note', value: 'Note: Non-Taylor email accounts require admin approval before access is granted.' },

  // Organization Profile Modal
  { page: 'modals', section: 'organizationProfile', key: 'edit_title', value: 'Edit Organization Profile' },
  { page: 'modals', section: 'organizationProfile', key: 'name_label', value: 'Name' },
  { page: 'modals', section: 'organizationProfile', key: 'description_label', value: 'Description' },
  { page: 'modals', section: 'organizationProfile', key: 'contact_email_label', value: 'Contact Email*' },
  { page: 'modals', section: 'organizationProfile', key: 'phone_label', value: 'Phone' },
  { page: 'modals', section: 'organizationProfile', key: 'website_label', value: 'Website' },

  // Dashboard Opportunities
  { page: 'dashboard', section: 'opportunities', key: 'loading_text', value: 'Loading opportunities...' },
  { page: 'dashboard', section: 'opportunities', key: 'all_dates', value: 'All Dates' },
  { page: 'dashboard', section: 'opportunities', key: 'today', value: 'Today' },
  { page: 'dashboard', section: 'opportunities', key: 'this_week', value: 'This Week' },
  { page: 'dashboard', section: 'opportunities', key: 'this_month', value: 'This Month' },
  { page: 'dashboard', section: 'opportunities', key: 'upcoming', value: 'Upcoming' },
  { page: 'dashboard', section: 'opportunities', key: 'all_locations', value: 'All Locations' },
  { page: 'dashboard', section: 'opportunities', key: 'all_events', value: 'All Events' },
  { page: 'dashboard', section: 'opportunities', key: 'signed_up', value: 'Signed Up' },
  { page: 'dashboard', section: 'opportunities', key: 'not_signed_up', value: 'Not Signed Up' },
  { page: 'dashboard', section: 'opportunities', key: 'available_spots', value: 'Available Spots' },
  { page: 'dashboard', section: 'opportunities', key: 'show_full_events', value: 'Show full events' },
  { page: 'dashboard', section: 'opportunities', key: 'show_all_occurrences', value: 'Show all occurrences' },
  { page: 'dashboard', section: 'opportunities', key: 'search_filter', value: 'Search:' },
  { page: 'dashboard', section: 'opportunities', key: 'date_filter', value: 'Date:' },
  { page: 'dashboard', section: 'opportunities', key: 'location_filter', value: 'Location:' },
  { page: 'dashboard', section: 'opportunities', key: 'status_filter', value: 'Status:' },
  { page: 'dashboard', section: 'opportunities', key: 'no_events_found_title', value: 'No events found' },
  { page: 'dashboard', section: 'opportunities', key: 'no_events_found_subtitle', value: 'Try adjusting your filters or search terms' },
  { page: 'dashboard', section: 'opportunities', key: 'date_label', value: 'Date:' },
  { page: 'dashboard', section: 'opportunities', key: 'time_label', value: 'Time:' },
  { page: 'dashboard', section: 'opportunities', key: 'location_label', value: 'Location:' },
  { page: 'dashboard', section: 'opportunities', key: 'participants_label', value: 'Participants:' },

  // Protected Route
  { page: 'auth', section: 'protectedRoute', key: 'loading_text', value: 'Loading...' },

  // Safety Guidelines Modal
  { page: 'modals', section: 'safetyGuidelines', key: 'guideline_id', value: 'ID' },

  // Group Signup Button
  { page: 'buttons', section: 'groupSignup', key: 'processing_text', value: 'Processing...' },

  // Header
  { page: 'header', section: 'navigation', key: 'close_menu', value: 'Close menu' },
  { page: 'header', section: 'navigation', key: 'open_menu', value: 'Open menu' },

  // Carousel
  { page: 'ui', section: 'carousel', key: 'previous_slide', value: 'Previous slide' },
  { page: 'ui', section: 'carousel', key: 'next_slide', value: 'Next slide' },

  // 404 Page (public/404.html)
  { page: 'errors', section: '404', key: 'redirecting_title', value: 'Redirecting...' },
  { page: 'errors', section: '404', key: 'redirecting_text', value: 'If you are not redirected automatically, click here.' },

  // Loading states
  { page: 'ui', section: 'loading', key: 'loading_community', value: 'Loading Community Connect...' },
  { page: 'ui', section: 'loading', key: 'loading_dots', value: 'Loading...' },

  // Form validation messages
  { page: 'forms', section: 'validation', key: 'required_field', value: 'This field is required' },
  { page: 'forms', section: 'validation', key: 'invalid_email', value: 'Please enter a valid email address' },
  { page: 'forms', section: 'validation', key: 'password_too_short', value: 'Password must be at least 6 characters long' },
  { page: 'forms', section: 'validation', key: 'passwords_dont_match', value: 'Passwords do not match' },

  // Success/Error messages
  { page: 'messages', section: 'success', key: 'password_updated', value: 'Password Updated!' },
  { page: 'messages', section: 'success', key: 'password_update_description', value: 'Your password has been successfully updated. You will be redirected to the login page shortly.' },
  { page: 'messages', section: 'success', key: 'go_home', value: 'Go to Home' },
  { page: 'messages', section: 'error', key: 'fill_all_fields', value: 'Please fill in all fields' },
  { page: 'messages', section: 'error', value: 'New passwords do not match' },
  { page: 'messages', section: 'error', key: 'could_not_verify_user', value: 'Could not verify current user' },
  { page: 'messages', section: 'error', key: 'new_password_different', value: 'New password must be different from current password' },
  { page: 'messages', section: 'error', key: 'current_password_incorrect', value: 'Current password is incorrect' },
  { page: 'messages', section: 'error', key: 'failed_update_password', value: 'Failed to update password' },
  { page: 'messages', section: 'error', key: 'unexpected_error', value: 'An unexpected error occurred. Please try again.' }
];

async function migrateStaticContent() {
  console.log('Starting migration of static content...');
  
  let successCount = 0;
  let errorCount = 0;

  for (const content of staticContent) {
    try {
      const { data, error } = await supabase
        .from('content')
        .upsert({
          page: content.page,
          section: content.section,
          key: content.key,
          value: content.value,
          language_code: 'en'
        }, {
          onConflict: 'page,section,key,language_code'
        });

      if (error) {
        console.error(`Error inserting ${content.page}.${content.section}.${content.key}:`, error);
        errorCount++;
      } else {
        console.log(`✓ Migrated: ${content.page}.${content.section}.${content.key}`);
        successCount++;
      }
    } catch (err) {
      console.error(`Exception inserting ${content.page}.${content.section}.${content.key}:`, err);
      errorCount++;
    }
  }

  console.log(`\nMigration completed!`);
  console.log(`Successfully migrated: ${successCount} items`);
  console.log(`Errors: ${errorCount} items`);
}

// Run the migration
migrateStaticContent().catch(console.error);

// Additional static content that needs to be migrated
const additionalStaticContent = [
  // Fix the missing key issue
  { page: 'messages', section: 'error', key: 'new_passwords_dont_match', value: 'New passwords do not match' },

  // More static content found in components
  { page: 'ui', section: 'form', key: 'field_path_type', value: 'TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>' },
  { page: 'ui', section: 'form', key: 'field_values_type', value: 'TFieldValues extends FieldValues = FieldValues' },

  // More modal content
  { page: 'modals', section: 'changeDorm', key: 'title', value: 'Change Dorm' },
  { page: 'modals', section: 'changeDorm', key: 'description', value: 'Select your new dorm and floor/wing' },
  { page: 'modals', section: 'changeDorm', key: 'dorm_label', value: 'Dorm' },
  { page: 'modals', section: 'changeDorm', key: 'floor_label', value: 'Floor/Wing' },
  { page: 'modals', section: 'changeDorm', key: 'save_button', value: 'Save Changes' },
  { page: 'modals', section: 'changeDorm', key: 'cancel_button', value: 'Cancel' },

  // More auth content
  { page: 'auth', section: 'login', key: 'welcome_back', value: 'Welcome Back' },
  { page: 'auth', section: 'login', key: 'sign_in_subtitle', value: 'Sign in to your Taylor Connect Hub account.' },
  { page: 'auth', section: 'login', key: 'email_label', value: 'Email' },
  { page: 'auth', section: 'login', key: 'password_label', value: 'Password' },
  { page: 'auth', section: 'login', key: 'forgot_password_link', value: 'Forgot your password?' },
  { page: 'auth', section: 'login', key: 'sign_in_button', value: 'Sign In' },
  { page: 'auth', section: 'login', key: 'no_account_text', value: "Don't have an account?" },
  { page: 'auth', section: 'login', key: 'sign_up_link', value: 'Sign up' },

  // Organization login content
  { page: 'organizationLogin', section: 'page', key: 'title', value: 'Organization Login' },
  { page: 'organizationLogin', section: 'page', key: 'subtitle', value: 'Access your organization dashboard' },
  { page: 'organizationLogin', section: 'page', key: 'email_label', value: 'Email' },
  { page: 'organizationLogin', section: 'page', key: 'password_label', value: 'Password' },
  { page: 'organizationLogin', section: 'page', key: 'sign_in_button', value: 'Sign In' },
  { page: 'organizationLogin', section: 'page', key: 'forgot_password_link', value: 'Forgot your password?' },
  { page: 'organizationLogin', section: 'page', key: 'no_account_text', value: "Don't have an organization account?" },
  { page: 'organizationLogin', section: 'page', key: 'register_link', value: 'Register here' },

  // Organization registration content
  { page: 'organizationRegister', section: 'page', key: 'title', value: 'Create Organization Account' },
  { page: 'organizationRegister', section: 'page', key: 'subtitle', value: 'Join our community of partner organizations' },
  { page: 'organizationRegister', section: 'page', key: 'organization_name_label', value: 'Organization Name' },
  { page: 'organizationRegister', section: 'page', key: 'contact_name_label', value: 'Contact Name' },
  { page: 'organizationRegister', section: 'page', key: 'email_label', value: 'Email' },
  { page: 'organizationRegister', section: 'page', key: 'password_label', value: 'Password' },
  { page: 'organizationRegister', section: 'page', key: 'confirm_password_label', value: 'Confirm Password' },
  { page: 'organizationRegister', section: 'page', key: 'description_label', value: 'Organization Description' },
  { page: 'organizationRegister', section: 'page', key: 'website_label', value: 'Website (Optional)' },
  { page: 'organizationRegister', section: 'page', key: 'phone_label', value: 'Phone Number (Optional)' },
  { page: 'organizationRegister', section: 'page', key: 'create_account_button', value: 'Create Account' },
  { page: 'organizationRegister', section: 'page', key: 'already_have_account_text', value: 'Already have an account?' },
  { page: 'organizationRegister', section: 'page', key: 'sign_in_link', value: 'Sign in here' },
  { page: 'organizationRegister', section: 'page', key: 'terms_text', value: 'By creating an account, you agree to our' },
  { page: 'organizationRegister', section: 'page', key: 'terms_link', value: 'Terms of Service' },
  { page: 'organizationRegister', section: 'page', key: 'and_text', value: 'and' },
  { page: 'organizationRegister', section: 'page', key: 'privacy_link', value: 'Privacy Policy' },

  // More dashboard content
  { page: 'dashboard', section: 'user', key: 'welcome_message', value: 'Welcome to your dashboard' },
  { page: 'dashboard', section: 'user', key: 'upcoming_events', value: 'Upcoming Events' },
  { page: 'dashboard', section: 'user', key: 'past_events', value: 'Past Events' },
  { page: 'dashboard', section: 'user', key: 'no_events_message', value: 'No events found' },

  // More organization dashboard content
  { page: 'organizationDashboard', section: 'page', key: 'welcome_message', value: 'Welcome to your organization dashboard' },
  { page: 'organizationDashboard', section: 'page', key: 'create_event_button', value: 'Create New Event' },
  { page: 'organizationDashboard', section: 'page', key: 'event_title_label', value: 'Event Title' },
  { page: 'organizationDashboard', section: 'page', key: 'event_description_label', value: 'Event Description' },
  { page: 'organizationDashboard', section: 'page', key: 'event_date_label', value: 'Event Date' },
  { page: 'organizationDashboard', section: 'page', key: 'event_time_label', value: 'Event Time' },
  { page: 'organizationDashboard', section: 'page', key: 'event_location_label', value: 'Event Location' },
  { page: 'organizationDashboard', section: 'page', key: 'max_participants_label', value: 'Maximum Participants' },
  { page: 'organizationDashboard', section: 'page', key: 'safety_guidelines_label', value: 'Safety Guidelines' },
  { page: 'organizationDashboard', section: 'page', key: 'create_event_button', value: 'Create Event' },
  { page: 'organizationDashboard', section: 'page', key: 'cancel_button', value: 'Cancel' },

  // More modal content
  { page: 'modals', section: 'groupSignup', key: 'title', value: 'Group Signup' },
  { page: 'modals', section: 'groupSignup', key: 'description', value: 'Sign up multiple people for this event' },
  { page: 'modals', section: 'groupSignup', key: 'group_size_label', value: 'Group Size' },
  { page: 'modals', section: 'groupSignup', key: 'participant_names_label', value: 'Participant Names' },
  { page: 'modals', section: 'groupSignup', key: 'signup_button', value: 'Sign Up Group' },
  { page: 'modals', section: 'groupSignup', key: 'cancel_button', value: 'Cancel' },

  // More section content
  { page: 'sections', section: 'hero', key: 'title_line_1', value: 'Connect.' },
  { page: 'sections', section: 'hero', key: 'title_line_2', value: 'Volunteer.' },
  { page: 'sections', section: 'hero', key: 'title_line_3', value: 'Make a Difference.' },
  { page: 'sections', section: 'hero', key: 'subtitle', value: 'Join thousands of volunteers making a positive impact in their communities. Find opportunities that match your skills and passion.' },
  { page: 'sections', section: 'hero', key: 'cta_button', value: 'Get Started' },
  { page: 'sections', section: 'hero', key: 'secondary_button', value: 'Learn More' },

  { page: 'sections', section: 'about', key: 'title', value: 'About Taylor Connect Hub' },
  { page: 'sections', section: 'about', key: 'subtitle', value: 'Building bridges between students and community organizations' },
  { page: 'sections', section: 'about', key: 'description', value: 'Taylor Connect Hub is a comprehensive platform designed to connect Taylor University students with meaningful volunteer opportunities in the local community. Our mission is to foster civic engagement, build lasting relationships, and create positive impact through service.' },
  { page: 'sections', section: 'about', key: 'mission', value: 'To empower students to make a difference while helping organizations achieve their goals through meaningful partnerships.' },
  { page: 'sections', section: 'about', key: 'vision', value: 'A connected community where every student has the opportunity to serve and every organization has the support they need to thrive.' },

  { page: 'sections', section: 'features', key: 'title', value: 'Why Choose Taylor Connect Hub?' },
  { page: 'sections', section: 'features', key: 'subtitle', value: 'Discover the benefits of our platform' },
  { page: 'sections', section: 'features', key: 'feature1_title', value: 'Easy Event Discovery' },
  { page: 'sections', section: 'features', key: 'feature1_description', value: 'Find volunteer opportunities that match your interests and schedule' },
  { page: 'sections', section: 'features', key: 'feature2_title', value: 'Seamless Communication' },
  { page: 'sections', section: 'features', key: 'feature2_description', value: 'Stay connected with organizations and fellow volunteers' },
  { page: 'sections', section: 'features', key: 'feature3_title', value: 'Track Your Impact' },
  { page: 'sections', section: 'features', key: 'feature3_description', value: 'Monitor your volunteer hours and contributions' },
  { page: 'sections', section: 'features', key: 'feature4_title', value: 'Community Building' },
  { page: 'sections', section: 'features', key: 'feature4_description', value: 'Build lasting relationships with local organizations' },

  { page: 'sections', section: 'contact', key: 'title', value: 'Get In Touch' },
  { page: 'sections', section: 'contact', key: 'subtitle', value: 'Ready to make a difference? Contact us today!' },
  { page: 'sections', section: 'contact', key: 'description', value: 'Have questions about volunteering or want to learn more about our platform? We\'re here to help!' },
  { page: 'sections', section: 'contact', key: 'contact_info_title', value: 'Contact Information' },
  { page: 'sections', section: 'contact', key: 'quick_response_title', value: 'Quick Response' },
  { page: 'sections', section: 'contact', key: 'send_message_title', value: 'Send us a Message' },
  { page: 'sections', section: 'contact', key: 'name_label', value: 'Name' },
  { page: 'sections', section: 'contact', key: 'email_label', value: 'Email' },
  { page: 'sections', section: 'contact', key: 'message_label', value: 'Message' },
  { page: 'sections', section: 'contact', key: 'send_button', value: 'Send Message' },

  // Footer content
  { page: 'footer', section: 'brand', key: 'tagline', value: 'Connecting students with community opportunities' },
  { page: 'footer', section: 'links', key: 'about_link', value: 'About' },
  { page: 'footer', section: 'links', key: 'contact_link', value: 'Contact' },
  { page: 'footer', section: 'links', key: 'privacy_link', value: 'Privacy Policy' },
  { page: 'footer', section: 'links', key: 'terms_link', value: 'Terms of Service' },
  { page: 'footer', section: 'copyright', key: 'text', value: '© 2024 Taylor Connect Hub. All rights reserved.' },
  { page: 'footer', section: 'partnership', key: 'text', value: 'A partnership between Taylor University and local community organizations' },
  { page: 'footer', section: 'social', key: 'facebook', value: 'Facebook' },
  { page: 'footer', section: 'social', key: 'twitter', value: 'Twitter' },
  { page: 'footer', section: 'social', key: 'instagram', value: 'Instagram' },
  { page: 'footer', section: 'social', key: 'linkedin', value: 'LinkedIn' },

  // Header content
  { page: 'header', section: 'brand', key: 'logo_alt', value: 'Taylor Connect Hub Logo' },
  { page: 'header', section: 'nav', key: 'home_link', value: 'Home' },
  { page: 'header', section: 'nav', key: 'about_link', value: 'About' },
  { page: 'header', section: 'nav', key: 'opportunities_link', value: 'Opportunities' },
  { page: 'header', section: 'nav', key: 'contact_link', value: 'Contact' },
  { page: 'header', section: 'buttons', key: 'sign_in_button', value: 'Sign In' },
  { page: 'header', section: 'buttons', key: 'sign_up_button', value: 'Sign Up' },
  { page: 'header', section: 'buttons', key: 'dashboard_button', value: 'Dashboard' },
  { page: 'header', section: 'buttons', key: 'logout_button', value: 'Logout' },

  // Testimonials content
  { page: 'testimonials', section: 'main', key: 'title', value: 'What Our Community Says' },
  { page: 'testimonials', section: 'main', key: 'subtitle', value: 'Hear from volunteers and organizations about their experiences' },
  { page: 'testimonials', section: 'testimonial1', key: 'quote', value: 'Taylor Connect Hub has made it so easy to find meaningful volunteer opportunities in our community.' },
  { page: 'testimonials', section: 'testimonial1', key: 'author', value: 'Sarah Johnson, Student Volunteer' },
  { page: 'testimonials', section: 'testimonial2', key: 'quote', value: 'We\'ve been able to connect with amazing student volunteers who are passionate about making a difference.' },
  { page: 'testimonials', section: 'testimonial2', key: 'author', value: 'Community Food Bank' },
  { page: 'testimonials', section: 'testimonial3', key: 'quote', value: 'The platform has transformed how we manage volunteer events and communicate with participants.' },
  { page: 'testimonials', section: 'testimonial3', key: 'author', value: 'Local Animal Shelter' },

  // Opportunities content
  { page: 'opportunities', section: 'main', key: 'title', value: 'Volunteer Opportunities' },
  { page: 'opportunities', section: 'main', key: 'subtitle', value: 'Find the perfect opportunity to serve your community' },
  { page: 'opportunities', section: 'main', key: 'search_placeholder', value: 'Search opportunities...' },
  { page: 'opportunities', section: 'main', key: 'filter_all', value: 'All Categories' },
  { page: 'opportunities', section: 'main', key: 'filter_education', value: 'Education' },
  { page: 'opportunities', section: 'main', key: 'filter_environment', value: 'Environment' },
  { page: 'opportunities', section: 'main', key: 'filter_health', value: 'Health & Wellness' },
  { page: 'opportunities', section: 'main', key: 'filter_community', value: 'Community Service' },
  { page: 'opportunities', section: 'main', key: 'filter_animals', value: 'Animal Welfare' },
  { page: 'opportunities', section: 'main', key: 'filter_homelessness', value: 'Homelessness' },
  { page: 'opportunities', section: 'main', key: 'filter_hunger', value: 'Hunger Relief' },
  { page: 'opportunities', section: 'main', key: 'filter_youth', value: 'Youth Development' },
  { page: 'opportunities', section: 'main', key: 'filter_seniors', value: 'Senior Care' },
  { page: 'opportunities', section: 'main', key: 'filter_disabilities', value: 'Disability Support' },
  { page: 'opportunities', section: 'main', key: 'filter_veterans', value: 'Veteran Support' },
  { page: 'opportunities', section: 'main', key: 'filter_arts', value: 'Arts & Culture' },
  { page: 'opportunities', section: 'main', key: 'filter_sports', value: 'Sports & Recreation' },
  { page: 'opportunities', section: 'main', key: 'filter_technology', value: 'Technology' },
  { page: 'opportunities', section: 'main', key: 'filter_emergency', value: 'Emergency Response' },
  { page: 'opportunities', section: 'main', key: 'filter_other', value: 'Other' },
  { page: 'opportunities', section: 'buttons', key: 'sign_up_button', value: 'Sign Up' },
  { page: 'opportunities', section: 'buttons', key: 'view_details_button', value: 'View Details' },
  { page: 'opportunities', section: 'buttons', key: 'contact_org_button', value: 'Contact Organization' },

  // Call to action content
  { page: 'cta', section: 'main', key: 'title', value: 'Ready to Make a Difference?' },
  { page: 'cta', section: 'main', key: 'subtitle', value: 'Join our community of volunteers and start making an impact today.' },
  { page: 'cta', section: 'main', key: 'primary_button', value: 'Get Started' },
  { page: 'cta', section: 'main', key: 'secondary_button', value: 'Learn More' },

  // Impact section content
  { page: 'impact', section: 'main', key: 'title', value: 'Our Impact' },
  { page: 'impact', section: 'main', key: 'subtitle', value: 'See the difference we\'re making together' },
  { page: 'impact', section: 'main', key: 'volunteers_label', value: 'Active Volunteers' },
  { page: 'impact', section: 'main', key: 'volunteers_description', value: 'Passionate individuals serving Upland' },
  { page: 'impact', section: 'main', key: 'hours_label', value: 'Hours Contributed' },
  { page: 'impact', section: 'main', key: 'hours_description', value: 'Collective time dedicated to service' },
  { page: 'impact', section: 'main', key: 'organizations_label', value: 'Partner Organizations' },
  { page: 'impact', section: 'main', key: 'organizations_description', value: 'Local organizations making a difference' },

  // Mission section content
  { page: 'mission', section: 'main', key: 'title', value: 'Our Mission' },
  { page: 'mission', section: 'main', key: 'subtitle', value: 'Empowering students to serve their community' },
  { page: 'mission', section: 'main', key: 'description', value: 'We believe that every student has the power to make a positive impact in their community. Through meaningful volunteer opportunities, we connect passionate individuals with organizations that need their help.' },

  // What we do section content
  { page: 'whatWeDo', section: 'main', key: 'title', value: 'What We Do' },
  { page: 'whatWeDo', section: 'main', key: 'subtitle', value: 'Connecting students with community opportunities' },
  { page: 'whatWeDo', section: 'main', key: 'description', value: 'Taylor Connect Hub serves as a bridge between Taylor University students and local community organizations. We facilitate meaningful connections that benefit both students and the community.' },

  // Programs section content
  { page: 'programs', section: 'main', key: 'title', value: 'Our Programs' },
  { page: 'programs', section: 'main', key: 'subtitle', value: 'Comprehensive volunteer opportunities for every interest' },
  { page: 'programs', section: 'main', key: 'description', value: 'From one-time events to ongoing commitments, we offer a wide range of volunteer opportunities that fit your schedule and interests.' },

  // Community transition image content
  { page: 'communityTransition', section: 'main', key: 'alt_text', value: 'Community members working together' },
  { page: 'communityTransition', section: 'main', key: 'title', value: 'Building Community Together' },
  { page: 'communityTransition', section: 'main', key: 'description', value: 'Join us in creating a stronger, more connected community through volunteer service.' }
];

async function migrateAdditionalStaticContent() {
  console.log('Starting migration of additional static content...');
  
  let successCount = 0;
  let errorCount = 0;

  for (const content of additionalStaticContent) {
    try {
      const { data, error } = await supabase
        .from('content')
        .upsert({
          page: content.page,
          section: content.section,
          key: content.key,
          value: content.value,
          language_code: 'en'
        }, {
          onConflict: 'page,section,key,language_code'
        });

      if (error) {
        console.error(`Error inserting ${content.page}.${content.section}.${content.key}:`, error);
        errorCount++;
      } else {
        console.log(`✓ Migrated: ${content.page}.${content.section}.${content.key}`);
        successCount++;
      }
    } catch (err) {
      console.error(`Exception inserting ${content.page}.${content.section}.${content.key}:`, err);
      errorCount++;
    }
  }

  console.log(`\nMigration completed!`);
  console.log(`Successfully migrated: ${successCount} items`);
  console.log(`Errors: ${errorCount} items`);
}

// Run the migration
migrateAdditionalStaticContent().catch(console.error);
