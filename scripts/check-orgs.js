import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrganizations() {
  console.log('Checking organizations...');
  
  const { data, error } = await supabase
    .from('organizations')
    .select('*');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Organizations found:', data.length);
  data.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name} (${org.contact_email}) - Status: ${org.status}`);
  });
}

checkOrganizations();