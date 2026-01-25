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
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Authenticate Caller
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Rate Limit Check (User: 10/min) - Higher than join because bulk approvals might happen? 
        // Actually, this is hit per-confirmation. A treasurer might confirm many.
        // Let's set it to 30 per minute for TREASURERS/ADMINS.
        // We can check role first, or just give a generous limit.
        const { data: rlData, error: rlError } = await supabaseAdmin.rpc('check_rate_limit', {
            p_key: `confirm_contrib:${user.id}`,
            p_limit: 30,
            p_window_seconds: 60,
            p_timestamp: Date.now()
        });

        if (rlData && !rlData.allowed) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Too many actions.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { submission_id, action } = await req.json();

        if (!submission_id || !['APPROVE', 'REJECT'].includes(action)) {
            return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2. Fetch Submission
        const { data: submission, error: subError } = await supabaseAdmin
            .from('submissions')
            .select('*')
            .eq('id', submission_id)
            .single();

        if (subError || !submission) {
            return new Response(JSON.stringify({ error: 'Submission not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (submission.status !== 'PENDING') {
            return new Response(JSON.stringify({ error: `Submission is already ${submission.status}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. Permission Check (Caller must be Group Admin or System Admin)
        // Checking Group Membership Role
        const { data: callerMembership } = await supabaseAdmin
            .from('memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('group_id', submission.group_id)
            .single();

        // Also check System Admin (Profile Role) in a real app, assuming simplified here:
        const isGroupAdmin = callerMembership && ['CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(callerMembership.role);

        // For MVP/Contracts, we strictly enforce Group Admin or self-approval (if allowed? No, usually not self).
        // Let's assume ONLY Group Admin can approve.
        // NOTE: If the system is automated, the "Caller" might be a service account? 
        // If automated, we use a service key in the request or check specific logic.
        // Here we assume Human Review for now.

        if (!isGroupAdmin) {
            // Fallback: Check if Platform Admin (from profiles)
            const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('user_id', user.id).single();
            if (profile?.role !== 'PLATFORM_ADMIN') {
                return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        if (action === 'REJECT') {
            await supabaseAdmin.from('submissions').update({ status: 'REJECTED' }).eq('id', submission_id);
            return new Response(JSON.stringify({ message: 'Submission rejected' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // APPROVE Logic
        // 4. Check 500,000 Cap
        const { data: ledgerData, error: ledgerError } = await supabaseAdmin
            .from('ledger')
            .select('amount')
            .eq('user_id', submission.user_id)
            .eq('group_id', submission.group_id);

        // Provide default empty array if no transactions
        const transactions = ledgerData || [];
        const currentBalance = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        const newTotal = currentBalance + Number(submission.amount);

        if (newTotal > 500000) {
            // Reject due to cap
            await supabaseAdmin.from('submissions').update({ status: 'REJECTED' }).eq('id', submission_id); // Or keep pending with error? Rejecting is safer.
            return new Response(JSON.stringify({ error: 'Contribution exceeds 500,000 RWF wallet cap. Submission rejected.' }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 5. Execute Transaction (Insert Ledger + Update Submission)
        // Note: Supabase-js doesn't support strict distinct transactions unless using RPC/pg functions.
        // But we can just do sequential operations. If Insert fails, we don't update submission.
        // Worst case: Submission is Pending but Ledger exists? (Idempotency check needed in production).
        // Better: Update submission first? No, if Update succeeds but Insert fails, we lost usage.
        // Insert Ledger First.

        const { error: insertError } = await supabaseAdmin.from('ledger').insert({
            submission_id: submission.id,
            user_id: submission.user_id,
            group_id: submission.group_id,
            amount: submission.amount,
            balance_snapshot: newTotal,
            transaction_type: 'CONTRIBUTION'
        });

        if (insertError) {
            throw insertError;
        }

        const { error: updateError } = await supabaseAdmin.from('submissions').update({ status: 'VERIFIED' }).eq('id', submission_id);

        if (updateError) {
            // Critical: We inserted ledger but failed to update submission.
            // In real system, this needs rollback or alert.
            console.error('CRITICAL: Failed to update submission after ledger insert', updateError);
            return new Response(JSON.stringify({ error: 'Transaction partically failed', details: updateError }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ message: 'Contribution confirmed', new_balance: newTotal }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
