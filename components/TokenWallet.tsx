import React from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Repeat, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import { MOCK_MEMBERS } from '../constants';

const TokenWallet: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Token Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign size={24} className="text-white" />
            </div>
            <span className="text-indigo-100 text-xs bg-indigo-700 px-2 py-1 rounded">System Total</span>
          </div>
          <p className="text-3xl font-bold">$124,500.00</p>
          <p className="text-indigo-200 text-sm mt-1">Total Tokens in Circulation</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">+12% this week</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">$4,200.00</p>
          <p className="text-slate-500 text-sm mt-1">Purchased via MoMo (Last 7d)</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">$1,850.00</p>
          <p className="text-slate-500 text-sm mt-1">Redeemed / Spent (Last 7d)</p>
        </div>
      </div>

      {/* Member Wallet Search & List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Member Wallets</h3>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Find member wallet..." 
               className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
             />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Member</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Balance (USD)</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Last Activity</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_MEMBERS.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                    <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-bold text-indigo-700">${member.tokenBalance.toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-green-500" />
                    <span>Bought $10.00</span>
                  </div>
                  <span className="text-xs text-slate-400">2 days ago</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                   <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 hover:bg-indigo-50 rounded">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenWallet;