/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Script to set WhatsApp secrets in Supabase
 * Run this once to configure WhatsApp integration
 * 
 * Usage: deno run --allow-net --allow-env scripts/set-whatsapp-secrets.ts
 * NOTE: This script is intended to run with Deno, not Node.js
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-expect-error - Deno global not available in Node.js
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
// @ts-expect-error - Deno global not available in Node.js
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// WhatsApp credentials from environment or hardcoded
// @ts-expect-error - Deno global not available in Node.js
const WA_PHONE_ID = Deno.env.get('WA_PHONE_ID') || '396791596844039';
// @ts-expect-error - Deno global not available in Node.js
const META_WABA_BUSINESS_ID = Deno.env.get('META_WABA_BUSINESS_ID') || '297687286772462';
// @ts-expect-error - Deno global not available in Node.js
const WA_TOKEN = Deno.env.get('WA_TOKEN') || Deno.env.get('WHATSAPP_ACCESS_TOKEN') || 'EAAGHrMn6uugBO9xlSTNU1FsbnZB7AnBLCvTlgZCYQDZC8OZA7q3nrtxpxn3VgHiT8o9KbKQIyoPNrESHKZCq2c9B9lvNr2OsT8YDBewaDD1OzytQd74XlmSOgxZAVL6TEQpDT43zZCZBwQg9AZA5QPeksUVzmAqTaoNyIIaaqSvJniVmn6dW1rw88dbZAyR6VZBMTTpjQZDZD';
// @ts-expect-error - Deno global not available in Node.js
const WA_VERIFY_TOKEN = Deno.env.get('WA_VERIFY_TOKEN') || 'bd0e7b6f4a2c9d83f1e57a0c6b3d48e9';
// @ts-expect-error - Deno global not available in Node.js
const WA_APP_SECRET = Deno.env.get('WA_APP_SECRET') || 'e0b171d137e058e9055ae61bb94e0984';

async function setWhatsAppSecrets() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    // @ts-expect-error - Deno global not available in Node.js
    Deno.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('Setting WhatsApp secrets...');

  // Get all institutions
  const { data: institutions, error: instError } = await supabase
    .from('institutions')
    .select('id, name');

  if (instError) {
    console.error('Error fetching institutions:', instError);
    // @ts-expect-error - Deno global not available in Node.js
    Deno.exit(1);
  }

  if (!institutions || institutions.length === 0) {
    console.log('No institutions found. Creating default settings...');
  } else {
    // Update settings for each institution
    for (const institution of institutions) {
      const { error } = await supabase
        .from('settings')
        .upsert({
          institution_id: institution.id,
          whatsapp_enabled: true,
          whatsapp_phone_id: WA_PHONE_ID,
          whatsapp_business_id: META_WABA_BUSINESS_ID,
          whatsapp_verify_token: WA_VERIFY_TOKEN,
        }, {
          onConflict: 'institution_id',
        })
        .select()
        .single();

      if (error) {
        console.error(`Error updating settings for ${institution.name}:`, error);
      } else {
        console.log(`✓ Updated WhatsApp settings for ${institution.name}`);
      }

      // Seed notification templates
      const { error: templateError } = await supabase.rpc('seed_notification_templates', {
        p_institution_id: institution.id,
      });

      if (templateError) {
        console.error(`Error seeding templates for ${institution.name}:`, templateError);
      } else {
        console.log(`✓ Seeded notification templates for ${institution.name}`);
      }
    }
  }

  console.log('\n✓ WhatsApp secrets configured!');
  console.log('\nNote: For Edge Functions, set these as environment variables:');
  console.log(`  WA_PHONE_ID=${WA_PHONE_ID}`);
  console.log(`  META_WABA_BUSINESS_ID=${META_WABA_BUSINESS_ID}`);
  console.log(`  WA_TOKEN=${WA_TOKEN.substring(0, 20)}...`);
  console.log(`  WA_VERIFY_TOKEN=${WA_VERIFY_TOKEN}`);
  console.log(`  WA_APP_SECRET=${WA_APP_SECRET.substring(0, 20)}...`);
  console.log('\nTo set in Supabase Dashboard:');
  console.log('  1. Go to Project Settings > Edge Functions');
  console.log('  2. Add these as environment variables');
  console.log('  3. Or use Supabase CLI: supabase secrets set WA_PHONE_ID=...');
}

// Run the script
setWhatsAppSecrets().catch((error) => {
  console.error('Fatal error:', error);
  // @ts-expect-error - Deno global not available in Node.js
  Deno.exit(1);
});
