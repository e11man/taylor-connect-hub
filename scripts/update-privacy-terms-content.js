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

// Privacy Policy Feature Cards Content
const privacyFeaturesContent = [
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
];

// Terms of Service Feature Cards Content
const termsFeaturesContent = [
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
];

// Combine all content
const allContent = [...privacyFeaturesContent, ...termsFeaturesContent];

async function updatePrivacyTermsContent() {
  console.log('🚀 Starting to add missing Privacy Policy and Terms of Service content...');
  
  try {
    // Check if features content already exists
    const { data: existingContent, error: checkError } = await supabase
      .from('content')
      .select('page, section, key')
      .in('section', ['features']);

    if (checkError) {
      console.error('❌ Error checking existing content:', checkError);
      return;
    }

    if (existingContent && existingContent.length > 0) {
      console.log(`⚠️  Found ${existingContent.length} existing features content items. Updating...`);
      
      // Delete existing features content
      const { error: deleteError } = await supabase
        .from('content')
        .delete()
        .in('section', ['features']);

      if (deleteError) {
        console.error('❌ Error deleting existing features content:', deleteError);
        return;
      }
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
    console.log(`   - Privacy Policy Features: ${privacyFeaturesContent.length} items`);
    console.log(`   - Terms of Service Features: ${termsFeaturesContent.length} items`);
    
    console.log('\n📋 All content is now dynamic! You can edit everything through the admin console.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
updatePrivacyTermsContent(); 