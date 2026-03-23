
import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Calendar, Download, ChevronLeft, ChevronRight, ChevronDown, FileSpreadsheet, FileText, Search, RefreshCw } from 'lucide-react';
import { VerificationLog } from '../types';
import { fetchVerifications, exportVerifications } from '../services/dashboardService';
import { CustomSelect } from '../components/CustomSelect';

export const AdminVerified = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(5);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadVerifications = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching verifications...');
      const params = {
        search: debouncedSearch || undefined,
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

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    setIsExportDropdownOpen(false);
    
    try {
      const params = {
        search: debouncedSearch || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const exportData = await exportVerifications(params);
      
      // Handle different response structures
      let data: VerificationLog[] = [];
      if (exportData && typeof exportData === 'object') {
        if (Array.isArray(exportData.data)) {
          data = exportData.data;
        } else if (Array.isArray(exportData)) {
          data = exportData as VerificationLog[];
        }
      }

      // Validate data is an array
      if (!Array.isArray(data) || data.length === 0) {
        if (data.length === 0) {
          alert('No data to export');
        } else {
          console.error('Invalid export data format:', exportData);
          throw new Error('Invalid data format received from server');
        }
        setExporting(false);
        return;
      }

      if (format === 'excel') {
        await exportToExcel(data);
      } else {
        await exportToPDF(data);
      }
    } catch (err: any) {
      console.error('Failed to export verifications:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async (data: VerificationLog[]) => {
    // Dynamic import to reduce bundle size
    const XLSX = await import('xlsx');
    
    const worksheetData = data.map((log) => ({
      'Asset ID': log.assetId || 'N/A',
      'Asset Name': log.assetName || 'N/A',
      'Verified By': log.verifiedBy || 'N/A',
      'Timestamp': (log.timestamp || log.verifiedAt) ? new Date(log.timestamp || log.verifiedAt || '').toLocaleString() : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verifications');
    
    // Auto-size columns
    const maxWidth = 30;
    const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth)
    }));
    worksheet['!cols'] = colWidths;

    const fileName = `verifications-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = async (data: VerificationLog[]) => {
    // Dynamic import to reduce bundle size
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Verification Logs Report', 14, 20);
    
    // Export date
    doc.setFontSize(10);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Table
    const tableData = data.map((log) => [
      log.assetId || 'N/A',
      log.assetName || 'N/A',
      log.verifiedBy || 'N/A',
      (log.timestamp || log.verifiedAt) ? new Date(log.timestamp || log.verifiedAt || '').toLocaleString() : 'N/A',
    ]);

    autoTable(doc, {
      head: [['Asset ID', 'Asset Name', 'Verified By', 'Timestamp']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const fileName = `verifications-export-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  useEffect(() => {
    loadVerifications();
  }, [debouncedSearch, selectedCategory, selectedStatus, startDate, endDate, currentPage]);

  const calculatedTotalPages = Math.max(currentPage, totalPages);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadVerifications();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= calculatedTotalPages) {
      setCurrentPage(newPage);
    }
  };

  const categoryOptions = [
    { value: 'All', label: 'Category: All' },
    { value: 'Laptop', label: 'Laptop' },
    { value: 'Camera', label: 'Camera' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'All', label: 'Status: All' },
    { value: 'Active', label: 'Active' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Retired', label: 'Retired' },
    { value: 'Lost', label: 'Lost' },
  ];

  return (
    <div className="space-y-6">
       {/* Filter Controls */}
       <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 transition-colors duration-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by ID, Name, Serial..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 dark:focus:ring-indigo-900/50 transition-all outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Filter Group */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto min-w-[500px]">
                <CustomSelect 
                    value={selectedCategory} 
                    onChange={setSelectedCategory} 
                    options={categoryOptions} 
                />
                <CustomSelect 
                    value={selectedStatus} 
                    onChange={setSelectedStatus} 
                    options={statusOptions} 
                />

                {/* Date Range Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                        className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:border-indigo-200 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all ${
                            isDateDropdownOpen ? 'ring-2 ring-indigo-100 dark:ring-indigo-900 border-indigo-200 dark:border-indigo-800' : ''
                        }`}
                    >
                        <span className="flex items-center gap-2 truncate">
                            <Calendar size={16} className="text-slate-400" />
                            {startDate || endDate ? `${startDate ? startDate : '...'} - ${endDate ? endDate : '...'}` : 'Date Range'}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDateDropdownOpen && (
                        <div className="absolute top-full right-0 w-full md:w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 mt-2 p-4 z-20 animate-in fade-in zoom-in duration-200">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">From</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-slate-200"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">To</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-slate-200"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => { setStartDate(''); setEndDate(''); setIsDateDropdownOpen(false); }}
                                    className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    Clear Dates
                                </button>
                            </div>
                        </div>
                    )}
                    {isDateDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsDateDropdownOpen(false)}></div>}
                </div>
            </div>
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
         <>
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
                                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400 text-sm">{log.assetId}</td>
                                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{log.assetName}</td>
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
                                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                      No verification logs found.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
             </div>
           </div>

           {/* Pagination and Export */}
           <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
             <div className="flex items-center justify-between">
               {/* Export Button - Bottom Left */}
               <div className="relative">
                 <button
                   onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                   disabled={exporting || logs.length === 0}
                   className={`flex items-center gap-2 bg-indigo-900 text-blue-100 px-6 py-3 rounded-xl text-sm font-medium shadow-lg shadow-indigo-900/30 dark:shadow-none hover:bg-indigo-950 transition-all ${
                     exporting || logs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                   }`}
                 >
                   <Download size={18} />
                   {exporting ? 'Exporting...' : 'Export'}
                   {!exporting && logs.length > 0 && <ChevronDown size={16} className={`transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />}
                 </button>

                 {isExportDropdownOpen && !exporting && logs.length > 0 && (
                   <div className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                     <button
                       onClick={() => handleExport('excel')}
                       className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-3 transition-colors"
                     >
                       <FileSpreadsheet size={16} />
                       Export as Excel
                     </button>
                     <button
                       onClick={() => handleExport('pdf')}
                       className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-3 border-t border-slate-50 dark:border-slate-700 transition-colors"
                     >
                       <FileText size={16} />
                       Export as PDF
                     </button>
                   </div>
                 )}
                 {isExportDropdownOpen && !exporting && logs.length > 0 && <div className="fixed inset-0 z-10" onClick={() => setIsExportDropdownOpen(false)}></div>}
               </div>

               {/* Pagination Info - Centered */}
               <div className="text-sm text-slate-600 dark:text-slate-400">
                 {calculatedTotalPages > 1 ? (
                   <>Showing page {currentPage} of {calculatedTotalPages} ({totalRecords} total records)</>
                 ) : (
                   <>{totalRecords} total record{totalRecords !== 1 ? 's' : ''}</>
                 )}
               </div>

               {/* Pagination Buttons */}
               {calculatedTotalPages > 1 ? (
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
                     {Array.from({ length: Math.min(5, calculatedTotalPages) }, (_, i) => {
                       let pageNum;
                       if (calculatedTotalPages <= 5) {
                         pageNum = i + 1;
                       } else if (currentPage <= 3) {
                         pageNum = i + 1;
                       } else if (currentPage >= calculatedTotalPages - 2) {
                         pageNum = calculatedTotalPages - 4 + i;
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
                     disabled={currentPage === calculatedTotalPages}
                     className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                   >
                     Next
                     <ChevronRight size={16} />
                   </button>
                 </div>
               ) : (
                 <div className="w-[200px]"></div>
               )}
             </div>
           </div>
         </>
       )}
    </div>
  );
};
