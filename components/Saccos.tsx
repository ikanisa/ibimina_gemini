
import React, { useState } from 'react';
import { Building, MapPin, Users, ArrowRight, MoreHorizontal, X, Settings, CreditCard, Briefcase, Search, Filter, Plus, ChevronLeft, ChevronRight, Download, Edit } from 'lucide-react';
import { MOCK_SACCOS } from '../constants';
import { Sacco, ViewState } from '../types';

interface SaccosProps {
  onNavigate?: (view: ViewState) => void;
}

const Saccos: React.FC<SaccosProps> = ({ onNavigate }) => {
  const [selectedSacco, setSelectedSacco] = useState<Sacco | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Mock pagination logic
  const itemsPerPage = 10;
  const filteredSaccos = MOCK_SACCOS.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredSaccos.length / itemsPerPage);

  return (
    <div className="relative h-full flex flex-col">
      <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedSacco ? 'w-1/2 pr-4' : 'w-full'}`}>
        
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search SACCOs by name or code..." 
                   className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
           <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none">
                <Filter size={16} /> Filter
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none">
                <Download size={16} /> Export
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-1 sm:flex-none">
                <Plus size={16} /> Add SACCO
              </button>
           </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
           <div className="overflow-y-auto flex-1">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SACCO</th>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supervisor</th>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Branches</th>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Members</th>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Assets (RWF)</th>
                       <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                       <th className="px-6 py-3 w-10"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredSaccos.map(sacco => (
                       <tr 
                         key={sacco.id} 
                         onClick={() => setSelectedSacco(sacco)}
                         className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${selectedSacco?.id === sacco.id ? 'bg-blue-50' : ''}`}
                       >
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                                   {sacco.code.substring(0, 2)}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900">{sacco.name}</p>
                                   <p className="text-xs text-slate-500 font-mono">{sacco.code}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{sacco.supervisor}</td>
                          <td className="px-6 py-4 text-center">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                               {sacco.branchesCount}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-slate-600">
                             {sacco.membersCount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                             {sacco.totalAssets.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                sacco.status === 'Active' ? 'bg-green-50 text-green-700' : 
                                sacco.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' : 
                                'bg-red-50 text-red-700'
                             }`}>
                                {sacco.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                             <ChevronRight size={16} />
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           {/* Pagination Footer */}
           <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500">Showing {filteredSaccos.length} records</span>
              <div className="flex items-center gap-2">
                 <button className="p-1 rounded hover:bg-slate-200 disabled:opacity-50" disabled={currentPage === 1}>
                    <ChevronLeft size={16} className="text-slate-600" />
                 </button>
                 <span className="text-xs font-medium text-slate-700">Page {currentPage} of {Math.max(1, totalPages)}</span>
                 <button className="p-1 rounded hover:bg-slate-200 disabled:opacity-50" disabled={currentPage === totalPages}>
                    <ChevronRight size={16} className="text-slate-600" />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* SACCO Detail Drawer */}
      {selectedSacco && (
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white rounded-l-xl shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300 z-20">
           <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                 <h2 className="text-xl font-bold text-slate-900">{selectedSacco.name}</h2>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{selectedSacco.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                       selectedSacco.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                    }`}>{selectedSacco.status}</span>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="Edit SACCO Details">
                    <Edit size={18} />
                 </button>
                 <button onClick={() => setSelectedSacco(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                    <X size={20} />
                 </button>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-bold text-blue-600 uppercase">Total Assets</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{selectedSacco.totalAssets.toLocaleString()} <span className="text-xs font-normal text-slate-500">RWF</span></p>
                 </div>
                 <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase">Member Base</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{selectedSacco.membersCount.toLocaleString()}</p>
                 </div>
              </div>

              {/* Branch List */}
              <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">Branches ({selectedSacco.branchesCount})</h3>
                    <button className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
                       <Plus size={12} /> Add Branch
                    </button>
                 </div>
                 <div className="space-y-3">
                    {[1, 2, 3, 4].slice(0, selectedSacco.branchesCount).map(i => (
                       <div key={i} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-slate-50 cursor-pointer group">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                B{i}
                             </div>
                             <div>
                                <p className="font-medium text-sm text-slate-900">Branch 0{i} - Main St</p>
                                <p className="text-xs text-slate-500">Manager: John Doe • +250 788...</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Active</span>
                             <ChevronRight size={14} className="text-slate-300" />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              
              {/* Configuration */}
              <div className="pt-6 border-t border-slate-100">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Settings size={16} /> Configuration
                 </h3>
                 <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => onNavigate && onNavigate(ViewState.ACCOUNTS)}
                      className="w-full text-left p-4 text-sm text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between group"
                    >
                       <div className="flex items-center gap-3">
                          <CreditCard size={18} className="text-slate-400 group-hover:text-blue-600" />
                          <span>Loan & Savings Products</span>
                       </div>
                       <ArrowRight size={14} className="text-slate-300" />
                    </button>
                    <button 
                      onClick={() => onNavigate && onNavigate(ViewState.STAFF)}
                      className="w-full text-left p-4 text-sm text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between group"
                    >
                       <div className="flex items-center gap-3">
                          <Users size={18} className="text-slate-400 group-hover:text-blue-600" />
                          <span>Staff Assignments</span>
                       </div>
                       <ArrowRight size={14} className="text-slate-300" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Saccos;
