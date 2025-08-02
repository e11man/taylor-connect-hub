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

// Site Statistics Content - Single source of truth
const siteStatisticsContent = [
  { page: 'site_stats', section: 'main', key: 'active_volunteers', value: '2,500+', language_code: 'en' },
  { page: 'site_stats', section: 'main', key: 'hours_contributed', value: '15,000+', language_code: 'en' },
  { page: 'site_stats', section: 'main', key: 'partner_organizations', value: '50+', language_code: 'en' },
];

async function updateStatisticsStructure() {
  console.log('🚀 Starting to restructure statistics...');
  
  try {
    // First, get current statistics values from homepage and about page
    const { data: existingStats, error: fetchError } = await supabase
      .from('content')
      .select('page, section, key, value')
      .in('key', ['active_volunteers', 'hours_contributed', 'partner_organizations']);

    if (fetchError) {
      console.error('❌ Error fetching existing statistics:', fetchError);
      return;
    }

    // Get the most recent values (prefer homepage over about page)
    let currentValues = {
      active_volunteers: '2,500+',
      hours_contributed: '15,000+',
      partner_organizations: '50+'
    };

    if (existingStats && existingStats.length > 0) {
      // Find homepage values first, then about page values
      const homepageStats = existingStats.filter(stat => stat.page === 'homepage');
      const aboutStats = existingStats.filter(stat => stat.page === 'about');
      
      // Use homepage values if available, otherwise about page values
      const sourceStats = homepageStats.length > 0 ? homepageStats : aboutStats;
      
      sourceStats.forEach(stat => {
        currentValues[stat.key] = stat.value;
      });
    }

    console.log('📊 Current statistics values:', currentValues);

    // Delete existing statistics content
    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .in('key', ['active_volunteers', 'hours_contributed', 'partner_organizations']);

    if (deleteError) {
      console.error('❌ Error deleting existing statistics content:', deleteError);
      return;
    }

    // Create new site_stats content with current values
    const newSiteStatsContent = [
      { page: 'site_stats', section: 'main', key: 'active_volunteers', value: currentValues.active_volunteers, language_code: 'en' },
      { page: 'site_stats', section: 'main', key: 'hours_contributed', value: currentValues.hours_contributed, language_code: 'en' },
      { page: 'site_stats', section: 'main', key: 'partner_organizations', value: currentValues.partner_organizations, language_code: 'en' },
    ];

    // Insert new site_stats content
    const { data, error } = await supabase
      .from('content')
      .insert(newSiteStatsContent)
      .select();

    if (error) {
      console.error('❌ Error inserting site_stats content:', error);
      return;
    }

    console.log(`✅ Successfully restructured statistics:`);
    console.log(`   - Created site_stats page with 3 statistics items`);
    console.log(`   - Removed duplicate statistics from homepage and about page`);
    console.log(`   - Preserved current values:`, currentValues);
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Update ImpactSection and HeroSection to use site_stats');
    console.log('   2. Add site statistics editing to the Stats tab in admin console');
    console.log('   3. Remove statistics from general content management');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
updateStatisticsStructure(); 