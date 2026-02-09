
import React, { useState, useEffect } from 'react';
import { CheckCircle, Search, X, Calendar } from 'lucide-react';
import { VerificationLog } from '../types';
import { fetchVerifications, FetchVerificationsParams } from '../services/dashboardService';
import { CustomSelect } from '../components/CustomSelect';

export const AdminVerified = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVerifier, setSelectedVerifier] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Unique verifiers list
  const [verifiers, setVerifiers] = useState<string[]>([]);

  const loadVerifications = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching verifications...');
      const params: FetchVerificationsParams = {
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        verifiedBy: selectedVerifier !== 'All' ? selectedVerifier : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const data = await fetchVerifications(params);
      console.log('Fetched data:', data);
      setLogs(Array.isArray(data) ? data : []);
      
      // Extract unique verifiers
      if (Array.isArray(data)) {
        const uniqueVerifiers = Array.from(new Set(data.map(log => log.verifiedBy)));
        setVerifiers(uniqueVerifiers);
      }
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
      setError('Failed to load verification logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, [searchQuery, selectedCategory, selectedVerifier, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedVerifier('All');
    setStartDate('');
    setEndDate('');
  };

  const categoryOptions = [
    { value: 'All', label: 'All Categories' },
    { value: 'Laptop', label: 'Laptop' },
    { value: 'Camera', label: 'Camera' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Other', label: 'Other' },
  ];

  const verifierOptions = [
    { value: 'All', label: 'All Verifiers' },
    ...verifiers.map(v => ({ value: v, label: v }))
  ];

  return (
    <div className="space-y-6">
       {/* Filter Controls */}
       <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Verification Logs</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Filter and view asset verification history</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle size={20} />
                    {logs?.length || 0} Total Verified
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by Asset ID or Name..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all text-sm dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* Category */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Category</label>
                    <CustomSelect
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={categoryOptions}
                    />
                </div>

                {/* Verified By */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Verified By</label>
                    <CustomSelect
                        value={selectedVerifier}
                        onChange={setSelectedVerifier}
                        options={verifierOptions}
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all text-sm dark:text-slate-100"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all text-sm dark:text-slate-100"
                    />
                </div>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || selectedCategory !== 'All' || selectedVerifier !== 'All' || startDate || endDate) && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <X size={16} />
                        Clear Filters
                    </button>
                </div>
            )}
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
