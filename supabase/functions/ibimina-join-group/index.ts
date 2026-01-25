import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Get User
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Invite token is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Rate Limit Check (5 attempts / minute)
    // We use a Service Role client for Rate Limiting to ensure we can write to the tracking table reliably
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: rlData, error: rlError } = await adminClient.rpc('check_rate_limit', {
       p_key: `join_attempt:${user.id}`,
       p_limit: 5,
       p_window_seconds: 60,
       p_timestamp: Date.now()
    });

    if (rlError) {
        console.error('Rate limit check failed', rlError);
        // Fail open or closed? Fail open for now to avoid blocking users if RL system is down, but log it.
    } else if (rlData && !rlData.allowed) {
        return new Response(JSON.stringify({ error: 'Too many join attempts. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Delegate to Secure RPC
    const { data: result, error: rpcError } = await supabaseClient.rpc('accept_invite', {
      p_token: token
    });

    if (rpcError) {
      throw rpcError;
    }

    if (result.status === 'error') {
       return new Response(JSON.stringify({ error: result.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (result.status === 'already_member') {
        return new Response(JSON.stringify({ error: 'You are already a member of this group.', details: result }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
