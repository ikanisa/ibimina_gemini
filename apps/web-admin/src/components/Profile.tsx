import React from 'react';
import {
  Mail,
  Building,
  Shield,
  Clock,
  KeyRound,
  CheckCircle2,
  Activity,
  Fingerprint,
  LogOut
} from 'lucide-react';
import { StaffMember } from '../types';

interface ProfileProps {
  user: StaffMember;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header / ID Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-sm overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 rounded-xl border-4 border-white dark:border-neutral-700 shadow-md overflow-hidden bg-slate-100 dark:bg-neutral-700">
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">{user.name}</h1>
                <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400 text-sm">
                  <Mail size={14} /> {user.email}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${user.status === 'Active' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                }`}>
                {user.status}
              </span>
              <span className="text-xs text-slate-400 dark:text-neutral-500">Staff ID: {user.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-100 dark:border-neutral-700 pt-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-900 rounded-lg border border-slate-100 dark:border-neutral-700">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-neutral-500 uppercase font-semibold">Role</p>
                <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">{user.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-900 rounded-lg border border-slate-100 dark:border-neutral-700">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                <Building size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-neutral-500 uppercase font-semibold">Branch</p>
                <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">{user.branch}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-900 rounded-lg border border-slate-100 dark:border-neutral-700">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-neutral-500 uppercase font-semibold">Last Login</p>
                <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">{user.lastLogin}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <KeyRound size={20} className="text-slate-400 dark:text-neutral-500" />
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-neutral-700">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">Two-Factor Auth</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500">Enabled via Authenticator App</p>
                </div>
                <CheckCircle2 size={18} className="text-green-500 dark:text-green-400" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-neutral-700">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">Password Expiry</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500">Expires in 45 days</p>
                </div>
                <button className="text-xs text-blue-600 dark:text-primary-400 hover:underline">Change</button>
              </div>
              <button className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-neutral-600 transition-colors">
                <Fingerprint size={16} /> Manage Devices
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-neutral-100 mb-4">Shift Status</h3>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">On Duty</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500">Shift started at 08:00 AM</p>
            </div>
            <button className="w-full border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <LogOut size={16} /> End Shift & Logout
            </button>
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <Activity size={20} className="text-slate-400 dark:text-neutral-500" />
              Recent Activity
            </h3>
            <select className="text-xs border-none bg-slate-100 dark:bg-neutral-700 rounded-lg px-3 py-1.5 outline-none text-slate-600 dark:text-neutral-300">
              <option>Today</option>
              <option>Yesterday</option>
              <option>This Week</option>
            </select>
          </div>

          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-500">10:4{i} AM</span>
                  <div className="w-0.5 h-full bg-slate-100 dark:bg-neutral-700"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-neutral-200">
                    {i % 2 === 0 ? 'Processed Loan Application #L-9921' : 'Recorded Cash Deposit'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 mt-0.5">
                    Action performed on behalf of Member <span className="text-blue-600 dark:text-primary-400 font-medium">M-100{i}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-neutral-700 text-center">
            <button className="text-sm text-blue-600 dark:text-primary-400 font-medium hover:underline">View Full Audit Log</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;