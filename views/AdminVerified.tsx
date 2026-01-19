
import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { VerificationLog } from '../types';
import { fetchVerifications } from '../services/dashboardService';

export const AdminVerified = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVerifications = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching verifications...');
        const data = await fetchVerifications();
        console.log('Fetched data:', data);
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch verifications:', err);
        setError('Failed to load verification logs');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    loadVerifications();
  }, []);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Verification History</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">View a log of all asset verifications performed by staff.</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle size={20} />
                {logs?.length || 0} Total Verified
            </div>
       </div>

       {loading ? (
         <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-center transition-colors duration-200">
           <div className="text-lg text-slate-600 dark:text-slate-400">Loading verification logs...</div>
         </div>
       ) : error ? (
         <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-red-200 dark:border-red-800 shadow-sm text-center transition-colors duration-200">
           <div className="text-lg text-red-600 dark:text-red-400">{error}</div>
         </div>
       ) : (
         <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
           <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Asset ID</th>
                            <th className="px-6 py-4">Asset Name</th>
                            <th className="px-6 py-4">Verified By</th>
                            <th className="px-6 py-4 text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {(logs || []).map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{log.assetId}</td>
                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{log.assetName}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                                        {log.verifiedBy}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {(logs || []).length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    No verification logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
           </div>
       </div>
       )}
    </div>
  );
};
