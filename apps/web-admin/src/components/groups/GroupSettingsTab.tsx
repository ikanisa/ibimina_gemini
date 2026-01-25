/**
 * GroupSettingsTab Component
 * Group configuration and settings
 */

import React from 'react';
import { Group } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui';
import { Save, Trash2 } from 'lucide-react';

interface GroupSettingsTabProps {
  group: Group;
}

export const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ group }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Group Configuration</CardTitle>
          <p className="text-sm text-slate-500">Manage rules, cycle parameters, and penalties.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  defaultValue={group.name}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Cycle Label
                </label>
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Frequency
                  </label>
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
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={16} />}
              >
                Archive Group
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Save size={16} />}>
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
