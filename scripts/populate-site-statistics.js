import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateSiteStatistics() {
  try {
    console.log('🚀 Starting site statistics population...');

    // First, let's check if the site_stats table exists and has the right structure
    console.log('📊 Checking site_stats table structure...');
    
    const { data: existingStats, error: checkError } = await supabase
      .from('site_stats')
      .select('*');

    if (checkError) {
      console.error('Error checking site_stats table:', checkError);
      return;
    }

    console.log(`Found ${existingStats?.length || 0} existing statistics`);

    // Define the statistics we want to populate
    const statistics = [
      {
        stat_type: 'active_volunteers',
        calculated_value: 0,
        manual_override: null,
        confirmed_total: 2500,
        current_estimate: 2500
      },
      {
        stat_type: 'hours_contributed',
        calculated_value: 0,
        manual_override: null,
        confirmed_total: 15000,
        current_estimate: 15000
      },
      {
        stat_type: 'partner_organizations',
        calculated_value: 0,
        manual_override: null,
        confirmed_total: 50,
        current_estimate: 50
      }
    ];

    // Upsert the statistics
    console.log('📝 Upserting site statistics...');
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('site_stats')
      .upsert(statistics, { 
        onConflict: 'stat_type',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error('Error upserting statistics:', upsertError);
      return;
    }

    console.log('✅ Successfully upserted statistics:', upsertData);

    // Now let's trigger the calculation to get real values
    console.log('🔄 Triggering statistics calculation...');
    
    const { data: calcData, error: calcError } = await supabase
      .rpc('update_site_statistics');

    if (calcError) {
      console.error('Error calculating statistics:', calcError);
      return;
    }

    console.log('✅ Statistics calculation completed');

    // Get the final statistics
    console.log('📊 Fetching final statistics...');
    
    const { data: finalStats, error: finalError } = await supabase
      .rpc('get_all_site_statistics');

    if (finalError) {
      console.error('Error fetching final statistics:', finalError);
      return;
    }

    console.log('🎉 Final site statistics:');
    finalStats.forEach(stat => {
      console.log(`  ${stat.stat_type}:`);
      console.log(`    Calculated: ${stat.calculated_value}`);
      console.log(`    Manual Override: ${stat.manual_override || 'None'}`);
      console.log(`    Display Value: ${stat.display_value}`);
      console.log(`    Last Calculated: ${stat.last_calculated_at}`);
    });

    console.log('✅ Site statistics population completed successfully!');

  } catch (error) {
    console.error('❌ Error populating site statistics:', error);
  }
}

// Run the script
populateSiteStatistics(); 