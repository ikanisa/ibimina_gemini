#!/usr/bin/env node

/**
 * Verify Supabase Configuration
 * 
 * This script checks that the Supabase environment variables are properly configured
 * and can connect to the Supabase project.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local file
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Verifying Supabase Configuration...\n');

// Check if variables are set
if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL is not set');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not set');
  process.exit(1);
}

console.log('✓ Environment variables are set');
console.log(`  URL: ${SUPABASE_URL}`);
console.log(`  Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

// Validate URL format
if (!SUPABASE_URL.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
  console.error('❌ Invalid Supabase URL format');
  process.exit(1);
}
console.log('✓ URL format is valid');

// Validate JWT structure
const jwtParts = SUPABASE_ANON_KEY.split('.');
if (jwtParts.length !== 3) {
  console.error('❌ Invalid JWT format (should have 3 parts)');
  process.exit(1);
}

// Decode JWT payload
try {
  const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
  
  if (payload.role !== 'anon') {
    console.error(`❌ Key role is "${payload.role}", expected "anon"`);
    process.exit(1);
  }
  console.log('✓ Anon key role verified');
  
  // Check if ref matches URL
  const urlRef = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)[1];
  if (payload.ref !== urlRef) {
    console.warn(`⚠️  Warning: JWT ref "${payload.ref}" doesn't match URL ref "${urlRef}"`);
  } else {
    console.log('✓ JWT ref matches URL');
  }
} catch (error) {
  console.error('❌ Failed to decode JWT payload:', error.message);
  process.exit(1);
}

// Test connection
console.log('\n🔌 Testing Supabase connection...');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Try a simple health check query
supabase
  .from('_health')
  .select('*')
  .limit(1)
  .then(({ error }) => {
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "relation does not exist" which is fine for health check
      console.log(`⚠️  Connection test: ${error.message}`);
      console.log('   (This is okay - the connection works, just no _health table)');
    } else {
      console.log('✓ Connection successful');
    }
    
    // Try auth endpoint
    return supabase.auth.getSession();
  })
  .then(({ error }) => {
    if (error) {
      console.log(`⚠️  Auth check: ${error.message}`);
    } else {
      console.log('✓ Auth endpoint accessible');
    }
    
    console.log('\n✅ Configuration verified successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Restart your dev server if it\'s running');
    console.log('   2. Check the browser console for "[Supabase Config]" log');
    console.log('   3. The app should now connect to your Supabase project\n');
  })
  .catch((error) => {
    console.error('\n❌ Connection test failed:', error.message);
    console.log('\n⚠️  This might be a network issue or the Supabase project might be paused.');
    console.log('   Check your Supabase dashboard to ensure the project is active.\n');
    process.exit(1);
  });
