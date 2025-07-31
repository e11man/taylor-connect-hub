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

// Content data that matches what the components expect
const contentData = [
  // Homepage hero section (what HeroSection component expects)
  { page: 'homepage', section: 'hero', key: 'titleLine1', value: 'Connect.', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'titleLine2', value: 'Volunteer.', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'titleLine3', value: 'Make a Difference.', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'subtitle', value: 'Join thousands of volunteers making a positive impact in their communities. Find opportunities that match your skills and passion.', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'ctaButton', value: 'Get Started', language_code: 'en' },
  { page: 'homepage', section: 'hero', key: 'secondaryButton', value: 'Learn More', language_code: 'en' },
  
  // Homepage impact section (for the stats in HeroSection)
  { page: 'homepage', section: 'impact', key: 'volunteers_label', value: 'Active Volunteers', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'active_volunteers', value: '2,500+', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'hours_label', value: 'Hours Contributed', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'hours_contributed', value: '15,000+', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'organizations_label', value: 'Partner Organizations', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'partner_organizations', value: '50+', language_code: 'en' },
  
  // Header navigation
  { page: 'header', section: 'nav', key: 'home', value: 'Home', language_code: 'en' },
  { page: 'header', section: 'nav', key: 'about', value: 'About', language_code: 'en' },
  { page: 'header', section: 'nav', key: 'opportunities', value: 'Opportunities', language_code: 'en' },
  { page: 'header', section: 'nav', key: 'contact', value: 'Contact', language_code: 'en' },
  
  // Header brand
  { page: 'header', section: 'brand', key: 'name', value: 'Community Connect', language_code: 'en' },
  
  // Header buttons
  { page: 'header', section: 'buttons', key: 'login', value: 'Login', language_code: 'en' },
  { page: 'header', section: 'buttons', key: 'get_started', value: 'Get Started', language_code: 'en' },
];

async function seedContent() {
  console.log('Starting content seeding...');
  
  try {
    // Insert content with upsert to avoid duplicates
    const { data, error } = await supabase
      .from('content')
      .upsert(contentData, {
        onConflict: 'page,section,key,language_code',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Error seeding content:', error);
      return;
    }
    
    console.log('✅ Content seeded successfully!');
    console.log(`📝 Inserted/updated ${contentData.length} content entries`);
    
  } catch (error) {
    console.error('Failed to seed content:', error);
  }
}

// Run the seeding
seedContent();