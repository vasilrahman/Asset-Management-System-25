
import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { VerificationLog } from '../types';
import { fetchVerifications, exportVerifications } from '../services/dashboardService';
import { CustomSelect } from '../components/CustomSelect';

export const AdminVerified = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);

  const loadVerifications = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching verifications...');
      const params = {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: limit,
      };
      const response = await fetchVerifications(params);
      console.log('Fetched data:', response);
      setLogs(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalRecords(response.meta?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch verifications:', err);
      
      // Handle specific errors
      if (err.response?.status === 401) {
        setError('Unauthorized. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load verification logs');
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const exportData = await exportVerifications(params);
      
      // Convert to CSV
      const csvContent = convertToCSV(exportData.data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `verifications_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Failed to export verifications:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: VerificationLog[]): string => {
    if (data.length === 0) return '';
    
    const headers = ['Asset Name', 'Category', 'Status', 'Serial Number', 'Location', 'Verified By', 'Verification Date'];
    const rows = data.map(log => [
      log.assetName || '',
      log.assetCategory || '',
      log.assetStatus || '',
      log.assetSerialNumber || '',
      log.assetLocation || '',
      log.verifiedBy || '',
      log.timestamp ? new Date(log.timestamp).toLocaleString() : ''
    ]);
    
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];
    
    return csvRows.join('\\n');
  };

  useEffect(() => {
    loadVerifications();
  }, [selectedCategory, selectedStatus, startDate, endDate, currentPage]);

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedStatus('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const categoryOptions = [
    { value: 'All', label: 'All Categories' },
    { value: 'Laptop', label: 'Laptop' },
    { value: 'Camera', label: 'Camera' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Retired', label: 'Retired' },
    { value: 'Lost', label: 'Lost' },
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
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                        <CheckCircle size={20} />
                        {totalRecords} Total
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting || logs.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Category</label>
                    <CustomSelect
                        value={selectedCategory}
                        onChange={(val) => {
                            setSelectedCategory(val);
                            setCurrentPage(1);
                        }}
                        options={categoryOptions}
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Status</label>
                    <CustomSelect
                        value={selectedStatus}
                        onChange={(val) => {
                            setSelectedStatus(val);
                            setCurrentPage(1);
                        }}
                        options={statusOptions}
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all text-sm dark:text-slate-100"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all text-sm dark:text-slate-100"
                    />
                </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategory !== 'All' || selectedStatus !== 'All' || startDate || endDate) && (
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
         <>
           <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
             <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <tr>
                              <th className="px-6 py-4">Asset Name</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Serial Number</th>
                              <th className="px-6 py-4">Location</th>
                              <th className="px-6 py-4">Verified By</th>
                              <th className="px-6 py-4 text-right">Verification Date</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {(logs || []).map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{log.assetName}</td>
                                  <td className="px-6 py-4">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                          {log.assetCategory || 'N/A'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                                          log.assetStatus === 'Active' || log.assetStatus === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                                          log.assetStatus === 'Maintenance' || log.assetStatus === 'MAINTENANCE' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                          log.assetStatus === 'Retired' || log.assetStatus === 'RETIRED' ? 'bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300' :
                                          log.assetStatus === 'Lost' || log.assetStatus === 'LOST' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                          'bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                                      }`}>
                                          {(log.assetStatus === 'Active' || log.assetStatus === 'ACTIVE') && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                                          )}
                                          {log.assetStatus || 'N/A'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">{log.assetSerialNumber || 'N/A'}</td>
                                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{log.assetLocation || 'N/A'}</td>
                                  <td className="px-6 py-4">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                                          {log.verifiedBy}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">
                                      {new Date(log.timestamp || log.verifiedAt || '').toLocaleString()}
                                  </td>
                              </tr>
                          ))}
                          {(logs || []).length === 0 && (
                              <tr>
                                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                      No verification logs found.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
             </div>
           </div>

           {/* Pagination */}
           {totalPages > 1 && (
             <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
               <div className="flex items-center justify-between">
                 <div className="text-sm text-slate-600 dark:text-slate-400">
                   Showing page {currentPage} of {totalPages} ({totalRecords} total records)
                 </div>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={() => handlePageChange(currentPage - 1)}
                     disabled={currentPage === 1}
                     className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                   >
                     <ChevronLeft size={16} />
                     Previous
                   </button>
                   <div className="flex items-center gap-1">
                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                       let pageNum;
                       if (totalPages <= 5) {
                         pageNum = i + 1;
                       } else if (currentPage <= 3) {
                         pageNum = i + 1;
                       } else if (currentPage >= totalPages - 2) {
                         pageNum = totalPages - 4 + i;
                       } else {
                         pageNum = currentPage - 2 + i;
                       }
                       return (
                         <button
                           key={pageNum}
                           onClick={() => handlePageChange(pageNum)}
                           className={`px-3 py-2 rounded-xl transition-colors ${
                             currentPage === pageNum
                               ? 'bg-indigo-600 text-white'
                               : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                           }`}
                         >
                           {pageNum}
                         </button>
                       );
                     })}
                   </div>
                   <button
                     onClick={() => handlePageChange(currentPage + 1)}
                     disabled={currentPage === totalPages}
                     className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                   >
                     Next
                     <ChevronRight size={16} />
                   </button>
                 </div>
               </div>
             </div>
           )}
         </>
       )}
    </div>
  );
};
