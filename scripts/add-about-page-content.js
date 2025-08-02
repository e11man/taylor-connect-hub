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

// Impact Section Content
const impactContent = [
  { page: 'about', section: 'impact', key: 'title', value: 'Our Impact', language_code: 'en' },
  { page: 'about', section: 'impact', key: 'volunteers_description', value: 'Passionate individuals serving Upland', language_code: 'en' },
  { page: 'about', section: 'impact', key: 'hours_description', value: 'Collective time dedicated to service', language_code: 'en' },
  { page: 'about', section: 'impact', key: 'organizations_description', value: 'Local organizations making a difference', language_code: 'en' },
];

// What We Do Section Content
const whatWeDoContent = [
  { page: 'about', section: 'what_we_do', key: 'title', value: 'What We Do', language_code: 'en' },
  { page: 'about', section: 'what_we_do', key: 'description', value: 'Community Connect facilitates a wide array of volunteer opportunities, from local ministry work to global outreach initiatives. We partner with organizations that share our commitment to making a positive difference in Upland.', language_code: 'en' },
  
  // Services
  { page: 'about', section: 'what_we_do', key: 'local_ministries_title', value: 'Local Ministries', language_code: 'en' },
  { page: 'about', section: 'what_we_do', key: 'local_ministries_description', value: 'Taylor World Outreach (TWO) ministries provide hands-on opportunities to serve in our local Upland and beyond. These programs focus on meeting immediate needs while building lasting relationships.', language_code: 'en' },
  
  { page: 'about', section: 'what_we_do', key: 'community_plunge_title', value: 'Community Plunge', language_code: 'en' },
  { page: 'about', section: 'what_we_do', key: 'community_plunge_description', value: 'Our signature immersive experience where volunteers dive deep into service in Upland, building connections and creating lasting impact through intensive, focused engagement.', language_code: 'en' },
  
  { page: 'about', section: 'what_we_do', key: 'world_opportunities_title', value: 'World Opportunities', language_code: 'en' },
  { page: 'about', section: 'what_we_do', key: 'world_opportunities_description', value: 'Learn about opportunities to serve globally, from short-term mission trips to long-term international partnerships that expand your impact beyond local borders.', language_code: 'en' },
  
  { page: 'about', section: 'what_we_do', key: 'community_outreach_title', value: 'Community Outreach Programs', language_code: 'en' },
  { page: 'about', section: 'what_we_do', key: 'community_outreach_description', value: 'Share the love of Christ through diverse service opportunities that address real needs in Upland and foster meaningful relationships.', language_code: 'en' },
];

// Programs Section Content
const programsContent = [
  { page: 'about', section: 'programs', key: 'title', value: 'Community Outreach Programs', language_code: 'en' },
  { page: 'about', section: 'programs', key: 'description', value: 'Share the love of Christ through diverse service opportunities that address real needs in Upland and foster meaningful relationships.', language_code: 'en' },
  
  // Individual Programs
  { page: 'about', section: 'programs', key: 'basics_title', value: 'Basics', language_code: 'en' },
  { page: 'about', section: 'programs', key: 'basics_description', value: 'Essential needs support for families and individuals', language_code: 'en' },
  
  { page: 'about', section: 'programs', key: 'basics_jr_title', value: 'Basics Jr.', language_code: 'en' },
  { page: 'about', section: 'programs', key: 'basics_jr_description', value: 'Youth-focused programs for children and teens', language_code: 'en' },
  
  { page: 'about', section: 'programs', key: 'carpenters_hands_title', value: 'Carpenter\'s Hands', language_code: 'en' },
  { page: 'about', section: 'programs', key: 'carpenters_hands_description', value: 'Home repair and construction projects', language_code: 'en' },
  
  { page: 'about', section: 'programs', key: 'esl_title', value: 'ESL', language_code: 'en' },
  { page: 'about', section: 'programs', key: 'esl_description', value: 'English as Second Language tutoring and support', language_code: 'en' },
  
  { page: 'about', section: 'programs', key: 'lift_title', value: 'Lift', language_code: 'en' },
  { page: 'about', section: 'programs', key: 'lift_description', value: 'Mentorship and encouragement programs', language_code: 'en' },
  
  { page: 'about', section: 'programs', key: 'realife_title', value: 'ReaLife', language_code: 'en' },
  { page: 'about', section: 'programs', key: 'realife_description', value: 'Real-life skills and life coaching', language_code: 'en' },
];

// Contact Section Additional Content
const contactAdditionalContent = [
  { page: 'about', section: 'contact', key: 'quick_response_title', value: 'Quick Response', language_code: 'en' },
  { page: 'about', section: 'contact', key: 'quick_response_description', value: 'We typically respond to messages within 24 hours during business days. For urgent matters, please call us directly.', language_code: 'en' },
  { page: 'about', section: 'contact', key: 'contact_info_title', value: 'Contact Information', language_code: 'en' },
  { page: 'about', section: 'contact', key: 'send_message_title', value: 'Send us a Message', language_code: 'en' },
];

// Combine all content
const allContent = [
  ...impactContent,
  ...whatWeDoContent,
  ...programsContent,
  ...contactAdditionalContent
];

async function addAboutPageContent() {
  console.log('🚀 Starting to add About page content...');
  
  try {
    // Check if content already exists
    const { data: existingContent, error: checkError } = await supabase
      .from('content')
      .select('page, section, key')
      .eq('page', 'about');

    if (checkError) {
      console.error('❌ Error checking existing content:', checkError);
      return;
    }

    if (existingContent && existingContent.length > 0) {
      console.log(`⚠️  Found ${existingContent.length} existing about page content items. Checking for duplicates...`);
      
      // Filter out existing content keys
      const existingKeys = existingContent.map(item => `${item.section}.${item.key}`);
      const newContent = allContent.filter(item => !existingKeys.includes(`${item.section}.${item.key}`));
      
      if (newContent.length === 0) {
        console.log('✅ All about page content already exists!');
        return;
      }
      
      console.log(`📝 Adding ${newContent.length} new content items...`);
      
      // Insert only new content
      const { data, error } = await supabase
        .from('content')
        .insert(newContent)
        .select();

      if (error) {
        console.error('❌ Error inserting content:', error);
        return;
      }

      console.log(`✅ Successfully added ${data.length} new content items`);
    } else {
      // Insert all content
      const { data, error } = await supabase
        .from('content')
        .insert(allContent)
        .select();

      if (error) {
        console.error('❌ Error inserting content:', error);
        return;
      }

      console.log(`✅ Successfully added ${data.length} content items`);
    }
    
    console.log('\n📋 About page content breakdown:');
    console.log(`   - Impact Section: ${impactContent.length} items`);
    console.log(`   - What We Do Section: ${whatWeDoContent.length} items`);
    console.log(`   - Programs Section: ${programsContent.length} items`);
    console.log(`   - Contact Additional: ${contactAdditionalContent.length} items`);
    
    console.log('\n🔧 You can now edit this content through the admin console.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
addAboutPageContent(); 