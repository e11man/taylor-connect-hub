import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleContent = [
  // About Page - Hero Section
  {
    page: 'about',
    section: 'hero',
    key: 'titleLine1',
    value: 'Make the',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'hero',
    key: 'titleLine2',
    value: 'Connection',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'hero',
    key: 'subtitle',
    value: 'Connect with meaningful opportunities that create lasting impact in Upland.',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'hero',
    key: 'ctaButton',
    value: 'Get Started',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'hero',
    key: 'secondaryButton',
    value: 'Learn More',
    language_code: 'en'
  },

  // About Page - Mission Section
  {
    page: 'about',
    section: 'mission',
    key: 'title',
    value: 'Our Mission',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'mission',
    key: 'description',
    value: 'We connect students with local organizations to create meaningful volunteer opportunities that benefit both the community and personal growth.',
    language_code: 'en'
  },

  // About Page - Features Section
  {
    page: 'about',
    section: 'features',
    key: 'title',
    value: 'Why Choose Us',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'features',
    key: 'feature1Title',
    value: 'Easy Connection',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'features',
    key: 'feature1Description',
    value: 'Find and sign up for volunteer opportunities with just a few clicks.',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'features',
    key: 'feature2Title',
    value: 'Local Impact',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'features',
    key: 'feature2Description',
    value: 'Make a difference right here in Upland and surrounding communities.',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'features',
    key: 'feature3Title',
    value: 'Personal Growth',
    language_code: 'en'
  },
  {
    page: 'about',
    section: 'features',
    key: 'feature3Description',
    value: 'Develop skills, build relationships, and gain valuable experience.',
    language_code: 'en'
  },

  // Home Page - Hero Section
  {
    page: 'home',
    section: 'hero',
    key: 'title',
    value: 'Connect. Serve. Grow.',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'hero',
    key: 'subtitle',
    value: 'Join our community of volunteers making a difference in Upland.',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'hero',
    key: 'ctaButton',
    value: 'Find Opportunities',
    language_code: 'en'
  },

  // Home Page - Stats Section
  {
    page: 'home',
    section: 'stats',
    key: 'title',
    value: 'Our Impact',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'stats',
    key: 'stat1Number',
    value: '500+',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'stats',
    key: 'stat1Label',
    value: 'Volunteers',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'stats',
    key: 'stat2Number',
    value: '50+',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'stats',
    key: 'stat2Label',
    value: 'Organizations',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'stats',
    key: 'stat3Number',
    value: '1000+',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'stats',
    key: 'stat3Label',
    value: 'Hours Served',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'stats',
    key: 'stat4Number',
    value: '25+',
    language_code: 'en'
  },
  {
    page: 'home',
    section: 'stats',
    key: 'stat4Label',
    value: 'Events',
    language_code: 'en'
  },

  // Contact Page - Header Section
  {
    page: 'contact',
    section: 'header',
    key: 'title',
    value: 'Get In Touch',
    language_code: 'en'
  },
  {
    page: 'contact',
    section: 'header',
    key: 'subtitle',
    value: 'We\'d love to hear from you and help you get involved.',
    language_code: 'en'
  },

  // Contact Page - Info Section
  {
    page: 'contact',
    section: 'info',
    key: 'title',
    value: 'Contact Information',
    language_code: 'en'
  },
  {
    page: 'contact',
    section: 'info',
    key: 'addressTitle',
    value: 'Address',
    language_code: 'en'
  },
  {
    page: 'contact',
    section: 'info',
    key: 'address',
    value: '236 West Reade Avenue, Upland, IN 46989',
    language_code: 'en'
  },
  {
    page: 'contact',
    section: 'info',
    key: 'contactTitle',
    value: 'Contact',
    language_code: 'en'
  },
  {
    page: 'contact',
    section: 'info',
    key: 'email',
    value: 'volunteer@taylor.edu',
    language_code: 'en'
  },
  {
    page: 'contact',
    section: 'info',
    key: 'phone',
    value: '(765) 998-5111',
    language_code: 'en'
  }
];

async function populateSampleContent() {
  console.log('Starting to populate sample content...');

  try {
    // First, let's check if content already exists
    const { data: existingContent, error: checkError } = await supabase
      .from('content')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing content:', checkError);
      return;
    }

    if (existingContent && existingContent.length > 0) {
      console.log('Content already exists. Skipping population.');
      return;
    }

    // Insert sample content
    const { data, error } = await supabase
      .from('content')
      .insert(sampleContent)
      .select();

    if (error) {
      console.error('Error inserting sample content:', error);
      return;
    }

    console.log(`Successfully inserted ${data.length} content items!`);
    console.log('Sample content includes:');
    console.log('- About page (hero, mission, features sections)');
    console.log('- Home page (hero, stats sections)');
    console.log('- Contact page (header, info sections)');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

populateSampleContent(); 