// ============================================================================
// Edge Function: bulk-import-members
// Purpose: Bulk import members from CSV data
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MemberRow {
  full_name: string
  phone: string
  group_name?: string
  group_id?: string
  member_code?: string
  branch?: string
}

interface BulkImportRequest {
  members: MemberRow[]
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

    const { members, institution_id }: BulkImportRequest = await req.json()

    if (!members || !Array.isArray(members) || members.length === 0) {
      throw new Error('Missing or empty members array')
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

    // Validate all members
    const errors: Array<{ row: number; error: string }> = []
    const validMembers: Array<MemberRow & { row: number }> = []

    members.forEach((member, index) => {
      if (!member.full_name || !member.phone) {
        errors.push({ row: index + 1, error: 'Missing required fields: full_name, phone' })
        return
      }
      if (!member.group_name && !member.group_id) {
        errors.push({ row: index + 1, error: 'Either group_name or group_id required' })
        return
      }
      validMembers.push({ ...member, row: index + 1 })
    })

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resolve group IDs
    const groupNameToId = new Map<string, string>()
    if (validMembers.some(m => m.group_name)) {
      const groupNames = [...new Set(validMembers.filter(m => m.group_name).map(m => m.group_name!))]
      const { data: groups } = await supabaseClient
        .from('groups')
        .select('id, group_name')
        .eq('institution_id', effective_institution_id)
        .in('group_name', groupNames)

      groups?.forEach(g => groupNameToId.set(g.group_name, g.id))
    }

    // Insert members
    const results: Array<{ row: number; success: boolean; id?: string; error?: string }> = []

    for (const member of validMembers) {
      try {
        // Resolve group_id
        let group_id = member.group_id
        if (!group_id && member.group_name) {
          group_id = groupNameToId.get(member.group_name)
          if (!group_id) {
            results.push({ row: member.row, success: false, error: `Group "${member.group_name}" not found` })
            continue
          }
        }

        // Validate group belongs to institution
        const { data: group } = await supabaseClient
          .from('groups')
          .select('institution_id')
          .eq('id', group_id)
          .single()

        if (!group || group.institution_id !== effective_institution_id) {
          results.push({ row: member.row, success: false, error: 'Group does not belong to institution' })
          continue
        }

        // Insert member
        const { data, error } = await supabaseClient
          .from('members')
          .insert({
            institution_id: effective_institution_id,
            group_id: group_id,
            full_name: member.full_name,
            phone: member.phone,
            branch: member.branch || null,
            status: 'ACTIVE',
            kyc_status: 'PENDING'
          })
          .select('id')
          .single()

        if (error) {
          results.push({ row: member.row, success: false, error: error.message })
        } else {
          // Create group_members entry
          await supabaseClient
            .from('group_members')
            .insert({
              institution_id: effective_institution_id,
              group_id: group_id,
              member_id: data.id,
              role: 'MEMBER',
              status: 'GOOD_STANDING'
            })

          results.push({ row: member.row, success: true, id: data.id })
        }
      } catch (error) {
        results.push({ row: member.row, success: false, error: error.message })
      }
    }

    // Audit log
    await supabaseClient
      .from('audit_log')
      .insert({
        actor_user_id: user.id,
        institution_id: effective_institution_id,
        action: 'bulk_import_members',
        entity_type: 'member',
        metadata: { count: validMembers.length, results }
      })

    const successCount = results.filter(r => r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        total: validMembers.length,
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


