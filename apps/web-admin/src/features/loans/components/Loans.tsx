/**
 * Loans Page Component
 * Displays all group-savings-backed loans with member details
 * Minimal, clean UI focused on data clarity
 */

import React, { useState, useMemo } from 'react';
import {
    DollarSign,
    TrendingUp,
    Filter,
    ArrowUpDown,
    ChevronDown,
    Briefcase,
    Percent,
} from 'lucide-react';
import { PageLayout, Section } from '@/shared/components/layout';
import { Button, SearchInput, ErrorDisplay, EmptyState } from '@/shared/components/ui';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { useLoans } from '../hooks/useLoans';
import type { Loan, LoanStatus } from '../types';
import { useIsMobile } from '@/hooks/useResponsive';

// Status badge colors
const statusColors: Record<LoanStatus, { bg: string; text: string }> = {
    PENDING_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700' },
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
    OVERDUE: { bg: 'bg-red-100', text: 'text-red-700' },
    CLOSED: { bg: 'bg-slate-100', text: 'text-slate-600' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-500' },
};

const statusLabels: Record<LoanStatus, string> = {
    PENDING_APPROVAL: 'Pending',
    ACTIVE: 'Active',
    OVERDUE: 'Overdue',
    CLOSED: 'Closed',
    REJECTED: 'Rejected',
};

type FilterStatus = LoanStatus | 'all';
type SortOption = 'date-new' | 'date-old' | 'balance-high' | 'balance-low' | 'member-asc' | 'member-desc';

const Loans: React.FC = () => {
    const { loans, stats, loading, error, refetch } = useLoans();
    const isMobile = useIsMobile();

    // Filter & Sort State
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date-new');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Filter and sort loans
    const filteredLoans = useMemo(() => {
        let result = [...loans];

        // Apply status filter
        if (filterStatus !== 'all') {
            result = result.filter(l => l.status === filterStatus);
        }

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.memberName.toLowerCase().includes(term) ||
                l.groupName.toLowerCase().includes(term)
            );
        }

        // Apply sorting
        switch (sortBy) {
            case 'date-new':
                result.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
                break;
            case 'date-old':
                result.sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
                break;
            case 'balance-high':
                result.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
                break;
            case 'balance-low':
                result.sort((a, b) => a.outstandingBalance - b.outstandingBalance);
                break;
            case 'member-asc':
                result.sort((a, b) => a.memberName.localeCompare(b.memberName));
                break;
            case 'member-desc':
                result.sort((a, b) => b.memberName.localeCompare(a.memberName));
                break;
        }

        return result;
    }, [loans, filterStatus, searchTerm, sortBy]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTerm = (months: number) => {
        if (!months) return '—';
        return `${months} mo`;
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString() + ' RWF';
    };

    return (
        <PageLayout title="Loans" description="Group-savings-backed loans with automatic repayment tracking">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-600 text-white p-5 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-xs font-semibold uppercase">Total Loans</p>
                            <h3 className="text-2xl font-bold mt-1">{stats.totalLoans}</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Briefcase size={20} />
                        </div>
                    </div>
                    <p className="text-sm text-blue-100 mt-2">{stats.activeLoans} currently active</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-semibold uppercase">Total Disbursed</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(stats.totalDisbursed)}</h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-semibold uppercase">Outstanding Balance</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(stats.totalOutstanding)}</h3>
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-semibold uppercase">Expected Interest</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(stats.totalExpectedInterest)}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Percent size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> These are group-savings-backed loans. Repayments are automatically deducted from the member's group savings each month to settle the loan.
                </p>
            </div>

            {/* Loans List */}
            <Section
                title="All Loans"
                headerActions={
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Filter size={14} />}
                                onClick={() => {
                                    setShowFilterMenu(!showFilterMenu);
                                    setShowSortMenu(false);
                                }}
                            >
                                {filterStatus === 'all' ? 'Status' : statusLabels[filterStatus]}
                                <ChevronDown size={14} className="ml-1" />
                            </Button>
                            {showFilterMenu && (
                                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                    {(['all', 'ACTIVE', 'PENDING_APPROVAL', 'OVERDUE', 'CLOSED'] as FilterStatus[]).map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setFilterStatus(status);
                                                setShowFilterMenu(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${filterStatus === status ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                                                }`}
                                        >
                                            {status === 'all' ? 'All Statuses' : statusLabels[status as LoanStatus]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<ArrowUpDown size={14} />}
                                onClick={() => {
                                    setShowSortMenu(!showSortMenu);
                                    setShowFilterMenu(false);
                                }}
                            >
                                Sort
                                <ChevronDown size={14} className="ml-1" />
                            </Button>
                            {showSortMenu && (
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                    {[
                                        { value: 'date-new', label: 'Newest First' },
                                        { value: 'date-old', label: 'Oldest First' },
                                        { value: 'balance-high', label: 'Balance (High-Low)' },
                                        { value: 'balance-low', label: 'Balance (Low-High)' },
                                        { value: 'member-asc', label: 'Member (A-Z)' },
                                        { value: 'member-desc', label: 'Member (Z-A)' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortBy(option.value as SortOption);
                                                setShowSortMenu(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${sortBy === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <SearchInput
                            placeholder="Search member or group..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClear={() => setSearchTerm('')}
                            className="w-56"
                        />
                    </div>
                }
            >
                {loading && (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {error && <ErrorDisplay error={error} variant="banner" onRetry={refetch} />}

                {!loading && !error && filteredLoans.length === 0 && (
                    <EmptyState
                        icon={DollarSign}
                        title={loans.length === 0 ? 'No loans yet' : 'No loans match your filters'}
                        description={
                            loans.length === 0
                                ? 'Loans will appear here when members request group-backed loans.'
                                : 'Try adjusting your filters or search term.'
                        }
                    />
                )}

                {!loading && !error && filteredLoans.length > 0 && (
                    <>
                        {/* Desktop Table View */}
                        {!isMobile && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Group</TableHead>
                                        <TableHead className="text-right">Savings Balance</TableHead>
                                        <TableHead>Issue Date</TableHead>
                                        <TableHead className="text-right">Term</TableHead>
                                        <TableHead className="text-right">Total Issued</TableHead>
                                        <TableHead className="text-right">Monthly Payment</TableHead>
                                        <TableHead className="text-right">Current Balance</TableHead>
                                        <TableHead className="text-right">Total to Pay</TableHead>
                                        <TableHead className="text-right">Interest</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <tbody>
                                    {filteredLoans.map((loan) => (
                                        <TableRow key={loan.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                                                        {loan.memberName.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-slate-900">{loan.memberName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600">{loan.groupName}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm text-slate-700">{formatCurrency(loan.memberSavingsBalance)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600">{formatDate(loan.issueDate)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm text-slate-600">{formatTerm(loan.termMonths)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm font-medium text-slate-900">{formatCurrency(loan.principalAmount)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm text-slate-600">{formatCurrency(loan.periodicPayment)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`text-sm font-bold ${loan.outstandingBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                                    {formatCurrency(loan.outstandingBalance)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm text-slate-900">{formatCurrency(loan.totalToPay)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm text-purple-600">{formatCurrency(loan.expectedInterest)}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[loan.status].bg} ${statusColors[loan.status].text}`}>
                                                    {statusLabels[loan.status]}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </tbody>
                            </Table>
                        )}

                        {/* Mobile Card View */}
                        {isMobile && (
                            <div className="space-y-3 p-4">
                                {filteredLoans.map((loan) => (
                                    <Card key={loan.id}>
                                        <CardContent padding="md">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                                                        {loan.memberName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{loan.memberName}</p>
                                                        <p className="text-xs text-slate-500">{loan.groupName}</p>
                                                        <p className="text-xs text-slate-500">Savings: {formatCurrency(loan.memberSavingsBalance)}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[loan.status].bg} ${statusColors[loan.status].text}`}>
                                                    {statusLabels[loan.status]}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase">Total Issued</p>
                                                    <p className="text-sm font-medium text-slate-900">{formatCurrency(loan.principalAmount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase">Balance</p>
                                                    <p className={`text-sm font-bold ${loan.outstandingBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {formatCurrency(loan.outstandingBalance)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-3">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase">Monthly Payment</p>
                                                    <p className="text-sm text-slate-700">{formatCurrency(loan.periodicPayment)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase">Term</p>
                                                    <p className="text-sm text-slate-700">{formatTerm(loan.termMonths)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-3">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase">Total to Pay</p>
                                                    <p className="text-sm text-slate-700">{formatCurrency(loan.totalToPay)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase">Expected Interest</p>
                                                    <p className="text-sm text-purple-600">{formatCurrency(loan.expectedInterest)}</p>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100">
                                                <p className="text-xs text-slate-500 uppercase">Issue Date</p>
                                                <p className="text-sm text-slate-700">{formatDate(loan.issueDate)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </Section>
        </PageLayout>
    );
};

export default Loans;
