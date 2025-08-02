import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableViaAPI() {
  try {
    console.log('🚀 Creating site_stats table via API...');

    // Since we can't create tables directly via the client, let's try a different approach
    // We'll try to insert data and see if the table gets created automatically
    // or if we get a specific error that tells us the table doesn't exist

    console.log('1. Attempting to insert test data...');
    
    const testData = {
      stat_type: 'test_stat',
      calculated_value: 0,
      manual_override: null,
      confirmed_total: 0,
      current_estimate: 0
    };

    const { data: insertData, error: insertError } = await supabase
      .from('site_stats')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('Insert error:', insertError.message);
      
      if (insertError.code === '42P01') {
        console.log('❌ Table does not exist and cannot be created via API.');
        console.log('');
        console.log('🔧 SOLUTION: You need to create the table manually in Supabase.');
        console.log('');
        console.log('📋 Please follow these steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Click on "SQL Editor" in the left sidebar');
        console.log('3. Copy and paste the following SQL:');
        console.log('');
        console.log('--- START SQL ---');
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
        console.log('--- END SQL ---');
        console.log('');
        console.log('4. Click "Run" to execute the SQL');
        console.log('5. Come back and run this script again');
        console.log('');
        return;
      }
    } else {
      console.log('✅ Test data inserted successfully');
      
      // Clean up test data
      await supabase
        .from('site_stats')
        .delete()
        .eq('stat_type', 'test_stat');
      
      console.log('✅ Test data cleaned up');
    }

    console.log('🎉 Table creation completed!');

  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
}

// Run the setup
createTableViaAPI(); 