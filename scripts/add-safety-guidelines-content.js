import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const items = [
  { page: 'events', section: 'safety', key: 'guidelines_title', value: 'Volunteer Safety Guidelines', language_code: 'en' },
  { page: 'events', section: 'safety', key: 'guidelines_subtitle', value: "Please review and accept these safety guidelines before participating in volunteer events:", language_code: 'en' },
  { page: 'events', section: 'safety', key: 'guideline_1', value: "Never go alone - always volunteer with a friend or group member", language_code: 'en' },
  { page: 'events', section: 'safety', key: 'guideline_2', value: "Tell someone where you're going and when you expect to return", language_code: 'en' },
  { page: 'events', section: 'safety', key: 'guideline_3', value: "Keep your phone charged and with you at all times", language_code: 'en' },
  { page: 'events', section: 'safety', key: 'guideline_4', value: "Follow all instructions from event organizers and site supervisors", language_code: 'en' },
  { page: 'events', section: 'safety', key: 'guideline_5', value: "Report any safety concerns immediately to the event coordinator", language_code: 'en' },
  { page: 'events', section: 'safety', key: 'guideline_6', value: "Wear appropriate clothing and footwear for the activity", language_code: 'en' },
  { page: 'events', section: 'safety', key: 'guideline_7', value: "Stay hydrated and take breaks when needed", language_code: 'en' },
  { page: 'events', section: 'safety', key: 'accept_button', value: 'I Accept and Understand', language_code: 'en' },
  { page: 'events', section: 'safety', key: 'cancel_button', value: 'Cancel', language_code: 'en' },
  { page: 'events', section: 'safety', key: 'opportunities_limit', value: "Browse below and join up to 2 opportunities.", language_code: 'en' }
];

async function seedSafety() {
  console.log('🚀 Seeding safety guidelines content...');

  for (const item of items) {
    const { error } = await supabase
      .from('content')
      .upsert(item, { onConflict: 'page,section,key,language_code' });

    if (error) {
      console.error('❌ Failed to upsert', item.key, error.message);
      process.exit(1);
    }
  }

  console.log(`✅ Seeded ${items.length} safety guideline items.`);
}

seedSafety();


