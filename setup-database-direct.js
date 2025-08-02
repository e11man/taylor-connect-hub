import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up site statistics database functions...');

    // Step 1: Check if site_stats table exists and add columns
    console.log('1. Checking site_stats table...');
    
    // First, let's check what's in the site_stats table
    const { data: existingStats, error: checkError } = await supabase
      .from('site_stats')
      .select('*');

    if (checkError) {
      console.log('Error checking site_stats table:', checkError.message);
    } else {
      console.log(`Found ${existingStats?.length || 0} existing statistics`);
      if (existingStats && existingStats.length > 0) {
        console.log('Existing stats:', existingStats);
      }
    }

    // Step 2: Insert or update the statistics with the new structure
    console.log('2. Setting up statistics with new structure...');
    
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
    } else {
      console.log('✅ Statistics inserted/updated successfully');
    }

    // Step 3: Calculate current values
    console.log('3. Calculating current values...');
    
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

    // Step 4: Update the calculated values
    console.log('4. Updating calculated values...');
    
    const updates = [
      {
        stat_type: 'active_volunteers',
        calculated_value: activeVolunteersCount
      },
      {
        stat_type: 'hours_contributed',
        calculated_value: totalHours
      },
      {
        stat_type: 'partner_organizations',
        calculated_value: partnerOrganizationsCount
      }
    ];

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('site_stats')
        .update({ 
          calculated_value: update.calculated_value,
          last_calculated_at: new Date().toISOString()
        })
        .eq('stat_type', update.stat_type);

      if (updateError) {
        console.log(`Error updating ${update.stat_type}:`, updateError.message);
      } else {
        console.log(`✅ Updated ${update.stat_type}: ${update.calculated_value}`);
      }
    }

    // Step 5: Test the final result
    console.log('5. Testing final result...');
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

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

// Run the setup
setupDatabase(); 