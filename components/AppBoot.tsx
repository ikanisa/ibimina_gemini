/**
 * AppBoot - Application Bootstrap & Diagnostics
 * 
 * Validates environment, checks auth, and displays errors instead of endless loading.
 */
import React, { useEffect, useState, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { clearAllAppCachesAndReload } from '../lib/pwa';

interface BootStatus {
    envValid: boolean;
    supabaseConnected: boolean | null;
    errors: string[];
    checking: boolean;
}

interface AppBootProps {
    children: ReactNode;
}

const REQUIRED_ENV_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
];

const AppBoot: React.FC<AppBootProps> = ({ children }) => {
    const [status, setStatus] = useState<BootStatus>({
        envValid: true,
        supabaseConnected: null,
        errors: [],
        checking: true
    });

    useEffect(() => {
        const checkBoot = async () => {
            const errors: string[] = [];

            // 1. Validate environment variables
            const missingVars = REQUIRED_ENV_VARS.filter(
                varName => !import.meta.env[varName]
            );

            if (missingVars.length > 0) {
                errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
            }

            // 2. Check Supabase connection
            let supabaseConnected = false;
            if (missingVars.length === 0) {
                try {
                    // Simple health check - fetch 1 row from institutions
                    const { error } = await supabase
                        .from('institutions')
                        .select('id')
                        .limit(1);

                    if (error) {
                        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
                            errors.push(`Database access denied (RLS): ${error.message}`);
                        } else if (error.code === '42P01') {
                            errors.push(`Database table not found: ${error.message}`);
                        } else {
                            errors.push(`Database error: ${error.message}`);
                        }
                    } else {
                        supabaseConnected = true;
                    }
                } catch (err) {
                    errors.push(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }

            setStatus({
                envValid: missingVars.length === 0,
                supabaseConnected,
                errors,
                checking: false
            });
        };

        checkBoot();
    }, []);

    const handleRetry = () => {
        setStatus(prev => ({ ...prev, checking: true, errors: [] }));
        window.location.reload();
    };

    // Still checking
    if (status.checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                    <p className="text-sm font-medium">Initializing application...</p>
                </div>
            </div>
        );
    }

    // Has errors
    if (status.errors.length > 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white border border-red-200 rounded-2xl shadow-lg p-8 max-w-lg w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Application Boot Failed</h1>
                            <p className="text-sm text-slate-500">Unable to initialize the application</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        {status.errors.map((error, i) => (
                            <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
                                <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-red-800 font-mono break-all">{error}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2 mb-6 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            {status.envValid ? (
                                <CheckCircle2 className="text-green-500" size={14} />
                            ) : (
                                <XCircle className="text-red-500" size={14} />
                            )}
                            <span>Environment variables</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {status.supabaseConnected ? (
                                <Wifi className="text-green-500" size={14} />
                            ) : (
                                <WifiOff className="text-red-500" size={14} />
                            )}
                            <span>Supabase connection</span>
                        </div>
                    </div>

                    <button
                        onClick={handleRetry}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>

                    <button
                        onClick={() => clearAllAppCachesAndReload()}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-3 rounded-lg transition-colors"
                    >
                        Clear cache & reload
                    </button>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 text-center">
                            If this persists, check your .env file and Supabase project settings.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // All good - render children
    return <>{children}</>;
};

export default AppBoot;
