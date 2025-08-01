import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateSiteStats() {
  try {
    // Check if data already exists
    const { data: existingData, error: checkError } = await supabase
      .from('site_stats')
      .select('*');

    if (checkError) {
      console.error('Error checking existing data:', checkError);
      return;
    }

    if (existingData && existingData.length > 0) {
      console.log('Site stats already populated:', existingData);
      return;
    }

    // Insert default statistics
    const defaultStats = [
      { stat_type: 'active_volunteers', confirmed_total: 2500, current_estimate: 2500 },
      { stat_type: 'hours_contributed', confirmed_total: 5000, current_estimate: 5000 },
      { stat_type: 'partner_organizations', confirmed_total: 50, current_estimate: 50 }
    ];

    const { data, error } = await supabase
      .from('site_stats')
      .insert(defaultStats)
      .select();

    if (error) {
      console.error('Error inserting statistics:', error);
    } else {
      console.log('Successfully populated site stats:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

populateSiteStats();