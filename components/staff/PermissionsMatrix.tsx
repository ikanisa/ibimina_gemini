/**
 * Staff Permissions Matrix Component
 * 
 * Role-based access control matrix editor
 */

import React, { useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { StaffRole } from '../../types';

interface PermissionsMatrixProps {
    selectedRole: StaffRole;
    onRoleChange: (role: StaffRole) => void;
}

const FEATURES = ['Members', 'Savings', 'Loans', 'Tokens', 'NFC Operations', 'Reconciliation', 'Reports', 'Settings'];
const PERMISSIONS = ['View', 'Create', 'Edit', 'Approve', 'Delete'];

const DEFAULT_PERMISSIONS: Record<string, boolean> = {
    'Members-View': true, 'Members-Create': true, 'Members-Edit': true,
    'Savings-View': true, 'Savings-Create': true,
    'Loans-View': true, 'Loans-Create': true, 'Loans-Approve': true,
};

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
    selectedRole,
    onRoleChange
}) => {
    const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>(DEFAULT_PERMISSIONS);

    const togglePermission = (feature: string, perm: string) => {
        const key = `${feature}-${perm}`;
        setRolePermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                        Configuring Permissions For:
                    </label>
                    <select
                        className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 p-2.5"
                        value={selectedRole}
                        onChange={(e) => onRoleChange(e.target.value as StaffRole)}
                        aria-label="Select role to configure"
                    >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Branch Manager">Branch Manager</option>
                        <option value="Loan Officer">Loan Officer</option>
                        <option value="Teller">Teller</option>
                        <option value="Auditor">Auditor</option>
                    </select>
                </div>
                <div className="flex-1"></div>
                <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2 max-w-md">
                    <Shield size={16} className="shrink-0 mt-0.5" />
                    <p>Permissions update immediately. Be careful when granting 'Delete' or 'Approve' rights to lower-level roles.</p>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-slate-700 w-1/4">Feature Access</th>
                            {PERMISSIONS.map(perm => (
                                <th key={perm} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">
                                    {perm}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {FEATURES.map(feature => (
                            <tr key={feature} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-slate-800">{feature}</td>
                                {PERMISSIONS.map(perm => {
                                    const isChecked = rolePermissions[`${feature}-${perm}`];
                                    const isDisabled = selectedRole === 'Super Admin';
                                    const displayChecked = isDisabled ? true : isChecked;

                                    return (
                                        <td key={`${feature}-${perm}`} className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => !isDisabled && togglePermission(feature, perm)}
                                                disabled={isDisabled}
                                                className={`w-5 h-5 rounded border mx-auto flex items-center justify-center transition-colors ${displayChecked
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-white border-slate-300 hover:border-blue-400'
                                                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                aria-label={`${displayChecked ? 'Revoke' : 'Grant'} ${perm} permission for ${feature}`}
                                                aria-pressed={displayChecked}
                                            >
                                                {displayChecked && <Check size={12} className="text-white" aria-hidden="true" />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 mr-3">
                    Reset to Default
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default PermissionsMatrix;
