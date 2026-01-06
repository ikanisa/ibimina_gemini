import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// TODO: For production, replace '*' with specific allowed origins:
// const ALLOWED_ORIGINS = [
//   'https://your-production-domain.pages.dev',
//   'https://your-custom-domain.com',
// ];
// 
// function getCorsHeaders(origin: string) {
//   const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
//   return {
//     'Access-Control-Allow-Origin': allowedOrigin,
//     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//   };
// }

const mapRole = (role: string | null): string => {
  if (!role) return 'INSTITUTION_STAFF';
  switch (role) {
    case 'Super Admin':
    case 'PLATFORM_ADMIN':
      return 'PLATFORM_ADMIN';
    case 'Branch Manager':
    case 'INSTITUTION_ADMIN':
      return 'INSTITUTION_ADMIN';
    case 'Teller':
    case 'INSTITUTION_TREASURER':
      return 'INSTITUTION_TREASURER';
    case 'Auditor':
    case 'INSTITUTION_AUDITOR':
      return 'INSTITUTION_AUDITOR';
    case 'Loan Officer':
    case 'INSTITUTION_STAFF':
    default:
      return 'INSTITUTION_STAFF';
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim();
    const fullName = String(body.full_name ?? '').trim();
    const role = mapRole(body.role ?? null);
    const branch = String(body.branch ?? '').trim();
    const institutionId = body.institution_id ?? null;
    const onboardingMethod = body.onboarding_method ?? 'invite';
    const password = body.password ?? null;

    // Map UI-friendly role names to database enum values
    const mapRoleToEnum = (uiRole: string): string => {
      switch (uiRole) {
        case 'Super Admin':
          return 'PLATFORM_ADMIN';
        case 'Branch Manager':
          return 'INSTITUTION_ADMIN';
        case 'Loan Officer':
          return 'INSTITUTION_STAFF';
        case 'Teller':
          return 'INSTITUTION_TREASURER';
        case 'Auditor':
          return 'INSTITUTION_AUDITOR';
        default:
          return 'INSTITUTION_STAFF';
      }
    };
    const dbRole = mapRoleToEnum(role);

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Service role key not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const inviteResult =
      onboardingMethod === 'password'
        ? await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role,
            branch,
            institution_id: institutionId
          }
        })
        : await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: fullName,
            role,
            branch,
            institution_id: institutionId
          }
        });

    if (inviteResult.error || !inviteResult.data.user) {
      return new Response(JSON.stringify({ error: inviteResult.error?.message ?? 'Failed to invite staff.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user = inviteResult.data.user;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        institution_id: institutionId,
        role: dbRole,
        email,
        full_name: fullName,
        branch
      })
      .select('*')
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ profile }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
