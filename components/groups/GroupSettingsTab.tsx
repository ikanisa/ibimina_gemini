/**
 * Group Settings Tab Component
 * 
 * Displays group configuration settings
 */

import React from 'react';
import { Save, Trash2 } from 'lucide-react';
import { Group } from '../../types';

interface GroupSettingsTabProps {
    group: Group;
}

export const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ group }) => {
    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Group Configuration</h3>
                <p className="text-sm text-slate-500">Manage rules, cycle parameters, and penalties.</p>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Group Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            defaultValue={group.name}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cycle Label</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            defaultValue={group.cycleLabel}
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 text-sm mb-4">Contribution Rules</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                Amount per Member
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                    defaultValue={group.contributionAmount}
                                />
                                <span className="absolute right-3 top-2 text-xs text-slate-400">RWF</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Frequency</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                defaultValue={group.contributionFrequency}
                            >
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <button className="flex items-center gap-2 text-red-600 text-sm font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                        <Trash2 size={16} /> Archive Group
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsTab;
