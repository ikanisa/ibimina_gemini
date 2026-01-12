import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Map UI-friendly role names to database enum values
// Only 'Admin' and 'Staff' are supported
const mapRoleToEnum = (role: string | null): string => {
  if (!role) return 'STAFF';
  const roleUpper = role.toUpperCase();
  
  // Map to new simplified roles
  if (roleUpper === 'ADMIN' || roleUpper === 'PLATFORM_ADMIN' || roleUpper === 'INSTITUTION_ADMIN' || roleUpper === 'SUPER ADMIN' || roleUpper === 'BRANCH MANAGER') {
    return 'ADMIN';
  }
  
  // Default to STAFF for all other roles
  return 'STAFF';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const fullName = String(body.full_name ?? '').trim();
    const role = mapRoleToEnum(body.role ?? null);
    const institutionId = body.institution_id ?? null;
    const onboardingMethod = body.onboarding_method ?? 'password';
    const password = body.password ?? 'Sacco+'; // Default password
    const invitedBy = body.invited_by ?? null; // User ID of the inviter

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!institutionId && role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Institution ID is required.' }), {
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

    // Create staff_invites record first
    let inviteId: string | null = null;
    if (institutionId) {
      const { data: inviteData, error: inviteError } = await supabase
        .from('staff_invites')
        .insert({
          email,
          institution_id: institutionId,
          role,
          invited_by: invitedBy,
          status: 'pending'
        })
        .select('id')
        .single();

      if (inviteError && !inviteError.message.includes('duplicate')) {
        console.error('Error creating invite record:', inviteError);
        // Continue anyway - invite record is for audit, not blocking
      } else if (inviteData) {
        inviteId = inviteData.id;
      }
    }

    // Create user via Supabase Auth
    const inviteResult =
      onboardingMethod === 'password'
        ? await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role,
            institution_id: institutionId
          }
        })
        : await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: fullName,
            role,
            institution_id: institutionId
          }
        });

    if (inviteResult.error || !inviteResult.data.user) {
      // Update invite status to failed if we have one
      if (inviteId) {
        await supabase
          .from('staff_invites')
          .update({ 
            status: 'expired',
            metadata: { error: inviteResult.error?.message }
          })
          .eq('id', inviteId);
      }
      
      return new Response(JSON.stringify({ error: inviteResult.error?.message ?? 'Failed to invite staff.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user = inviteResult.data.user;

    // Create/update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        institution_id: institutionId,
        role,
        email,
        full_name: fullName,
        is_active: true,
        status: 'ACTIVE'
      })
      .select('*')
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update invite status if password method (instant activation)
    if (inviteId && onboardingMethod === 'password') {
      await supabase
        .from('staff_invites')
        .update({ 
          status: 'accepted',
          accepted_by: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteId);
    }

    // Write audit log
    if (institutionId) {
      await supabase
        .from('audit_log')
        .insert({
          actor_user_id: invitedBy,
          institution_id: institutionId,
          action: 'invite_staff',
          entity_type: 'profile',
          entity_id: user.id,
          metadata: {
            email,
            role,
            method: onboardingMethod,
            invite_id: inviteId
          }
        });
    }

    return new Response(JSON.stringify({ 
      profile,
      invite_id: inviteId
    }), {
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
