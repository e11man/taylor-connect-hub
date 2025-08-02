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

// Statistics Content for Homepage Impact Section
const statisticsContent = [
  { page: 'homepage', section: 'impact', key: 'active_volunteers', value: '2,500+', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'hours_contributed', value: '15,000+', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'partner_organizations', value: '50+', language_code: 'en' },
];

// Statistics Content for About Page Impact Section
const aboutStatisticsContent = [
  { page: 'about', section: 'impact', key: 'active_volunteers', value: '2,500+', language_code: 'en' },
  { page: 'about', section: 'impact', key: 'hours_contributed', value: '15,000+', language_code: 'en' },
  { page: 'about', section: 'impact', key: 'partner_organizations', value: '50+', language_code: 'en' },
];

// Combine all content
const allContent = [...statisticsContent, ...aboutStatisticsContent];

async function addStatisticsContent() {
  console.log('🚀 Starting to add statistics content...');
  
  try {
    // Check if statistics content already exists
    const { data: existingContent, error: checkError } = await supabase
      .from('content')
      .select('page, section, key')
      .in('key', ['active_volunteers', 'hours_contributed', 'partner_organizations']);

    if (checkError) {
      console.error('❌ Error checking existing content:', checkError);
      return;
    }

    if (existingContent && existingContent.length > 0) {
      console.log(`⚠️  Found ${existingContent.length} existing statistics content items. Updating...`);
      
      // Delete existing statistics content
      const { error: deleteError } = await supabase
        .from('content')
        .delete()
        .in('key', ['active_volunteers', 'hours_contributed', 'partner_organizations']);

      if (deleteError) {
        console.error('❌ Error deleting existing statistics content:', deleteError);
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
    console.log(`   - Homepage Statistics: ${statisticsContent.length} items`);
    console.log(`   - About Page Statistics: ${aboutStatisticsContent.length} items`);
    
    console.log('\n📋 Statistics content breakdown:');
    console.log('   - Active Volunteers: 2,500+');
    console.log('   - Hours Contributed: 15,000+');
    console.log('   - Partner Organizations: 50+');
    
    console.log('\n🔧 You can now edit these statistics through the admin console:');
    console.log('   - Go to Admin Dashboard → Content Management');
    console.log('   - Filter by page: "homepage" or "about"');
    console.log('   - Filter by section: "impact"');
    console.log('   - Edit the values for active_volunteers, hours_contributed, partner_organizations');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
addStatisticsContent(); 