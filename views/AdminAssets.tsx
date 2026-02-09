
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ArrowRight, Calendar, ChevronDown, Package, Laptop, Camera, Smartphone, Tablet, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { fetchAssets, fetchAssetsForExport } from '../services/assetService';
import { Asset } from '../types';

export const AdminAssets = () => {
  const { navigate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Filters (Removed QR Status)
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  
  // Export
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Data
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data
  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true);
      try {
        const response = await fetchAssets({
          search: debouncedSearch,
          category: filterCategory,
          status: filterStatus,
          startDate: dateStart,
          endDate: dateEnd,
          page: currentPage,
          limit: itemsPerPage,
        });
        setAssets(response.data || []);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 0);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        setAssets([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };
    loadAssets();
  }, [debouncedSearch, filterCategory, filterStatus, dateStart, dateEnd, currentPage]);

  const currentAssets = assets;

  const categoryOptions = [
    { value: 'All', label: 'Category: All' },
    { value: 'Laptop', label: 'Laptop', icon: <Laptop size={14}/> },
    { value: 'Camera', label: 'Camera', icon: <Camera size={14}/> },
    { value: 'Mobile', label: 'Mobile', icon: <Smartphone size={14}/> },
    { value: 'Tablet', label: 'Tablet', icon: <Tablet size={14}/> },
    { value: 'Other', label: 'Other' },
  ];

  const statusOptions = [
      { value: 'All', label: 'Status: All' },
      { value: 'Active', label: 'Active' },
      { value: 'Maintenance', label: 'Maintenance' },
      { value: 'Retired', label: 'Retired' },
      { value: 'Lost', label: 'Lost' },
  ];

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    setIsExportDropdownOpen(false);
    
    try {
      const response = await fetchAssetsForExport({
        search: debouncedSearch,
        category: filterCategory,
        status: filterStatus,
        startDate: dateStart,
        endDate: dateEnd,
      });

      // Handle different response structures
      let exportData = response;
      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          exportData = response.data;
        } else if (Array.isArray(response)) {
          exportData = response;
        }
      }

      // Validate data is an array
      if (!Array.isArray(exportData)) {
        console.error('Invalid export data format:', response);
        throw new Error('Invalid data format received from server');
      }

      if (exportData.length === 0) {
        alert('No data to export');
        setIsExporting(false);
        return;
      }

      if (format === 'excel') {
        await exportToExcel(exportData);
      } else {
        await exportToPDF(exportData);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (data: any[]) => {
    // Dynamic import to reduce bundle size
    const XLSX = await import('xlsx');
    
    const worksheetData = data.map((asset) => ({
      'QR Code': asset.qrCode || asset.qrCode === null ? asset.qrCode || 'Not Assigned' : 'Not Assigned',
      'Asset Name': asset.name || 'N/A',
      'Category': asset.category || 'N/A',
      'Serial Number': asset.serialNumber || 'N/A',
      'Status': asset.status || 'N/A',
      'Location': asset.location || 'N/A',
      'Last Verified': asset.lastVerifiedAt ? new Date(asset.lastVerifiedAt).toLocaleDateString() : 'Never',
      'Created Date': asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
    
    // Auto-size columns
    const maxWidth = 30;
    const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth)
    }));
    worksheet['!cols'] = colWidths;

    const fileName = `assets-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = async (data: any[]) => {
    // Dynamic import to reduce bundle size
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Asset Management Report', 14, 20);
    
    // Export date
    doc.setFontSize(10);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Table
    const tableData = data.map((asset) => [
      asset.qrCode || 'Not Assigned',
      asset.name || 'N/A',
      asset.category || 'N/A',
      asset.serialNumber || 'N/A',
      asset.status || 'N/A',
      asset.location || 'N/A',
      asset.lastVerifiedAt ? new Date(asset.lastVerifiedAt).toLocaleDateString() : 'Never',
    ]);

    autoTable(doc, {
      head: [['QR Code', 'Name', 'Category', 'Serial', 'Status', 'Location', 'Last Verified']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const fileName = `assets-export-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
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
            
            {/* Filter Group - Removed Add Button */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto min-w-[500px]">
                <CustomSelect 
                    value={filterCategory} 
                    onChange={setFilterCategory} 
                    options={categoryOptions} 
                />
                <CustomSelect 
                    value={filterStatus} 
                    onChange={setFilterStatus} 
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
                            {dateStart || dateEnd ? `${dateStart ? dateStart : '...'} - ${dateEnd ? dateEnd : '...'}` : 'Date Range'}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDateDropdownOpen && (
                        /* ADDED right-0 to fix clipping */
                        <div className="absolute top-full right-0 w-full md:w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 mt-2 p-4 z-20 animate-in fade-in zoom-in duration-200">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">From</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-slate-200"
                                        value={dateStart}
                                        onChange={e => setDateStart(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">To</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:text-slate-200"
                                        value={dateEnd}
                                        onChange={e => setDateEnd(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => { setDateStart(''); setDateEnd(''); setIsDateDropdownOpen(false); }}
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

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                disabled={isExporting}
                className={`flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all ${
                  isExporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Download size={18} />
                {isExporting ? 'Exporting...' : 'Export'}
                {!isExporting && <ChevronDown size={16} className={`transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />}
              </button>

              {isExportDropdownOpen && !isExporting && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-3 transition-colors"
                  >
                    <FileSpreadsheet size={16} />
                    Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-3 border-t border-slate-50 dark:border-slate-700 transition-colors"
                  >
                    <FileText size={16} />
                    Export as PDF
                  </button>
                </div>
              )}
              {isExportDropdownOpen && !isExporting && <div className="fixed inset-0 z-10" onClick={() => setIsExportDropdownOpen(false)}></div>}
            </div>
          </div>
      </div>

      {/* Asset Grid/Table */}
      <div className="space-y-4">
          {/* Updated Column Headers */}
          <div className="hidden md:grid grid-cols-12 px-6 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <div className="col-span-1">Image</div>
              <div className="col-span-3">Asset Name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Serial Number</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
          </div>

          {loading ? (
              <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <div className="text-lg text-slate-600 dark:text-slate-400">Loading assets...</div>
              </div>
          ) : currentAssets.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="text-slate-300 dark:text-slate-500" size={24} />
                  </div>
                  <h3 className="text-slate-800 dark:text-slate-200 font-medium">No assets found</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
          ) : (
              currentAssets.map(asset =>
              <div key={asset.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col md:grid md:grid-cols-12 items-center gap-4">
                  
                  {/* Thumbnail Image */}
                  <div className="col-span-1 flex justify-center md:justify-start w-full">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {asset.imageUrl ? (
                              <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                          ) : (
                              <Package className="text-slate-400 dark:text-slate-500" size={24} />
                          )}
                      </div>
                  </div>

                  {/* Asset Name - Updated ID format - REMOVED font-mono */}
                  <div className="col-span-3 w-full text-center md:text-left">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{asset.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        QR: {asset.qrCode || 'Not Assigned'}
                      </p>
                  </div>
                  
                  {/* Category */}
                  <div className="col-span-2 w-full flex md:block justify-between">
                      <span className="md:hidden text-sm text-slate-400">Category:</span>
                      <span className="px-3 py-1 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium border border-slate-100 dark:border-slate-600">{asset.category}</span>
                  </div>

                   {/* Serial Number */}
                   <div className="col-span-2 w-full flex md:block justify-between">
                       <span className="md:hidden text-sm text-slate-400">Serial:</span>
                       <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{asset.serialNumber}</span>
                   </div>

                  {/* Status */}
                  <div className="col-span-2 w-full flex md:block justify-between">
                      <span className="md:hidden text-sm text-slate-400">Status:</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          asset.status?.toUpperCase() === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 
                          asset.status?.toUpperCase() === 'MAINTENANCE' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' :
                          asset.status?.toUpperCase() === 'RETIRED' ? 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600' :
                          asset.status?.toUpperCase() === 'LOST' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' :
                          'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                      }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                              asset.status?.toUpperCase() === 'ACTIVE' ? 'bg-emerald-500' : 
                              asset.status?.toUpperCase() === 'MAINTENANCE' ? 'bg-amber-500' : 
                              asset.status?.toUpperCase() === 'RETIRED' ? 'bg-slate-400' :
                              asset.status?.toUpperCase() === 'LOST' ? 'bg-red-500' : 'bg-slate-400'
                          }`}></span>
                          {asset.status}
                      </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 dark:border-slate-700">
                      <button onClick={() => navigate('/assets/detail', { id: asset.id })} className="flex items-center gap-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                          View <ArrowRight size={16} />
                      </button>
                  </div>
              </div>
              )
          )}
      </div>
        
      {/* Pagination */}
      <div className="flex justify-between items-center pt-4">
            <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors"
                >
                    Previous
                </button>
                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors"
                >
                    Next
                </button>
            </div>
      </div>
    </div>
  );
};
