
import React, { useState } from 'react';
import { FileText, Filter, Search, Plus, CheckCircle2, XCircle, Clock, MoreHorizontal, ChevronDown, DollarSign, AlertCircle, X, Calendar, User, ArrowRight } from 'lucide-react';
import { MOCK_LOANS } from '../constants';
import { Loan, LoanStatus, ViewState } from '../types';

interface LoansProps {
  onNavigate?: (view: ViewState) => void;
}

const Loans: React.FC<LoansProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'All' | LoanStatus>('All');
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);

  const filteredLoans = MOCK_LOANS.filter(loan => {
    const matchesTab = activeTab === 'All' || loan.status === activeTab;
    const matchesSearch = loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          loan.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleSelection = (id: string) => {
    if (selectedLoans.includes(id)) {
      setSelectedLoans(selectedLoans.filter(l => l !== id));
    } else {
      setSelectedLoans([...selectedLoans, id]);
    }
  };

  const StatusBadge = ({ status }: { status: LoanStatus }) => {
    const styles = {
      'Pending Approval': 'bg-yellow-50 text-yellow-700 border-yellow-100',
      'Active': 'bg-blue-50 text-blue-700 border-blue-100',
      'Overdue': 'bg-red-50 text-red-700 border-red-100',
      'Closed': 'bg-green-50 text-green-700 border-green-100',
      'Rejected': 'bg-slate-100 text-slate-600 border-slate-200'
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Stats Header */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300 ${detailLoan ? 'w-1/2 pr-4' : 'w-full'}`}>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-slate-500 text-xs font-semibold uppercase">Total Portfolio</p>
           <h3 className="text-2xl font-bold text-slate-900 mt-1">124.5M RWF</h3>
           <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle2 size={12}/> 95% Healthy</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-slate-500 text-xs font-semibold uppercase">Pending Disbursement</p>
           <h3 className="text-2xl font-bold text-blue-600 mt-1">12.8M RWF</h3>
           <p className="text-xs text-slate-500 mt-1">5 Loans Approved</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-slate-500 text-xs font-semibold uppercase">At Risk (Overdue)</p>
           <h3 className="text-2xl font-bold text-red-600 mt-1">4.2M RWF</h3>
           <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertCircle size={12}/> Action Required</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden transition-all duration-300 ${detailLoan ? 'w-1/2' : 'w-full'}`}>
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search loan or member..." 
                 className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
             </div>
           </div>
           <div className="flex gap-2 w-full sm:w-auto justify-end">
             {selectedLoans.length > 0 && (
                <div className="flex items-center gap-2 mr-4 animate-in fade-in slide-in-from-right-5">
                  <span className="text-xs font-medium text-slate-500">{selectedLoans.length} selected</span>
                  <button className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">Approve</button>
                  <button className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 text-xs font-medium rounded-lg hover:bg-red-100">Reject</button>
                </div>
             )}
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
               <Filter size={16} /> Filter
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
               <Plus size={16} /> Create Loan
             </button>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 overflow-x-auto">
           {['All', 'Pending Approval', 'Active', 'Overdue', 'Closed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                   activeTab === tab 
                   ? 'border-blue-600 text-blue-600' 
                   : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
           ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                 <tr>
                    <th className="w-10 px-4 py-3 text-center">
                       <input type="checkbox" className="rounded border-slate-300" />
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Loan ID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Borrower</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Principal</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Balance</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Progress</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                    <th className="px-6 py-3 w-10"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredLoans.map(loan => (
                    <tr 
                      key={loan.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${detailLoan?.id === loan.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setDetailLoan(loan)}
                    >
                       <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <input 
                             type="checkbox" 
                             className="rounded border-slate-300"
                             checked={selectedLoans.includes(loan.id)}
                             onChange={() => toggleSelection(loan.id)}
                          />
                       </td>
                       <td className="px-6 py-4">
                          <p className="text-sm font-mono text-slate-600 font-medium">{loan.id}</p>
                          <p className="text-xs text-slate-400">{loan.startDate}</p>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                {loan.borrowerName.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">{loan.borrowerName}</p>
                                {loan.groupId && (
                                   <p className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-0.5">Group Backed</p>
                                )}
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                          {loan.amount.toLocaleString()} RWF
                       </td>
                       <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-slate-900">{loan.outstandingBalance.toLocaleString()} RWF</p>
                          {loan.nextPaymentDate && (
                             <p className="text-xs text-slate-500 mt-0.5">Due: {loan.nextPaymentDate}</p>
                          )}
                       </td>
                       <td className="px-6 py-4">
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                             <div 
                                className={`h-full rounded-full ${loan.status === 'Overdue' ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${((loan.amount - loan.outstandingBalance) / loan.amount) * 100}%` }}
                             ></div>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                          <StatusBadge status={loan.status} />
                       </td>
                       <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-blue-600">
                             <MoreHorizontal size={18} />
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
           {filteredLoans.length === 0 && (
              <div className="p-10 text-center text-slate-500">
                 <FileText size={48} className="mx-auto mb-4 opacity-20" />
                 <p>No loans found matching current filters.</p>
              </div>
           )}
        </div>
      </div>

      {/* Loan Detail Drawer */}
      {detailLoan && (
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white rounded-l-xl shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300 z-20">
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
             <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono bg-slate-200 px-1.5 rounded text-slate-600 text-xs font-bold">{detailLoan.id}</span>
                  <StatusBadge status={detailLoan.status} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Loan Details</h2>
             </div>
             <button onClick={() => setDetailLoan(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200">
                <X size={24} />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
             {/* Borrower Card */}
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-lg font-bold text-slate-600">
                      {detailLoan.borrowerName.charAt(0)}
                   </div>
                   <div>
                      <p className="font-bold text-slate-900">{detailLoan.borrowerName}</p>
                      <p className="text-xs text-slate-500">ID: M-1002</p>
                   </div>
                </div>
                <button 
                  onClick={() => onNavigate && onNavigate(ViewState.MEMBERS)}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                >
                   <User size={20} />
                </button>
             </div>

             {/* Key Financials */}
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <p className="text-xs text-slate-500 uppercase font-semibold">Principal</p>
                   <p className="text-xl font-bold text-slate-900">{detailLoan.amount.toLocaleString()} RWF</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <p className="text-xs text-slate-500 uppercase font-semibold">Outstanding</p>
                   <p className="text-xl font-bold text-blue-600">{detailLoan.outstandingBalance.toLocaleString()} RWF</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <p className="text-xs text-slate-500 uppercase font-semibold">Interest Rate</p>
                   <p className="text-lg font-bold text-slate-900">1.5% / Month</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <p className="text-xs text-slate-500 uppercase font-semibold">Next Payment</p>
                   <p className="text-lg font-bold text-slate-900">{detailLoan.nextPaymentDate || 'N/A'}</p>
                </div>
             </div>

             {/* Repayment Schedule Mock */}
             <div>
                <h3 className="font-bold text-slate-800 mb-3">Recent Repayments</h3>
                <div className="space-y-2">
                   <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-50 text-green-600 rounded">
                            <CheckCircle2 size={16} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">Installment #1</p>
                            <p className="text-xs text-slate-500">Paid on 25 Sep 2023</p>
                         </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">12,500 RWF</span>
                   </div>
                   <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-100 text-slate-400 rounded">
                            <Clock size={16} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">Installment #2</p>
                            <p className="text-xs text-slate-500">Due 25 Oct 2023</p>
                         </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">12,500 RWF</span>
                   </div>
                </div>
             </div>

             {detailLoan.groupId && (
               <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <h4 className="text-sm font-bold text-indigo-900 mb-1">Group Backed Loan</h4>
                  <p className="text-xs text-indigo-700 mb-3">Guaranteed by "Ibimina y'Urubyiruko"</p>
                  <button 
                    onClick={() => onNavigate && onNavigate(ViewState.GROUPS)}
                    className="text-xs font-medium text-white bg-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-700 flex items-center gap-1 w-fit"
                  >
                     View Group Context <ArrowRight size={12} />
                  </button>
               </div>
             )}
          </div>
          
          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 bg-slate-50 grid grid-cols-2 gap-3">
             <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50">
                Add Note
             </button>
             <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700">
                Record Repayment
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
