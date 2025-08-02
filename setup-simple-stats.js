import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSimpleStats() {
  try {
    console.log('🚀 Setting up simple site statistics...');

    // Step 1: Check if site_stats table exists
    console.log('1. Checking if site_stats table exists...');
    
    const { data: testData, error: testError } = await supabase
      .from('site_stats')
      .select('count')
      .limit(1);

    if (testError && testError.code === '42P01') {
      console.log('❌ Table does not exist. Please run the SQL script in Supabase first.');
      console.log('Copy and paste the contents of create-site-stats-table.sql into your Supabase SQL Editor.');
      return;
    }

    console.log('✅ Table exists, proceeding with data setup...');

    // Step 2: Calculate current values
    console.log('2. Calculating current values...');
    
    // Calculate active volunteers
    const { data: activeVolunteers, error: avError } = await supabase
      .from('user_events')
      .select('user_id', { count: 'exact', head: true });

    const activeVolunteersCount = activeVolunteers?.length || 0;
    console.log(`Active volunteers: ${activeVolunteersCount}`);

    // Calculate hours contributed
    const { data: userEvents, error: ueError } = await supabase
      .from('user_events')
      .select(`
        event_id,
        events (
          arrival_time,
          estimated_end_time
        )
      `);

    let totalHours = 0;
    if (userEvents) {
      userEvents.forEach(ue => {
        const event = ue.events;
        if (event && event.arrival_time && event.estimated_end_time) {
          const start = new Date(event.arrival_time);
          const end = new Date(event.estimated_end_time);
          const hours = Math.ceil((end - start) / (1000 * 60 * 60));
          totalHours += hours;
        } else {
          totalHours += 2; // Default 2 hours
        }
      });
    }
    console.log(`Hours contributed: ${totalHours}`);

    // Calculate partner organizations
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('organization_id');

    const uniqueOrganizations = new Set();
    if (events) {
      events.forEach(event => {
        if (event.organization_id) {
          uniqueOrganizations.add(event.organization_id);
        }
      });
    }
    const partnerOrganizationsCount = uniqueOrganizations.size;
    console.log(`Partner organizations: ${partnerOrganizationsCount}`);

    // Step 3: Insert or update statistics
    console.log('3. Setting up statistics data...');
    
    const statistics = [
      {
        stat_type: 'active_volunteers',
        calculated_value: activeVolunteersCount,
        manual_override: null,
        confirmed_total: 2500,
        current_estimate: 2500
      },
      {
        stat_type: 'hours_contributed',
        calculated_value: totalHours,
        manual_override: null,
        confirmed_total: 15000,
        current_estimate: 15000
      },
      {
        stat_type: 'partner_organizations',
        calculated_value: partnerOrganizationsCount,
        manual_override: null,
        confirmed_total: 50,
        current_estimate: 50
      }
    ];

    // Try to insert the statistics
    const { data: insertData, error: insertError } = await supabase
      .from('site_stats')
      .upsert(statistics, { 
        onConflict: 'stat_type',
        ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
      console.log('Insert error:', insertError.message);
      
      // Try individual inserts
      for (const stat of statistics) {
        const { error: singleError } = await supabase
          .from('site_stats')
          .upsert(stat, { onConflict: 'stat_type' });
        
        if (singleError) {
          console.log(`Error inserting ${stat.stat_type}:`, singleError.message);
        } else {
          console.log(`✅ Inserted ${stat.stat_type}`);
        }
      }
    } else {
      console.log('✅ All statistics inserted/updated successfully');
    }

    // Step 4: Test the final result
    console.log('4. Testing final result...');
    const { data: finalStats, error: finalError } = await supabase
      .from('site_stats')
      .select('*')
      .order('stat_type');

    if (finalError) {
      console.error('❌ Error fetching final stats:', finalError);
    } else {
      console.log('✅ Final statistics:');
      finalStats.forEach(stat => {
        const displayValue = stat.manual_override !== null ? stat.manual_override : stat.calculated_value;
        console.log(`  ${stat.stat_type}:`);
        console.log(`    Calculated: ${stat.calculated_value}`);
        console.log(`    Manual Override: ${stat.manual_override || 'None'}`);
        console.log(`    Display Value: ${displayValue}`);
      });
    }

    console.log('🎉 Simple site statistics setup completed successfully!');
    console.log('The admin dashboard should now work without errors.');

  } catch (error) {
    console.error('❌ Error setting up simple site statistics:', error);
  }
}

// Run the setup
setupSimpleStats(); 