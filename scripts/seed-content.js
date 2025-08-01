import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Comprehensive content data for the entire site
const contentData = [
  // ===== HEADER CONTENT =====
  { page: 'header', section: 'nav', key: 'home', value: 'Home', language_code: 'en' },
  { page: 'header', section: 'nav', key: 'about', value: 'About', language_code: 'en' },
  { page: 'header', section: 'nav', key: 'opportunities', value: 'Opportunities', language_code: 'en' },
  { page: 'header', section: 'nav', key: 'contact', value: 'Contact', language_code: 'en' },
  { page: 'header', section: 'brand', key: 'name', value: 'Taylor Connect Hub', language_code: 'en' },
  { page: 'header', section: 'buttons', key: 'login', value: 'Login', language_code: 'en' },
  { page: 'header', section: 'buttons', key: 'get_started', value: 'Get Started', language_code: 'en' },
  { page: 'header', section: 'buttons', key: 'sign_out', value: 'Sign Out', language_code: 'en' },
  { page: 'header', section: 'buttons', key: 'dashboard', value: 'Dashboard', language_code: 'en' },
  { page: 'header', section: 'buttons', key: 'request_volunteers', value: 'Request Volunteers', language_code: 'en' },

  // ===== HOMEPAGE HERO SECTION =====
  { page: 'homepage', section: 'hero', key: 'titleLine1', value: 'Connect.', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'titleLine2', value: 'Volunteer.', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'titleLine3', value: 'Make a Difference.', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'subtitle', value: 'Join thousands of volunteers making a positive impact in their communities. Find opportunities that match your skills and passion.', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'ctaButton', value: 'Get Started', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'secondaryButton', value: 'Learn More', language_code: 'en' },
  
  // ===== HOMEPAGE IMPACT SECTION =====
  { page: 'homepage', section: 'impact', key: 'volunteers_label', value: 'Active Volunteers', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'active_volunteers', value: '2,500+', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'hours_label', value: 'Hours Contributed', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'hours_contributed', value: '15,000+', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'organizations_label', value: 'Partner Organizations', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'partner_organizations', value: '50+', language_code: 'en' },

  // ===== SEARCH SECTION =====
  { page: 'search', section: 'main', key: 'title', value: 'Find Your Perfect Volunteer Opportunity', language_code: 'en' },
  { page: 'search', section: 'main', key: 'subtitle', value: 'Search and filter opportunities based on your interests, skills, and availability.', language_code: 'en' },
  { page: 'search', section: 'main', key: 'placeholder', value: 'Search by title, description, or category...', language_code: 'en' },
  { page: 'search', section: 'categories', key: 'all', value: 'All', language_code: 'en' },
  { page: 'search', section: 'categories', key: 'community', value: 'Community', language_code: 'en' },
  { page: 'search', section: 'categories', key: 'education', value: 'Education', language_code: 'en' },
  { page: 'search', section: 'categories', key: 'environment', value: 'Environment', language_code: 'en' },
  { page: 'search', section: 'categories', key: 'health', value: 'Health', language_code: 'en' },
  { page: 'search', section: 'categories', key: 'fundraising', value: 'Fundraising', language_code: 'en' },
  { page: 'search', section: 'categories', key: 'other', value: 'Other', language_code: 'en' },

  // ===== OPPORTUNITIES SECTION =====
  { page: 'opportunities', section: 'main', key: 'title', value: 'Volunteer Opportunities', language_code: 'en' },
  { page: 'opportunities', section: 'main', key: 'subtitle', value: 'Discover meaningful ways to serve your community', language_code: 'en' },
  { page: 'opportunities', section: 'main', key: 'no_events', value: 'No events found matching your criteria.', language_code: 'en' },
  { page: 'opportunities', section: 'main', key: 'loading', value: 'Loading opportunities...', language_code: 'en' },
  { page: 'opportunities', section: 'main', key: 'error', value: 'Error loading opportunities. Please try again.', language_code: 'en' },
  { page: 'opportunities', section: 'buttons', key: 'sign_up', value: 'Sign Up', language_code: 'en' },
  { page: 'opportunities', section: 'buttons', key: 'group_signup', value: 'Group Signup', language_code: 'en' },
  { page: 'opportunities', section: 'buttons', key: 'chat', value: 'Chat', language_code: 'en' },
  { page: 'opportunities', section: 'buttons', key: 'cancel', value: 'Cancel', language_code: 'en' },
  { page: 'opportunities', section: 'buttons', key: 'login_required', value: 'Login Required', language_code: 'en' },

  // ===== ABOUT PAGE =====
  { page: 'about', section: 'hero', key: 'titleLine1', value: 'Make the', language_code: 'en' },
  { page: 'about', section: 'hero', key: 'titleLine2', value: 'Connection', language_code: 'en' },
  { page: 'about', section: 'hero', key: 'subtitle', value: 'Connect with meaningful opportunities that create lasting impact in Upland.', language_code: 'en' },
  { page: 'about', section: 'hero', key: 'ctaButton', value: 'Find Opportunities', language_code: 'en' },
  { page: 'about', section: 'hero', key: 'secondaryButton', value: 'Learn More', language_code: 'en' },
  
  { page: 'about', section: 'mission', key: 'title', value: 'Our Mission', language_code: 'en' },
  { page: 'about', section: 'mission', key: 'description', value: 'Community Connect is dedicated to fostering meaningful relationships between passionate volunteers and impactful opportunities. We believe that when individuals come together with shared purpose, they can create transformative change that extends far beyond individual efforts. Our platform serves as a bridge, connecting hearts and hands to build stronger, more resilient Upland through collective action.', language_code: 'en' },

  { page: 'about', section: 'main', key: 'title', value: 'About Taylor Connect Hub', language_code: 'en' },
  { page: 'about', section: 'main', key: 'subtitle', value: 'Building bridges between students and community organizations', language_code: 'en' },
  { page: 'about', section: 'main', key: 'description', value: 'Taylor Connect Hub is a comprehensive platform designed to connect Taylor University students with meaningful volunteer opportunities in the local community. Our mission is to foster civic engagement, build lasting relationships, and create positive impact through service.', language_code: 'en' },
  { page: 'about', section: 'main', key: 'mission', value: 'To empower students to make a difference while helping organizations achieve their goals through meaningful partnerships.', language_code: 'en' },
  { page: 'about', section: 'main', key: 'vision', value: 'A connected community where every student has the opportunity to serve and every organization has the support they need to thrive.', language_code: 'en' },

  // ===== TESTIMONIALS SECTION =====
  { page: 'testimonials', section: 'main', key: 'title', value: 'Stories of Impact', language_code: 'en' },
  { page: 'testimonials', section: 'main', key: 'subtitle', value: 'Discover how Community Connect is bringing people together and making a difference in our community.', language_code: 'en' },
  
  { page: 'testimonials', section: 'testimonial1', key: 'content', value: 'Community Connect helped me find the perfect volunteer opportunity. I\'ve made lifelong friends while making a real difference in our community.', language_code: 'en' },
  { page: 'testimonials', section: 'testimonial1', key: 'author', value: 'Sarah Johnson', language_code: 'en' },
  { page: 'testimonials', section: 'testimonial1', key: 'role', value: 'Volunteer', language_code: 'en' },
  
  { page: 'testimonials', section: 'testimonial2', key: 'content', value: 'The platform made it so easy to find volunteers for our literacy program. We\'ve been able to reach twice as many students this year.', language_code: 'en' },
  { page: 'testimonials', section: 'testimonial2', key: 'author', value: 'Marcus Chen', language_code: 'en' },
  { page: 'testimonials', section: 'testimonial2', key: 'role', value: 'Program Director', language_code: 'en' },
  
  { page: 'testimonials', section: 'testimonial3', key: 'content', value: 'I love how the opportunities are categorized and filtered. It\'s never been easier to find causes I\'m passionate about.', language_code: 'en' },
  { page: 'testimonials', section: 'testimonial3', key: 'author', value: 'Emma Rodriguez', language_code: 'en' },
  { page: 'testimonials', section: 'testimonial3', key: 'role', value: 'Student', language_code: 'en' },

  // ===== CONTACT SECTION =====
  { page: 'contact', section: 'main', key: 'title', value: 'Get in Touch', language_code: 'en' },
  { page: 'contact', section: 'main', key: 'subtitle', value: 'Ready to make a difference? Contact us today', language_code: 'en' },
  { page: 'contact', section: 'main', key: 'description', value: 'Whether you\'re a student looking to volunteer or an organization seeking support, we\'re here to help you connect and create meaningful impact.', language_code: 'en' },
  { page: 'contact', section: 'main', key: 'cta', value: 'Start Your Journey', language_code: 'en' },
  { page: 'contact', section: 'info', key: 'email', value: 'connect@taylor.edu', language_code: 'en' },
  { page: 'contact', section: 'info', key: 'phone', value: '(765) 998-5000', language_code: 'en' },
  { page: 'contact', section: 'info', key: 'address', value: '236 West Reade Avenue, Upland, IN 46989', language_code: 'en' },

  // ===== FEATURES SECTION =====
  { page: 'features', section: 'main', key: 'title', value: 'Platform Features', language_code: 'en' },
  { page: 'features', section: 'main', key: 'subtitle', value: 'Everything you need to connect and volunteer', language_code: 'en' },
  
  { page: 'features', section: 'feature1', key: 'title', value: 'Easy Registration', language_code: 'en' },
  { page: 'features', section: 'feature1', key: 'description', value: 'Quick and simple signup process for both students and organizations', language_code: 'en' },
  
  { page: 'features', section: 'feature2', key: 'title', value: 'Event Management', language_code: 'en' },
  { page: 'features', section: 'feature2', key: 'description', value: 'Create, manage, and track volunteer events with ease', language_code: 'en' },
  
  { page: 'features', section: 'feature3', key: 'title', value: 'Real-time Communication', language_code: 'en' },
  { page: 'features', section: 'feature3', key: 'description', value: 'Stay connected with instant messaging and notifications', language_code: 'en' },
  
  { page: 'features', section: 'feature4', key: 'title', value: 'Impact Tracking', language_code: 'en' },
  { page: 'features', section: 'feature4', key: 'description', value: 'Monitor volunteer hours and community impact metrics', language_code: 'en' },

  // ===== CALL TO ACTION SECTION =====
  { page: 'cta', section: 'main', key: 'title', value: 'Ready to Make a Difference?', language_code: 'en' },
  { page: 'cta', section: 'main', key: 'subtitle', value: 'Join our community of volunteers and start creating positive change today.', language_code: 'en' },
  { page: 'cta', section: 'main', key: 'ctaButton', value: 'Get Started Now', language_code: 'en' },
  { page: 'cta', section: 'main', key: 'secondaryButton', value: 'Learn More', language_code: 'en' },

  // ===== FOOTER =====
  { page: 'footer', section: 'brand', key: 'name', value: 'Taylor Connect Hub', language_code: 'en' },
  { page: 'footer', section: 'brand', key: 'tagline', value: 'Connecting hearts and hands to build stronger communities', language_code: 'en' },
  { page: 'footer', section: 'links', key: 'about', value: 'About', language_code: 'en' },
  { page: 'footer', section: 'links', key: 'opportunities', value: 'Opportunities', language_code: 'en' },
  { page: 'footer', section: 'links', key: 'contact', value: 'Contact', language_code: 'en' },
  { page: 'footer', section: 'links', key: 'privacy', value: 'Privacy Policy', language_code: 'en' },
  { page: 'footer', section: 'links', key: 'terms', value: 'Terms of Service', language_code: 'en' },
  { page: 'footer', section: 'copyright', key: 'text', value: '© 2024 Taylor Connect Hub. All rights reserved.', language_code: 'en' },

  // ===== AUTH MODALS =====
  { page: 'auth', section: 'login', key: 'title', value: 'Welcome Back', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'subtitle', value: 'Sign in to your account', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'email_label', value: 'Email', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'email_placeholder', value: 'Enter your email', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'password_label', value: 'Password', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'password_placeholder', value: 'Enter your password', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'submit', value: 'Sign In', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'forgot_password', value: 'Forgot Password?', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'no_account', value: 'Don\'t have an account?', language_code: 'en' },
  { page: 'auth', section: 'login', key: 'sign_up_link', value: 'Sign up', language_code: 'en' },

  { page: 'auth', section: 'signup', key: 'title', value: 'Create Account', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'subtitle', value: 'Join our community of volunteers', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'email_label', value: 'Email', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'email_placeholder', value: 'Enter your email', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'password_label', value: 'Password', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'password_placeholder', value: 'Create a password', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'confirm_password_label', value: 'Confirm Password', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'confirm_password_placeholder', value: 'Confirm your password', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'submit', value: 'Create Account', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'has_account', value: 'Already have an account?', language_code: 'en' },
  { page: 'auth', section: 'signup', key: 'sign_in_link', value: 'Sign in', language_code: 'en' },

  // ===== DASHBOARD =====
  { page: 'dashboard', section: 'user', key: 'welcome', value: 'Welcome back!', language_code: 'en' },
  { page: 'dashboard', section: 'user', key: 'my_commitments', value: 'My Commitments', language_code: 'en' },
  { page: 'dashboard', section: 'user', key: 'my_dorm', value: 'My Dorm/Wing', language_code: 'en' },
  { page: 'dashboard', section: 'user', key: 'change_dorm', value: 'Change Dorm', language_code: 'en' },
  { page: 'dashboard', section: 'user', key: 'update_password', value: 'Update Password', language_code: 'en' },
  { page: 'dashboard', section: 'user', key: 'no_commitments', value: 'You haven\'t signed up for any events yet.', language_code: 'en' },

  { page: 'dashboard', section: 'organization', key: 'welcome', value: 'Organization Dashboard', language_code: 'en' },
  { page: 'dashboard', section: 'organization', key: 'my_events', value: 'My Events', language_code: 'en' },
  { page: 'dashboard', section: 'organization', key: 'create_event', value: 'Create Event', language_code: 'en' },
  { page: 'dashboard', section: 'organization', key: 'no_events', value: 'You haven\'t created any events yet.', language_code: 'en' },

  { page: 'dashboard', section: 'admin', key: 'welcome', value: 'Admin Dashboard', language_code: 'en' },
  { page: 'dashboard', section: 'admin', key: 'users', value: 'Users', language_code: 'en' },
  { page: 'dashboard', section: 'admin', key: 'organizations', value: 'Organizations', language_code: 'en' },
  { page: 'dashboard', section: 'admin', key: 'events', value: 'Events', language_code: 'en' },
  { page: 'dashboard', section: 'admin', key: 'pending_approvals', value: 'Pending Approvals', language_code: 'en' },
  { page: 'dashboard', section: 'admin', key: 'total_users', value: 'Total Users', language_code: 'en' },
  { page: 'dashboard', section: 'admin', key: 'active_organizations', value: 'Active Organizations', language_code: 'en' },
  { page: 'dashboard', section: 'admin', key: 'upcoming_events', value: 'Upcoming Events', language_code: 'en' },

  // ===== MODALS =====
  { page: 'modals', section: 'forgot_password', key: 'title', value: 'Reset Password', language_code: 'en' },
  { page: 'modals', section: 'forgot_password', key: 'subtitle', value: 'Enter your email to receive a password reset link', language_code: 'en' },
  { page: 'modals', section: 'forgot_password', key: 'email_placeholder', value: 'Enter your email', language_code: 'en' },
  { page: 'modals', section: 'forgot_password', key: 'submit', value: 'Send Reset Link', language_code: 'en' },
  { page: 'modals', section: 'forgot_password', key: 'back', value: 'Back to Login', language_code: 'en' },

  { page: 'modals', section: 'request_volunteers', key: 'title', value: 'Request Volunteers', language_code: 'en' },
  { page: 'modals', section: 'request_volunteers', key: 'subtitle', value: 'Tell us about your volunteer needs', language_code: 'en' },
  { page: 'modals', section: 'request_volunteers', key: 'name_label', value: 'Organization Name', language_code: 'en' },
  { page: 'modals', section: 'request_volunteers', key: 'name_placeholder', value: 'Enter organization name', language_code: 'en' },
  { page: 'modals', section: 'request_volunteers', key: 'email_label', value: 'Contact Email', language_code: 'en' },
  { page: 'modals', section: 'request_volunteers', key: 'email_placeholder', value: 'Enter contact email', language_code: 'en' },
  { page: 'modals', section: 'request_volunteers', key: 'description_label', value: 'Volunteer Needs', language_code: 'en' },
  { page: 'modals', section: 'request_volunteers', key: 'description_placeholder', value: 'Describe your volunteer needs...', language_code: 'en' },
  { page: 'modals', section: 'request_volunteers', key: 'submit', value: 'Submit Request', language_code: 'en' },

  { page: 'modals', section: 'change_dorm', key: 'title', value: 'Change Dorm/Wing', language_code: 'en' },
  { page: 'modals', section: 'change_dorm', key: 'subtitle', value: 'Update your dorm and wing information', language_code: 'en' },
  { page: 'modals', section: 'change_dorm', key: 'dorm_label', value: 'Dorm', language_code: 'en' },
  { page: 'modals', section: 'change_dorm', key: 'wing_label', value: 'Wing', language_code: 'en' },
  { page: 'modals', section: 'change_dorm', key: 'submit', value: 'Update', language_code: 'en' },

  { page: 'modals', section: 'group_signup', key: 'title', value: 'Group Signup', language_code: 'en' },
  { page: 'modals', section: 'group_signup', key: 'subtitle', value: 'Sign up multiple people for this event', language_code: 'en' },
  { page: 'modals', section: 'group_signup', key: 'select_users', value: 'Select Users', language_code: 'en' },
  { page: 'modals', section: 'group_signup', key: 'submit', value: 'Sign Up Group', language_code: 'en' },

  // ===== ERROR PAGES =====
  { page: 'errors', section: '404', key: 'title', value: 'Page Not Found', language_code: 'en' },
  { page: 'errors', section: '404', key: 'subtitle', value: 'The page you\'re looking for doesn\'t exist.', language_code: 'en' },
  { page: 'errors', section: '404', key: 'back_home', value: 'Back to Home', language_code: 'en' },

  // ===== SUCCESS/ERROR MESSAGES =====
  { page: 'messages', section: 'success', key: 'account_created', value: 'Account created successfully!', language_code: 'en' },
  { page: 'messages', section: 'success', key: 'login_success', value: 'Successfully logged in!', language_code: 'en' },
  { page: 'messages', section: 'success', key: 'event_signup', value: 'Successfully signed up for event!', language_code: 'en' },
  { page: 'messages', section: 'success', key: 'profile_updated', value: 'Profile updated successfully!', language_code: 'en' },
  
  { page: 'messages', section: 'error', key: 'login_failed', value: 'Login failed. Please check your credentials.', language_code: 'en' },
  { page: 'messages', section: 'error', key: 'signup_failed', value: 'Account creation failed. Please try again.', language_code: 'en' },
  { page: 'messages', section: 'error', key: 'event_signup_failed', value: 'Failed to sign up for event. Please try again.', language_code: 'en' },
  { page: 'messages', section: 'error', key: 'network_error', value: 'Network error. Please check your connection.', language_code: 'en' },
];

async function seedContent() {
  console.log('🚀 Starting comprehensive content seeding...');
  
  try {
    // First, completely wipe the content table
    console.log('🗑️  Clearing existing content...');
    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('❌ Error clearing content table:', deleteError);
      return;
    }
    
    console.log('✅ Content table cleared successfully');
    
    // Insert all new content
    console.log('📝 Inserting new content...');
    const { data, error } = await supabase
      .from('content')
      .insert(contentData);
    
    if (error) {
      console.error('❌ Error seeding content:', error);
      return;
    }
    
    console.log('✅ Content seeded successfully!');
    console.log(`📊 Inserted ${contentData.length} content entries`);
    console.log('\n📋 Content Summary:');
    console.log('   • Header navigation and branding');
    console.log('   • Homepage hero and impact sections');
    console.log('   • Search and opportunities sections');
    console.log('   • About page content');
    console.log('   • Testimonials and features');
    console.log('   • Contact information');
    console.log('   • Authentication modals');
    console.log('   • Dashboard content');
    console.log('   • Error pages and messages');
    console.log('\n🎉 All content is now dynamic and manageable from the admin console!');
    
  } catch (error) {
    console.error('❌ Failed to seed content:', error);
  }
}

// Run the seeding
seedContent();