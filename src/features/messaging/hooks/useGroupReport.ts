/**
 * Hook to fetch group report data and leaders
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { GroupReportData } from '../types';

interface GroupLeader {
    member_id: string;
    member_name: string;
    phone: string;
    role: string;
}

interface UseGroupReportResult {
    reportData: GroupReportData | null;
    leaders: GroupLeader[];
    loading: boolean;
    error: string | null;
    fetchGroupReport: (
        groupId: string,
        reportType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM',
        periodStart: string,
        periodEnd: string
    ) => Promise<{ report: GroupReportData | null; leaders: GroupLeader[] }>;
}

export function useGroupReport(): UseGroupReportResult {
    const [reportData, setReportData] = useState<GroupReportData | null>(null);
    const [leaders, setLeaders] = useState<GroupLeader[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGroupReport = useCallback(async (
        groupId: string,
        reportType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM',
        periodStart: string,
        periodEnd: string
    ): Promise<{ report: GroupReportData | null; leaders: GroupLeader[] }> => {
        setLoading(true);
        setError(null);

        try {
            // Fetch group info
            const { data: group, error: groupError } = await supabase
                .from('groups')
                .select('id, group_name, currency, expected_amount')
                .eq('id', groupId)
                .single();

            if (groupError || !group) {
                throw new Error('Group not found');
            }

            // Fetch group members with their roles
            const { data: groupMembers, error: membersError } = await supabase
                .from('group_members')
                .select(`
          role_in_group,
          member:members (
            id,
            full_name,
            phone
          )
        `)
                .eq('group_id', groupId)
                .eq('status', 'GOOD_STANDING');

            if (membersError) {
                console.error('Error fetching members:', membersError);
            }

            // Extract leaders
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const leadersList = ((groupMembers || []) as any[])
                .filter(gm => gm.role_in_group === 'LEADER' || gm.role_in_group === 'CHAIRPERSON' || gm.role_in_group === 'SECRETARY')
                .map(gm => ({
                    member_id: gm.member?.id || '',
                    member_name: gm.member?.full_name || '',
                    phone: gm.member?.phone || '',
                    role: gm.role_in_group,
                }));

            setLeaders(leadersList);

            // Fetch contributions for the period
            const { data: contributions, error: contribError } = await supabase
                .from('transactions')
                .select('member_id, amount')
                .eq('group_id', groupId)
                .eq('status', 'ALLOCATED')
                .eq('transaction_type', 'CONTRIBUTION')
                .gte('created_at', periodStart)
                .lte('created_at', periodEnd + 'T23:59:59');

            if (contribError) {
                console.error('Error fetching contributions:', contribError);
            }

            // Calculate totals per member
            const memberTotals = new Map<string, { periodTotal: number; name: string; phone: string }>();

            // Initialize with all members
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((groupMembers || []) as any[]).forEach(gm => {
                if (gm.member) {
                    memberTotals.set(gm.member.id, {
                        periodTotal: 0,
                        name: gm.member.full_name || '',
                        phone: gm.member.phone || '',
                    });
                }
            });

            // Sum contributions
            (contributions || []).forEach(c => {
                const existing = memberTotals.get(c.member_id);
                if (existing) {
                    existing.periodTotal += c.amount || 0;
                }
            });

            const totalContributions = (contributions || []).reduce((sum, c) => sum + (c.amount || 0), 0);
            const expectedTotal = (groupMembers?.length || 0) * (group.expected_amount || 0);

            const report: GroupReportData = {
                group: {
                    id: group.id,
                    name: group.group_name,
                    total_members: groupMembers?.length || 0,
                    active_members: groupMembers?.length || 0,
                },
                period: {
                    start: periodStart,
                    end: periodEnd,
                    type: reportType,
                },
                summary: {
                    total_contributions: totalContributions,
                    expected_contributions: expectedTotal,
                    collection_rate: expectedTotal > 0 ? (totalContributions / expectedTotal) * 100 : 0,
                    total_arrears: Math.max(0, expectedTotal - totalContributions),
                    active_loans: 0, // Would need loans query
                    loan_balance: 0,
                },
                member_contributions: Array.from(memberTotals.entries()).map(([memberId, data]) => ({
                    member_id: memberId,
                    member_name: data.name,
                    phone: data.phone,
                    period_total: data.periodTotal,
                    overall_total: 0, // Would need separate query
                    arrears: Math.max(0, (group.expected_amount || 0) - data.periodTotal),
                })),
                currency: group.currency || 'RWF',
                generated_at: new Date().toISOString(),
            };

            setReportData(report);
            return { report, leaders: leadersList };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch report';
            setError(errorMsg);
            return { report: null, leaders: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    return { reportData, leaders, loading, error, fetchGroupReport };
}
