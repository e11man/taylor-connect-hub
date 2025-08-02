import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set the environment variable and try again.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up site statistics database functions...');

    // Step 1: Add columns to site_stats table
    console.log('1. Adding columns to site_stats table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.site_stats 
        ADD COLUMN IF NOT EXISTS calculated_value INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS manual_override INTEGER,
        ADD COLUMN IF NOT EXISTS last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
      `
    });
    
    if (alterError) {
      console.log('Alter table result:', alterError.message);
    } else {
      console.log('✅ Columns added successfully');
    }

    // Step 2: Create calculation functions
    console.log('2. Creating calculation functions...');
    
    const functions = [
      {
        name: 'calculate_active_volunteers',
        sql: `
          CREATE OR REPLACE FUNCTION public.calculate_active_volunteers()
          RETURNS INTEGER
          LANGUAGE sql
          STABLE SECURITY DEFINER
          AS $$
            SELECT COUNT(DISTINCT user_id)::INTEGER
            FROM public.user_events;
          $$;
        `
      },
      {
        name: 'calculate_hours_contributed',
        sql: `
          CREATE OR REPLACE FUNCTION public.calculate_hours_contributed()
          RETURNS INTEGER
          LANGUAGE sql
          STABLE SECURITY DEFINER
          AS $$
            SELECT COALESCE(SUM(
              CASE 
                WHEN e.arrival_time IS NOT NULL AND e.estimated_end_time IS NOT NULL THEN
                  CEILING(EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600)
                ELSE 2
              END
            ), 0)::INTEGER
            FROM public.user_events ue
            JOIN public.events e ON e.id = ue.event_id;
          $$;
        `
      },
      {
        name: 'calculate_partner_organizations',
        sql: `
          CREATE OR REPLACE FUNCTION public.calculate_partner_organizations()
          RETURNS INTEGER
          LANGUAGE sql
          STABLE SECURITY DEFINER
          AS $$
            SELECT COUNT(DISTINCT organization_id)::INTEGER
            FROM public.events
            WHERE organization_id IS NOT NULL;
          $$;
        `
      }
    ];

    for (const func of functions) {
      const { error } = await supabase.rpc('exec_sql', { sql: func.sql });
      if (error) {
        console.log(`${func.name} result:`, error.message);
      } else {
        console.log(`✅ ${func.name} created successfully`);
      }
    }

    // Step 3: Create main update function
    console.log('3. Creating update function...');
    const updateFunction = `
      CREATE OR REPLACE FUNCTION public.update_site_statistics()
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        UPDATE public.site_stats 
        SET 
          calculated_value = public.calculate_active_volunteers(),
          last_calculated_at = now()
        WHERE stat_type = 'active_volunteers';
        
        UPDATE public.site_stats 
        SET 
          calculated_value = public.calculate_hours_contributed(),
          last_calculated_at = now()
        WHERE stat_type = 'hours_contributed';
        
        UPDATE public.site_stats 
        SET 
          calculated_value = public.calculate_partner_organizations(),
          last_calculated_at = now()
        WHERE stat_type = 'partner_organizations';
      END;
      $$;
    `;

    const { error: updateError } = await supabase.rpc('exec_sql', { sql: updateFunction });
    if (updateError) {
      console.log('Update function result:', updateError.message);
    } else {
      console.log('✅ Update function created successfully');
    }

    // Step 4: Create get_all_site_statistics function
    console.log('4. Creating get_all_site_statistics function...');
    const getAllStatsFunction = `
      CREATE OR REPLACE FUNCTION public.get_all_site_statistics()
      RETURNS TABLE(
        stat_type TEXT,
        calculated_value INTEGER,
        manual_override INTEGER,
        display_value INTEGER,
        last_calculated_at TIMESTAMP WITH TIME ZONE
      )
      LANGUAGE sql
      STABLE SECURITY DEFINER
      AS $$
        SELECT 
          stat_type,
          calculated_value,
          manual_override,
          COALESCE(manual_override, calculated_value) as display_value,
          last_calculated_at
        FROM public.site_stats
        ORDER BY stat_type;
      $$;
    `;

    const { error: getAllError } = await supabase.rpc('exec_sql', { sql: getAllStatsFunction });
    if (getAllError) {
      console.log('Get all stats function result:', getAllError.message);
    } else {
      console.log('✅ Get all stats function created successfully');
    }

    // Step 5: Initialize statistics
    console.log('5. Initializing statistics...');
    const { error: initError } = await supabase.rpc('update_site_statistics');
    if (initError) {
      console.log('Initialize result:', initError.message);
    } else {
      console.log('✅ Statistics initialized successfully');
    }

    // Step 6: Test the functions
    console.log('6. Testing functions...');
    const { data, error: testError } = await supabase.rpc('get_all_site_statistics');
    if (testError) {
      console.error('❌ Error testing functions:', testError);
    } else {
      console.log('✅ Functions working correctly:');
      console.log(data);
    }

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

// Run the setup
setupDatabase(); 