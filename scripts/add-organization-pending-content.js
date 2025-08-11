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

// Organization Pending Approval page content
const page = 'organizationPendingApproval';
const section = 'main';

const contentItems = [
  { page, section, key: 'title', value: 'Registration Submitted Successfully!', language_code: 'en' },
  { page, section, key: 'statusBadge', value: 'Pending Admin Approval', language_code: 'en' },
  { page, section, key: 'subtitle', value: 'Thank you for submitting your organization registration!', language_code: 'en' },
  { page, section, key: 'description', value: 'Your application is currently under review by our administrative team. We will notify you via email once your organization has been approved and you can begin using the platform.', language_code: 'en' },
  { page, section, key: 'nextStepsTitle', value: 'What happens next?', language_code: 'en' },
  { page, section, key: 'step1', value: 'Our admin team will review your organization details and credentials', language_code: 'en' },
  { page, section, key: 'step2', value: "You'll receive an email notification when your application is approved", language_code: 'en' },
  { page, section, key: 'step3', value: 'Once approved, you can log in and start creating events for the community', language_code: 'en' },
  { page, section, key: 'timelineTitle', value: 'Typical Review Timeline', language_code: 'en' },
  { page, section, key: 'timelineDescription', value: 'Most organization applications are reviewed within 2-3 business days. During peak periods, it may take up to 5 business days.', language_code: 'en' },
  { page, section, key: 'contactButton', value: 'Contact Support', language_code: 'en' },
  { page, section, key: 'homeButton', value: 'Return Home', language_code: 'en' },
  { page, section, key: 'additionalInfo', value: 'Questions about your application status?', language_code: 'en' },
  { page, section, key: 'supportEmail', value: 'support@example.com', language_code: 'en' },
  { page, section, key: 'supportPhone', value: '(555) 123-4567', language_code: 'en' },
];

async function addOrganizationPendingContent() {
  console.log('🚀 Adding Organization Pending Approval page content...');

  try {
    // Fetch existing keys for this page/section to avoid duplicates
    const { data: existing, error: fetchError } = await supabase
      .from('content')
      .select('section,key')
      .eq('page', page)
      .eq('section', section)
      .eq('language_code', 'en');

    if (fetchError) {
      console.error('❌ Error reading existing content:', fetchError);
      process.exit(1);
    }

    const existingKeys = new Set((existing || []).map((row) => row.key));
    const itemsToInsert = contentItems.filter((item) => !existingKeys.has(item.key));

    if (itemsToInsert.length === 0) {
      console.log('✅ All Organization Pending Approval content already exists. Nothing to insert.');
      return;
    }

    console.log(`📝 Inserting ${itemsToInsert.length} new content items...`);
    const { data, error } = await supabase
      .from('content')
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error('❌ Error inserting content:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully inserted ${data?.length ?? 0} items.`);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

addOrganizationPendingContent();


