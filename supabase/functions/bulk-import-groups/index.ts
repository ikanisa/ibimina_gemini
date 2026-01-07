// ============================================================================
// Edge Function: bulk-import-groups
// Purpose: Bulk import groups from CSV data
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GroupRow {
  group_name: string
  code?: string
  expected_amount: number
  frequency: 'Weekly' | 'Monthly'
  meeting_day?: string
  currency?: string
}

interface BulkImportRequest {
  groups: GroupRow[]
  institution_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { groups, institution_id }: BulkImportRequest = await req.json()

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      throw new Error('Missing or empty groups array')
    }

    // Get user to determine institution
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('institution_id, role')
      .eq('user_id', user.id)
      .single()

    const effective_institution_id = institution_id || profile?.institution_id
    if (!effective_institution_id) {
      throw new Error('Institution ID required')
    }

    // Validate all groups
    const errors: Array<{ row: number; error: string }> = []
    const validGroups: Array<GroupRow & { row: number }> = []

    groups.forEach((group, index) => {
      if (!group.group_name || !group.expected_amount || !group.frequency) {
        errors.push({ row: index + 1, error: 'Missing required fields: group_name, expected_amount, frequency' })
        return
      }
      if (group.frequency !== 'Weekly' && group.frequency !== 'Monthly') {
        errors.push({ row: index + 1, error: 'frequency must be "Weekly" or "Monthly"' })
        return
      }
      validGroups.push({ ...group, row: index + 1 })
    })

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert groups
    const results: Array<{ row: number; success: boolean; id?: string; error?: string }> = []

    for (const group of validGroups) {
      try {
        const { data, error } = await supabaseClient
          .from('groups')
          .insert({
            institution_id: effective_institution_id,
            group_name: group.group_name,
            code: group.code || null,
            expected_amount: group.expected_amount,
            frequency: group.frequency,
            meeting_day: group.meeting_day || null,
            currency: group.currency || 'RWF',
            status: 'ACTIVE'
          })
          .select('id')
          .single()

        if (error) {
          results.push({ row: group.row, success: false, error: error.message })
        } else {
          results.push({ row: group.row, success: true, id: data.id })
        }
      } catch (error) {
        results.push({ row: group.row, success: false, error: error.message })
      }
    }

    // Audit log
    await supabaseClient
      .from('audit_log')
      .insert({
        actor_user_id: user.id,
        institution_id: effective_institution_id,
        action: 'bulk_import_groups',
        entity_type: 'group',
        metadata: { count: validGroups.length, results }
      })

    const successCount = results.filter(r => r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        total: validGroups.length,
        success_count: successCount,
        error_count: results.length - successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Bulk import error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

