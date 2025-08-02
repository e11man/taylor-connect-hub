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

// Privacy Policy Content
const privacyContent = [
  // Hero Section
  { page: 'privacy', section: 'hero', key: 'title', value: 'Privacy Policy', language_code: 'en' },
  { page: 'privacy', section: 'hero', key: 'subtitle', value: 'How we protect and handle your information', language_code: 'en' },
  { page: 'privacy', section: 'hero', key: 'description', value: 'Last updated: January 2024', language_code: 'en' },

  // Main Content
  { page: 'privacy', section: 'main', key: 'intro_title', value: 'Introduction', language_code: 'en' },
  { page: 'privacy', section: 'main', key: 'intro_text', value: 'Taylor Connect Hub is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.', language_code: 'en' },

  // Information Collection
  { page: 'privacy', section: 'collection', key: 'title', value: 'Information We Collect', language_code: 'en' },
  { page: 'privacy', section: 'collection', key: 'personal_title', value: 'Personal Information', language_code: 'en' },
  { page: 'privacy', section: 'collection', key: 'personal_text', value: 'We collect information you provide directly to us, such as when you create an account, sign up for events, or contact us. This may include your name, email address, phone number, and other contact information.', language_code: 'en' },
  { page: 'privacy', section: 'collection', key: 'usage_title', value: 'Usage Information', language_code: 'en' },
  { page: 'privacy', section: 'collection', key: 'usage_text', value: 'We automatically collect certain information about your use of our platform, including your IP address, browser type, operating system, and pages visited.', language_code: 'en' },

  // How We Use Information
  { page: 'privacy', section: 'usage', key: 'title', value: 'How We Use Your Information', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'description', value: 'We use the information we collect to:', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'purpose1', value: 'Provide and maintain our services', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'purpose2', value: 'Connect you with volunteer opportunities', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'purpose3', value: 'Send you important updates and notifications', language_code: 'en' },
  { page: 'privacy', section: 'usage', key: 'purpose4', value: 'Improve our platform and user experience', language_code: 'en' },

  // Information Sharing
  { page: 'privacy', section: 'sharing', key: 'title', value: 'Information Sharing', language_code: 'en' },
  { page: 'privacy', section: 'sharing', key: 'description', value: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.', language_code: 'en' },

  // Data Security
  { page: 'privacy', section: 'security', key: 'title', value: 'Data Security', language_code: 'en' },
  { page: 'privacy', section: 'security', key: 'description', value: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.', language_code: 'en' },

  // Your Rights
  { page: 'privacy', section: 'rights', key: 'title', value: 'Your Rights', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'description', value: 'You have the right to:', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'right1', value: 'Access your personal information', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'right2', value: 'Correct inaccurate information', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'right3', value: 'Request deletion of your information', language_code: 'en' },
  { page: 'privacy', section: 'rights', key: 'right4', value: 'Opt out of certain communications', language_code: 'en' },

  // Contact
  { page: 'privacy', section: 'contact', key: 'title', value: 'Contact Us', language_code: 'en' },
  { page: 'privacy', section: 'contact', key: 'description', value: 'If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@taylor.edu', language_code: 'en' },
];

// Terms of Service Content
const termsContent = [
  // Hero Section
  { page: 'terms', section: 'hero', key: 'title', value: 'Terms of Service', language_code: 'en' },
  { page: 'terms', section: 'hero', key: 'subtitle', value: 'Guidelines for using our platform', language_code: 'en' },
  { page: 'terms', section: 'hero', key: 'description', value: 'Last updated: January 2024', language_code: 'en' },

  // Main Content
  { page: 'terms', section: 'main', key: 'intro_title', value: 'Introduction', language_code: 'en' },
  { page: 'terms', section: 'main', key: 'intro_text', value: 'Welcome to Taylor Connect Hub. These Terms of Service govern your use of our platform and services. By accessing or using our platform, you agree to be bound by these terms and all applicable laws and regulations.', language_code: 'en' },

  // Acceptance of Terms
  { page: 'terms', section: 'acceptance', key: 'title', value: 'Acceptance of Terms', language_code: 'en' },
  { page: 'terms', section: 'acceptance', key: 'description', value: 'By creating an account, signing up for events, or using our platform in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.', language_code: 'en' },

  // Services Description
  { page: 'terms', section: 'services', key: 'title', value: 'Description of Services', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'description', value: 'Taylor Connect Hub provides a platform that connects students with volunteer opportunities offered by community organizations. Our services include:', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'service1', value: 'Event creation and management for organizations', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'service2', value: 'Volunteer opportunity discovery and signup', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'service3', value: 'Communication tools between volunteers and organizations', language_code: 'en' },
  { page: 'terms', section: 'services', key: 'service4', value: 'Administrative tools and reporting', language_code: 'en' },

  // User Responsibilities
  { page: 'terms', section: 'user', key: 'title', value: 'User Responsibilities', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'account_title', value: 'Account Management', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'account_text', value: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'conduct_title', value: 'Code of Conduct', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'conduct_text', value: 'You agree to use our platform in a manner that is respectful, lawful, and appropriate. You will not engage in any activity that could harm, disable, or impair our services or interfere with other users\' enjoyment of the platform.', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'participation_title', value: 'Event Participation', language_code: 'en' },
  { page: 'terms', section: 'user', key: 'participation_text', value: 'When you sign up for volunteer events, you commit to attending and participating responsibly. You should arrive on time, follow safety guidelines, and treat all participants with respect.', language_code: 'en' },

  // Organization Responsibilities
  { page: 'terms', section: 'organization', key: 'title', value: 'Organization Responsibilities', language_code: 'en' },
  { page: 'terms', section: 'organization', key: 'event_title', value: 'Event Management', language_code: 'en' },
  { page: 'terms', section: 'organization', key: 'event_text', value: 'Organizations are responsible for providing accurate event information, maintaining safe environments, and ensuring proper supervision of volunteers. Events must comply with all applicable laws and regulations.', language_code: 'en' },
  { page: 'terms', section: 'organization', key: 'communication_title', value: 'Communication', language_code: 'en' },
  { page: 'terms', section: 'organization', key: 'communication_text', value: 'Organizations must respond promptly to volunteer inquiries and provide clear instructions for event participation. Any changes to events should be communicated immediately.', language_code: 'en' },

  // Limitation of Liability
  { page: 'terms', section: 'liability', key: 'title', value: 'Limitation of Liability', language_code: 'en' },
  { page: 'terms', section: 'liability', key: 'description', value: 'Taylor Connect Hub serves as a platform to connect volunteers with organizations. We are not responsible for the conduct of individual users or organizations, nor for any injuries, damages, or losses that may occur during volunteer activities. Users participate in events at their own risk.', language_code: 'en' },

  // Termination
  { page: 'terms', section: 'termination', key: 'title', value: 'Termination', language_code: 'en' },
  { page: 'terms', section: 'termination', key: 'description', value: 'We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason we deem appropriate. You may also terminate your account at any time by contacting us.', language_code: 'en' },

  // Contact
  { page: 'terms', section: 'contact', key: 'title', value: 'Contact Information', language_code: 'en' },
  { page: 'terms', section: 'contact', key: 'description', value: 'If you have any questions about these Terms of Service, please contact us at legal@taylor.edu', language_code: 'en' },
];

// Combine all content
const allContent = [...privacyContent, ...termsContent];

async function addPrivacyTermsContent() {
  console.log('🚀 Starting to add Privacy Policy and Terms of Service content...');
  
  try {
    // Check if content already exists
    const { data: existingContent, error: checkError } = await supabase
      .from('content')
      .select('page, section, key')
      .in('page', ['privacy', 'terms']);

    if (checkError) {
      console.error('❌ Error checking existing content:', checkError);
      return;
    }

    if (existingContent && existingContent.length > 0) {
      console.log(`⚠️  Found ${existingContent.length} existing privacy/terms content items. Skipping...`);
      return;
    }

    // Insert all content
    const { data, error } = await supabase
      .from('content')
      .insert(allContent)
      .select();

    if (error) {
      console.error('❌ Error inserting content:', error);
      return;
    }

    console.log(`✅ Successfully added ${data.length} content items:`);
    console.log(`   - Privacy Policy: ${privacyContent.length} items`);
    console.log(`   - Terms of Service: ${termsContent.length} items`);
    
    console.log('\n📋 Content added successfully! The pages are now available at:');
    console.log('   - Privacy Policy: /privacy');
    console.log('   - Terms of Service: /terms');
    console.log('\n🔧 You can now edit this content through the admin console.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
addPrivacyTermsContent(); 