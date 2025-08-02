import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emJqaWZtcnd2cWJrd2J5dmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDI1NDUsImV4cCI6MjA2ODg3ODU0NX0.vf4y-DvpEemwUJiqguqI1ot-g0LrlpQZbhW0tIEs03o';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSiteStatsTable() {
  try {
    console.log('🚀 Creating site_stats table...');

    // First, let's check if the table exists by trying to query it
    const { data: testQuery, error: testError } = await supabase
      .from('site_stats')
      .select('count')
      .limit(1);

    if (testError && testError.code === '42P01') {
      console.log('Table does not exist, creating it...');
      
      // Since we can't create tables directly via the client, let's try to insert data
      // and see if it creates the table automatically or gives us a better error
      const { data: insertData, error: insertError } = await supabase
        .from('site_stats')
        .insert({
          stat_type: 'active_volunteers',
          calculated_value: 0,
          manual_override: null,
          confirmed_total: 2500,
          current_estimate: 2500
        })
        .select();

      if (insertError) {
        console.log('Insert error:', insertError.message);
        console.log('You need to create the site_stats table manually in the Supabase dashboard.');
        console.log('Please run the following SQL in the Supabase SQL Editor:');
        console.log(`
-- Create site_stats table
CREATE TABLE IF NOT EXISTS public.site_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_type TEXT NOT NULL UNIQUE,
  calculated_value INTEGER NOT NULL DEFAULT 0,
  manual_override INTEGER,
  confirmed_total INTEGER NOT NULL DEFAULT 0,
  current_estimate INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read site statistics" 
ON public.site_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update site statistics" 
ON public.site_stats 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

-- Insert initial data
INSERT INTO public.site_stats (stat_type, calculated_value, manual_override, confirmed_total, current_estimate) VALUES
  ('active_volunteers', 0, NULL, 2500, 2500),
  ('hours_contributed', 0, NULL, 15000, 15000),
  ('partner_organizations', 0, NULL, 50, 50)
ON CONFLICT (stat_type) DO NOTHING;
        `);
        return;
      } else {
        console.log('✅ Table created and data inserted successfully');
      }
    } else if (testError) {
      console.log('Other error:', testError.message);
    } else {
      console.log('✅ Table already exists');
    }

    // Now let's populate the table with data
    console.log('📊 Populating site_stats table...');
    
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

    // Calculate current values
    console.log('🧮 Calculating current values...');
    
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

    // Update the calculated values
    console.log('📝 Updating calculated values...');
    
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

    // Test the final result
    console.log('🧪 Testing final result...');
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

    console.log('🎉 Site statistics setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up site statistics:', error);
  }
}

// Run the setup
createSiteStatsTable(); 