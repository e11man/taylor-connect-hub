#!/usr/bin/env node
// Simple runner to apply the recurring events migration via Supabase SQL API if needed
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const sqlPath = path.join(__dirname, '../supabase/migrations/20250803000000_add_recurring_events.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Failed to apply migration via RPC:', error.message);
    process.exit(1);
  }
  console.log('Recurring events migration applied.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

