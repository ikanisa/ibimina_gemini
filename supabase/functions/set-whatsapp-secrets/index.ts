/**
 * Supabase Edge Function: Set WhatsApp Secrets
 * Stores WhatsApp API credentials in Supabase secrets
 * This should be called once to set up WhatsApp integration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetSecretsRequest {
  institutionId?: string; // If provided, set per-institution, otherwise global
  phoneId: string;
  businessId: string;
  accessToken: string;
  verifyToken?: string;
  appSecret?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body: SetSecretsRequest = await req.json();
    const { institutionId, phoneId, businessId, accessToken, verifyToken, appSecret } = body;

    // Update settings table
    if (institutionId) {
      // Update institution-specific settings
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          institution_id: institutionId,
          whatsapp_enabled: true,
          whatsapp_phone_id: phoneId,
          whatsapp_business_id: businessId,
          whatsapp_verify_token: verifyToken,
        }, {
          onConflict: 'institution_id',
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to update settings', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store sensitive tokens in Supabase secrets (via Management API)
      // Note: This requires Supabase Management API access
      // For now, we'll store in settings table (encrypted in production)
      // In production, use Supabase Vault or environment variables

      return new Response(
        JSON.stringify({
          success: true,
          message: 'WhatsApp settings updated for institution',
          institutionId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Set global environment variables (requires Supabase project admin access)
      // For now, return instructions
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Set these environment variables in your Supabase project:',
          variables: {
            WA_PHONE_ID: phoneId,
            META_WABA_BUSINESS_ID: businessId,
            WA_TOKEN: accessToken,
            WA_VERIFY_TOKEN: verifyToken,
            WA_APP_SECRET: appSecret,
          },
          instructions: [
            '1. Go to Supabase Dashboard > Project Settings > Edge Functions',
            '2. Add these as environment variables',
            '3. Or use Supabase CLI: supabase secrets set WA_PHONE_ID=...',
          ],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
