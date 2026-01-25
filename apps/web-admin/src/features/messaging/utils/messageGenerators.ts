/**
 * Member Statement Message Generator
 */

import type { MemberStatement } from '../types';

export function generateStatementMessage(statement: MemberStatement): string {
    const { member, savings, loans, groups, currency } = statement;

    const lines: string[] = [
        `📊 *SAVINGS STATEMENT*`,
        ``,
        `*Member:* ${member.full_name}`,
        `*Phone:* ${member.phone}`,
        `*Generated:* ${new Date().toLocaleDateString()}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💰 *SAVINGS SUMMARY*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `*Current Balance:* ${formatCurrency(savings.current_balance, currency)}`,
        `*Total Contributions:* ${formatCurrency(savings.total_contributions, currency)}`,
        `*Contribution Count:* ${savings.contribution_count}`,
    ];

    if (savings.last_contribution_date) {
        lines.push(`*Last Contribution:* ${formatCurrency(savings.last_contribution_amount || 0, currency)} on ${new Date(savings.last_contribution_date).toLocaleDateString()}`);
    }

    if (savings.arrears > 0) {
        lines.push(`⚠️ *Arrears:* ${formatCurrency(savings.arrears, currency)}`);
    }

    // Loan information
    if (loans.has_active_loan || loans.loans_count > 0) {
        lines.push(
            ``,
            `━━━━━━━━━━━━━━━━━━━━`,
            `🏦 *LOAN SUMMARY*`,
            `━━━━━━━━━━━━━━━━━━━━`
        );

        if (loans.has_active_loan) {
            lines.push(`*Active Loan Balance:* ${formatCurrency(loans.active_loan_balance, currency)}`);
        } else {
            lines.push(`✅ No active loans`);
        }

        lines.push(`*Total Loans Taken:* ${formatCurrency(loans.total_loans_taken, currency)}`);
        lines.push(`*Total Repaid:* ${formatCurrency(loans.total_loans_repaid, currency)}`);
    }

    // Group memberships
    if (groups.length > 0) {
        lines.push(
            ``,
            `━━━━━━━━━━━━━━━━━━━━`,
            `👥 *GROUP MEMBERSHIPS*`,
            `━━━━━━━━━━━━━━━━━━━━`
        );

        groups.forEach(group => {
            lines.push(`• ${group.name} (${group.role})`);
            lines.push(`  Expected: ${formatCurrency(group.expected_amount, currency)} ${group.contribution_frequency}`);
        });
    }

    lines.push(
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `Thank you for being a valued member!`,
        `For questions, contact your SACCO office.`
    );

    return lines.join('\n');
}

export function generateGroupReportMessage(
    groupName: string,
    leaderName: string,
    reportType: string,
    periodStart: string,
    periodEnd: string,
    totalContributions: number,
    memberCount: number,
    currency: string
): string {
    const lines: string[] = [
        `📊 *GROUP ${reportType.toUpperCase()} REPORT*`,
        ``,
        `*Group:* ${groupName}`,
        `*Leader:* ${leaderName}`,
        `*Period:* ${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💰 *SUMMARY*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `*Total Contributions:* ${formatCurrency(totalContributions, currency)}`,
        `*Active Members:* ${memberCount}`,
        ``,
        `📎 *Detailed report attached as PDF*`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `For questions, contact administration.`
    ];

    return lines.join('\n');
}

function formatCurrency(amount: number, currency: string = 'RWF'): string {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
