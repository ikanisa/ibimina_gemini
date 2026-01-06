/**
 * Group Loans Tab Component
 * 
 * Displays group-backed loans
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { Group } from '../../types';

interface GroupLoansTabProps {
    group: Group;
}

export const GroupLoansTab: React.FC<GroupLoansTabProps> = ({ group }) => {
    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Group-Backed Loans</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={16} /> New Loan
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Loan ID</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Borrower</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Guarantee</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-mono text-slate-600">L-2201</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">Grace Uwase</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">150,000 RWF</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                                    Active
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">Group Fund (100%)</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-mono text-slate-600">L-2155</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">Divine Keza</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">500,000 RWF</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">
                                    Overdue
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">Co-Guarantors (3)</td>
                        </tr>
                    </tbody>
                </table>
                <div className="p-6 text-center border-t border-slate-100">
                    <p className="text-sm text-slate-500">Showing 2 of 2 active group loans</p>
                </div>
            </div>
        </div>
    );
};

export default GroupLoansTab;
