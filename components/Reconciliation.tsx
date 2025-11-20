
import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, FileText, ArrowRight, Scale, Wallet, Smartphone, DollarSign, Filter, Check } from 'lucide-react';

type RecTab = 'MoMo vs Ledger' | 'Branch Cash' | 'Token Reserve';

const Reconciliation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RecTab>('MoMo vs Ledger');
  const [unmatchedItems, setUnmatchedItems] = useState([1, 2, 3]);

  const resolveItem = (id: number) => {
    setUnmatchedItems(prev => prev.filter(item => item !== id));
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Digital Balance</p>
             <p className="text-2xl font-bold text-green-600">99.8%</p>
             <p className="text-xs text-slate-400 mt-1">Ledger vs MoMo Balance</p>
           </div>
           <div className="p-3 bg-green-50 text-green-600 rounded-full">
             <CheckCircle2 size={24} />
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
           <div>
             <p className="text-slate-500 text-xs font-semibold uppercase">Pending Issues</p>
             <p className="text-2xl font-bold text-amber-600">{unmatchedItems.length}</p>
             <p className="text-xs text-slate-400 mt-1">Require manual review</p>
           </div>
           <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
             <AlertTriangle size={24} />
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-slate-500 text-xs font-semibold uppercase">Last Closed</p>
             <p className="text-2xl font-bold text-slate-900">Yesterday</p>
             <p className="text-xs text-slate-400 mt-1">Branch: Kigali Main</p>
           </div>
           <div className="p-3 bg-slate-50 text-slate-600 rounded-full">
             <Scale size={24} />
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
            {[
                { id: 'MoMo vs Ledger', icon: Smartphone },
                { id: 'Branch Cash', icon: DollarSign },
                { id: 'Token Reserve', icon: Wallet },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as RecTab)}
                    className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${
                        activeTab === tab.id 
                        ? 'bg-white border-t-2 border-t-blue-600 text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.id}
                </button>
            ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
             <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2">
                <Filter size={14} /> Filter: All Issues
             </button>
             <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
                Date: Today
             </button>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
             Export Report
          </button>
        </div>

        {/* Tab Views */}
        <div className="flex-1 overflow-y-auto">
            {activeTab === 'MoMo vs Ledger' && (
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Detected</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Source (SMS/MoMo)</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ledger Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {unmatchedItems.map(id => (
                            <tr key={id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm text-slate-600">Today, 10:4{id} AM</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-900">{35000 * id} RWF</div>
                                    <div className="text-xs text-slate-500">Ref: 8399{id}20</div>
                                    <div className="text-xs text-blue-600 mt-0.5">Sender: +250 788...</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                                        <AlertTriangle size={12} /> Missing Entry
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">No matching transaction found within 5 mins.</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => resolveItem(id)}
                                        className="text-blue-600 text-sm font-medium hover:underline mr-3"
                                    >
                                        Create Entry
                                    </button>
                                    <button 
                                        onClick={() => resolveItem(id)}
                                        className="text-slate-400 text-sm font-medium hover:text-slate-600"
                                    >
                                        Ignore
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {unmatchedItems.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-10 text-center text-slate-400">
                                    <CheckCircle2 size={48} className="mx-auto mb-4 text-green-200" />
                                    <p>All MoMo transactions match the system ledger.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {activeTab === 'Branch Cash' && (
                <div className="p-6 max-w-4xl mx-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Vault Closure</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">System Expected Cash</label>
                                <div className="text-2xl font-bold text-slate-900 bg-white border border-slate-200 rounded-lg p-3">
                                    2,450,000 RWF
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Based on recorded Cash In/Out</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Actual Count (Input)</label>
                                <input type="number" className="w-full text-2xl font-bold text-slate-900 bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 rounded-lg p-3 outline-none" placeholder="0" />
                                <p className="text-xs text-slate-400 mt-1">Enter physical vault count</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                           <h4 className="font-bold text-slate-700 text-sm">Cash Movement Logs</h4>
                        </div>
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-4 text-sm text-slate-600">08:00 AM</td>
                                    <td className="p-4 text-sm text-slate-900 font-medium">Opening Balance</td>
                                    <td className="p-4 text-right text-sm font-bold text-slate-900">1,500,000 RWF</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-4 text-sm text-slate-600">10:30 AM</td>
                                    <td className="p-4 text-sm text-slate-900 font-medium">Deposit (Member M-102)</td>
                                    <td className="p-4 text-right text-sm font-bold text-green-600">+500,000 RWF</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'Token Reserve' && (
                 <div className="p-6 max-w-4xl mx-auto">
                     <div className="grid grid-cols-2 gap-6 mb-6">
                         <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                             <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Total Tokens Issued</p>
                             <p className="text-3xl font-bold text-indigo-900">12,450 TKN</p>
                             <p className="text-xs text-indigo-400 mt-1">Pegged at $1 USD</p>
                         </div>
                         <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                             <p className="text-xs font-bold text-green-600 uppercase mb-1">USD Reserve Account</p>
                             <p className="text-3xl font-bold text-green-900">$12,450.00</p>
                             <p className="text-xs text-green-600 mt-1">Held in Bank</p>
                         </div>
                     </div>
                     
                     <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                         <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                             <Check size={32} />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900">Reserve is Balanced</h3>
                         <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                             The total circulating token supply exactly matches the USD funds held in the designated reserve account. No action needed.
                         </p>
                     </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;
