import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Database connection
const supabaseUrl = 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emJqaWZtcnd2cWJrd2J5dmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDI1NDUsImV4cCI6MjA2ODg3ODU0NX0.vf4y-DvpEemwUJiqguqI1ot-g0LrlpQZbhW0tIEs03o';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to get all content from database
async function getAllContent() {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .order('page', { ascending: true });

  if (error) {
    console.error('Error fetching content:', error);
    return [];
  }

  return data || [];
}

// Function to find and replace static content in a file
function updateFileContent(filePath, contentMap) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Replace hardcoded strings with DynamicText components
    for (const [key, contentInfo] of contentMap.entries()) {
      const escapedValue = contentInfo.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`"${escapedValue}"`, 'g');
      
      if (regex.test(content)) {
        const dynamicText = `<DynamicText page="${contentInfo.page}" section="${contentInfo.section}" contentKey="${contentInfo.contentKey}" fallback="${contentInfo.value}" />`;
        content = content.replace(regex, dynamicText);
        updated = true;
        console.log(`✓ Updated ${filePath}: "${contentInfo.value}" -> DynamicText`);
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
    return false;
  }
}

// Function to process all TypeScript/React files
async function processAllFiles() {
  console.log('Starting to update components to use dynamic content...');
  
  // Get all content from database
  const allContent = await getAllContent();
  console.log(`Found ${allContent.length} content items in database`);

  // Create a map for quick lookup
  const contentMap = new Map();
  for (const item of allContent) {
    const key = `${item.page}.${item.section}.${item.key}`;
    contentMap.set(key, {
      page: item.page,
      section: item.section,
      contentKey: item.key,
      value: item.value
    });
  }

  // Define directories to process
  const directories = [
    'src/components',
    'src/pages',
    'src/sections'
  ];

  let totalFiles = 0;
  let updatedFiles = 0;

  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;

    const files = getAllFiles(dir, ['.tsx', '.ts']);
    
    for (const file of files) {
      totalFiles++;
      const wasUpdated = updateFileContent(file, contentMap);
      if (wasUpdated) {
        updatedFiles++;
      }
    }
  }

  console.log(`\nProcessing completed!`);
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Files updated: ${updatedFiles}`);
}

// Helper function to get all files recursively
function getAllFiles(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Run the script
processAllFiles().catch(console.error);
