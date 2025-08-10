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
  // ===== PRIVACY POLICY CONTENT =====
  // Privacy Policy Hero Section
  { page: 'privacy', section: 'hero', key: 'title', value: 'Privacy Policy', language_code: 'en' },
  { page: 'privacy', section: 'hero', key: 'subtitle', value: 'How we protect and handle your information', language_code: 'en' },
  { page: 'privacy', section: 'hero', key: 'description', value: 'Last updated: January 2024', language_code: 'en' },

  // Privacy Policy Features
  { page: 'privacy', section: 'features', key: 'data_protection_title', value: 'Data Protection', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'data_protection_description', value: 'Your personal information is protected with industry-standard security measures.', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'transparency_title', value: 'Transparency', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'transparency_description', value: 'We\'re clear about what data we collect and how we use it.', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'secure_storage_title', value: 'Secure Storage', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'secure_storage_description', value: 'All data is encrypted and stored securely in our database.', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'user_control_title', value: 'User Control', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'user_control_description', value: 'You have full control over your data and can request changes anytime.', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'limited_collection_title', value: 'Limited Collection', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'limited_collection_description', value: 'We only collect the information necessary to provide our services.', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'notifications_title', value: 'Notifications', language_code: 'en' },
  { page: 'privacy', section: 'features', key: 'notifications_description', value: 'You control how and when you receive communications from us.', language_code: 'en' },

  // Privacy Policy Main Content
  { page: 'privacy', section: 'main', key: 'intro_title', value: 'Introduction', language_code: 'en' },
  { page: 'privacy', section: 'main', key: 'intro_text', value: 'Taylor Connect Hub is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.', language_code: 'en' },

  // Privacy Policy Collection Section
  { page: 'privacy', section: 'collection', key: 'title', value: 'Information We Collect', language_code: 'en' },
  { page: 'privacy', section: 'collection', key: 'personal_title', value: 'Personal Information', language_code: 'en' },
  { page: 'privacy', section: 'collection', key: 'personal_text', value: 'We collect information you provide directly to us, such as when you create an account, sign up for events, or contact us. This may include your name, email address, phone number, and other contact information.', language_code: 'en' },
  { page: 'privacy', section: 'collection', key: 'usage_title', value: 'Usage Information', language_code: 'en' },
  { page: 'privacy', section: 'collection', key: 'usage_text', value: 'We automatically collect certain information about your use of our platform, including your IP address, browser type, operating system, and pages visited.', language_code: 'en' },

  // Privacy Policy Usage Section
  { page: 'privacy', section: 'usage', key: 'title', value: 'How We Use Your Information', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'description', value: 'We use the information we collect to:', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'purpose1', value: 'Provide and maintain our services', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'purpose2', value: 'Connect you with volunteer opportunities', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'purpose3', value: 'Send you important updates and notifications', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'purpose4', value: 'Improve our platform and user experience', language_code: 'en' },

  // Privacy Policy Sharing Section
  { page: 'privacy', section: 'sharing', key: 'title', value: 'Information Sharing', language_code: 'en' },
  { page: 'privacy', section: 'sharing', key: 'description', value: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.', language_code: 'en' },

  // Privacy Policy Security Section
  { page: 'privacy', section: 'security', key: 'title', value: 'Data Security', language_code: 'en' },
  { page: 'privacy', section: 'security', key: 'description', value: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.', language_code: 'en' },

  // Privacy Policy Rights Section
  { page: 'privacy', section: 'rights', key: 'title', value: 'Your Rights', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'description', value: 'You have the right to:', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'right1', value: 'Access your personal information', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'right2', value: 'Correct inaccurate information', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'right3', value: 'Request deletion of your information', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'right4', value: 'Opt out of certain communications', language_code: 'en' },

  // Privacy Policy Contact Section
  { page: 'privacy', section: 'contact', key: 'title', value: 'Contact Us', language_code: 'en' },
  { page: 'privacy', section: 'contact', key: 'description', value: 'If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@taylor.edu', language_code: 'en' },

  // ===== TERMS OF SERVICE CONTENT =====
  // Terms of Service Hero Section
  { page: 'terms', section: 'hero', key: 'title', value: 'Terms of Service', language_code: 'en' },
  { page: 'terms', section: 'hero', key: 'subtitle', value: 'Guidelines for using our platform', language_code: 'en' },
  { page: 'terms', section: 'hero', key: 'description', value: 'Last updated: January 2024', language_code: 'en' },

  // Terms of Service Features
  { page: 'terms', section: 'features', key: 'clear_terms_title', value: 'Clear Terms', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'clear_terms_description', value: 'Easy-to-understand terms that protect both users and organizations.', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'user_rights_title', value: 'User Rights', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'user_rights_description', value: 'Your rights and responsibilities are clearly outlined and protected.', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'safety_first_title', value: 'Safety First', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'safety_first_description', value: 'Comprehensive safety guidelines and liability protections.', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'community_standards_title', value: 'Community Standards', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'community_standards_description', value: 'Guidelines that ensure a positive experience for everyone.', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'data_protection_title', value: 'Data Protection', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'data_protection_description', value: 'Your privacy and data security are our top priorities.', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'updated_regularly_title', value: 'Updated Regularly', language_code: 'en' },
  { page: 'terms', section: 'features', key: 'updated_regularly_description', value: 'Terms are reviewed and updated to reflect current best practices.', language_code: 'en' },

  // Terms of Service Main Content
  { page: 'terms', section: 'main', key: 'intro_title', value: 'Introduction', language_code: 'en' },
  { page: 'terms', section: 'main', key: 'intro_text', value: 'Welcome to Taylor Connect Hub. These Terms of Service govern your use of our platform and services. By accessing or using our platform, you agree to be bound by these terms and all applicable laws and regulations.', language_code: 'en' },

  // Terms of Service Acceptance Section
  { page: 'terms', section: 'acceptance', key: 'title', value: 'Acceptance of Terms', language_code: 'en' },
  { page: 'terms', section: 'acceptance', key: 'description', value: 'By creating an account, signing up for events, or using our platform in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.', language_code: 'en' },

  // Terms of Service Services Section
  { page: 'terms', section: 'services', key: 'title', value: 'Description of Services', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'description', value: 'Taylor Connect Hub provides a platform that connects students with volunteer opportunities offered by community organizations. Our services include:', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'service1', value: 'Event creation and management for organizations', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'service2', value: 'Volunteer opportunity discovery and signup', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'service3', value: 'Communication tools between volunteers and organizations', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'service4', value: 'Administrative tools and reporting', language_code: 'en' },

  // Terms of Service User Section
  { page: 'terms', section: 'user', key: 'title', value: 'User Responsibilities', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'account_title', value: 'Account Management', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'account_text', value: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'conduct_title', value: 'Code of Conduct', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'conduct_text', value: 'You agree to use our platform in a manner that is respectful, lawful, and appropriate. You will not engage in any activity that could harm, disable, or impair our services or interfere with other users\' enjoyment of the platform.', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'participation_title', value: 'Event Participation', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'participation_text', value: 'When you sign up for volunteer events, you commit to attending and participating responsibly. You should arrive on time, follow safety guidelines, and treat all participants with respect.', language_code: 'en' },

  // Terms of Service Organization Section
  { page: 'terms', section: 'organization', key: 'title', value: 'Organization Responsibilities', language_code: 'en' },
  { page: 'terms', section: 'organization', key: 'event_title', value: 'Event Management', language_code: 'en' },
  { page: 'terms', section: 'organization', key: 'event_text', value: 'Organizations are responsible for providing accurate event information, maintaining safe environments, and ensuring proper supervision of volunteers. Events must comply with all applicable laws and regulations.', language_code: 'en' },
  { page: 'terms', section: 'organization', key: 'communication_title', value: 'Communication', language_code: 'en' },
  { page: 'terms', section: 'organization', key: 'communication_text', value: 'Organizations must respond promptly to volunteer inquiries and provide clear instructions for event participation. Any changes to events should be communicated immediately.', language_code: 'en' },

  // Terms of Service Liability Section
  { page: 'terms', section: 'liability', key: 'title', value: 'Limitation of Liability', language_code: 'en' },
  { page: 'terms', section: 'liability', key: 'description', value: 'Taylor Connect Hub serves as a platform to connect volunteers with organizations. We are not responsible for the conduct of individual users or organizations, nor for any injuries, damages, or losses that may occur during volunteer activities. Users participate in events at their own risk.', language_code: 'en' },

  // Terms of Service Termination Section
  { page: 'terms', section: 'termination', key: 'title', value: 'Termination', language_code: 'en' },
  { page: 'terms', section: 'termination', key: 'description', value: 'We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason we deem appropriate. You may also terminate your account at any time by contacting us.', language_code: 'en' },

  // Terms of Service Contact Section
  { page: 'terms', section: 'contact', key: 'title', value: 'Contact Information', language_code: 'en' },
  { page: 'terms', section: 'contact', key: 'description', value: 'If you have any questions about these Terms of Service, please contact us at legal@taylor.edu', language_code: 'en' },
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

// Function to create admin user
async function createAdminUser() {
  try {
    console.log('👤 Creating admin user...');
    
    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@admin.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        dorm: 'Admin Building',
        wing: 'Administrative'
      }
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('Admin user already exists in auth, checking profile...');
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', 'admin@admin.com')
          .single();
        
        if (existingProfile) {
          console.log('Admin profile already exists, updating role...');
          
          // Update the role to admin
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('email', 'admin@admin.com');
          
          if (updateError) {
            console.error('Error updating admin role:', updateError);
          } else {
            console.log('✅ Admin role updated successfully!');
          }
        }
        return;
      } else {
        console.error('Error creating admin user in auth:', authError);
        return;
      }
    }
    
    // The profile should be automatically created by the trigger,
    // but we need to update the role to admin
    if (authData.user) {
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', authData.user.id);
      
      if (updateError) {
        console.error('Error updating admin role:', updateError);
      } else {
        console.log('✅ Admin user and profile created successfully!');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error creating admin user:', error);
  }
}

// Function to populate site stats
async function populateSiteStats() {
  try {
    console.log('📊 Populating site statistics...');
    
    // Clear existing stats
    const { error: deleteError } = await supabase
      .from('site_stats')
      .delete()
      .neq('stat_type', '');
    
    if (deleteError) {
      console.error('Error clearing existing stats:', deleteError);
      return;
    }
    
    // Insert realistic site statistics
    const siteStats = [
      {
        stat_type: 'active_volunteers',
        confirmed_total: 1247,
        current_estimate: 1247,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        stat_type: 'hours_contributed',
        confirmed_total: 15832,
        current_estimate: 15832,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        stat_type: 'partner_organizations',
        confirmed_total: 89,
        current_estimate: 89,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { data, error } = await supabase
      .from('site_stats')
      .insert(siteStats);
    
    if (error) {
      console.error('Error inserting site stats:', error);
      return;
    }
    
    console.log(`✅ Successfully populated ${siteStats.length} site statistics`);
    
  } catch (error) {
    console.error('Unexpected error populating site stats:', error);
  }
}

// Function to create sample organizations
async function createSampleOrganizations() {
  try {
    console.log('🏢 Creating sample organizations...');
    
    // First, create organization users in auth
    const organizationUsers = [
      {
        email: 'info@uplandfoodpantry.org',
        password: 'temp123',
        metadata: {
          user_type: 'organization',
          organization_name: 'Upland Food Pantry',
          description: 'Providing food assistance to families in need throughout Grant County.',
          website: 'https://uplandfoodpantry.org',
          phone: '(765) 998-2345'
        }
      },
      {
        email: 'volunteer@habitatgc.org',
        password: 'temp123',
        metadata: {
          user_type: 'organization',
          organization_name: 'Habitat for Humanity Grant County',
          description: 'Building homes and hope in our community through volunteer construction projects.',
          website: 'https://habitatgrantcounty.org',
          phone: '(765) 664-0808'
        }
      },
      {
        email: 'programs@bgcgc.org',
        password: 'temp123',
        metadata: {
          user_type: 'organization',
          organization_name: 'Boys & Girls Club of Grant County',
          description: 'Empowering young people to reach their full potential through mentorship and activities.',
          website: 'https://bgcgrantcounty.org',
          phone: '(765) 662-5050'
        }
      },
      {
        email: 'volunteers@gchumane.org',
        password: 'temp123',
        metadata: {
          user_type: 'organization',
          organization_name: 'Grant County Humane Society',
          description: 'Caring for abandoned and homeless animals while promoting responsible pet ownership.',
          website: 'https://grantcountyhumane.com',
          phone: '(765) 664-6394'
        }
      },
      {
        email: 'community@sagc.org',
        password: 'temp123',
        metadata: {
          user_type: 'organization',
          organization_name: 'Salvation Army Grant County',
          description: 'Meeting human needs without discrimination through various community programs.',
          website: 'https://salvationarmygc.org',
          phone: '(765) 662-5988'
        }
      }
    ];
    
    const createdOrganizations = [];
    
    for (const orgUser of organizationUsers) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: orgUser.email,
          password: orgUser.password,
          email_confirm: true,
          user_metadata: orgUser.metadata
        });
        
        if (authError && !authError.message.includes('already registered')) {
          console.error(`Error creating organization user ${orgUser.email}:`, authError);
          continue;
        }
        
        // Wait for trigger to create organization profile (if new user)
        if (!authError) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Get the organization (whether newly created or existing)
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('contact_email', orgUser.email)
          .single();
        
        if (org) {
          createdOrganizations.push(org);
        } else if (orgError) {
          console.error(`Error fetching organization ${orgUser.email}:`, orgError);
        }
      } catch (error) {
        console.error(`Error processing organization ${orgUser.email}:`, error);
      }
    }
    
    console.log(`✅ Successfully created ${createdOrganizations.length} sample organizations`);
    return createdOrganizations;
    
  } catch (error) {
    console.error('Unexpected error creating sample organizations:', error);
    return [];
  }
}

// Function to create sample events
async function createSampleEvents(organizations) {
  try {
    console.log('📅 Creating sample events...');
    
    if (!organizations || organizations.length === 0) {
      console.log('⚠️ No organizations available for creating events');
      return;
    }
    
    const events = [
      {
        organization_id: organizations[0].id,
        title: 'Food Pantry Volunteer Day',
        description: 'Help sort and distribute food to families in need. Tasks include organizing donations, packing food boxes, and assisting clients. No experience necessary. Must be able to lift 25 lbs. Contact Sarah at (765) 998-2345',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        location: '123 Main Street, Upland, IN 46989',
        max_participants: 15,
        image_url: '/api/placeholder/400/300'
      },
      {
        organization_id: organizations[1].id,
        title: 'Home Building Project',
        description: 'Join us for a day of construction work helping build affordable housing. Activities include framing, painting, and landscaping. Must be 16+ years old. Construction experience helpful but not required. Contact Mike at volunteer@habitatgc.org',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        location: '456 Oak Avenue, Marion, IN 46952',
        max_participants: 20,
        image_url: '/api/placeholder/400/300'
      },
      {
        organization_id: organizations[2].id,
        title: 'Youth Mentorship Program',
        description: 'Mentor local youth through educational activities, games, and life skills workshops. Background check required. Must enjoy working with children ages 6-18. Contact Jessica at programs@bgcgc.org',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        location: '789 Youth Center Drive, Gas City, IN 46933',
        max_participants: 10,
        image_url: '/api/placeholder/400/300'
      },
      {
        organization_id: organizations[3].id,
        title: 'Animal Care Volunteer Day',
        description: 'Help care for shelter animals including feeding, cleaning, walking dogs, and socializing cats. Must love animals. Comfortable working with dogs and cats of all sizes. Contact Amy at volunteers@gchumane.org',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        location: '1302 S Western Ave, Marion, IN 46953',
        max_participants: 12,
        image_url: '/api/placeholder/400/300'
      },
      {
        organization_id: organizations[4].id,
        title: 'Community Meal Service',
        description: 'Prepare and serve meals to community members in need. Help with cooking, serving, and cleanup. Food handler certification preferred but not required. Must follow health guidelines. Contact David at community@sagc.org',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        location: '629 W 4th St, Marion, IN 46952',
        max_participants: 8,
        image_url: '/api/placeholder/400/300'
      }
    ];
    
    const { data, error } = await supabase
      .from('events')
      .insert(events);
    
    if (error) {
      console.error('Error creating sample events:', error);
      return;
    }
    
    console.log(`✅ Successfully created ${events.length} sample events`);
    
  } catch (error) {
    console.error('Unexpected error creating sample events:', error);
  }
}

// Function to seed all content
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

// Main function to run all seeding operations
async function runFullSeeding() {
  console.log('🚀 Starting comprehensive database seeding...');
  console.log('=' .repeat(50));
  
  // Seed content
  await seedContent();
  
  // Create admin user
  await createAdminUser();
  
  // Populate site stats
  await populateSiteStats();
  
  // Create sample organizations
  const organizations = await createSampleOrganizations();
  
  // Create sample events
  await createSampleEvents(organizations);
  
  console.log('=' .repeat(50));
  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Content populated for all pages');
  console.log('   ✅ Admin user created (admin@admin.com)');
  console.log('   ✅ Site statistics populated');
  console.log('   ✅ Sample organizations created');
  console.log('   ✅ Sample events created');
}

// Run the seeding
runFullSeeding();