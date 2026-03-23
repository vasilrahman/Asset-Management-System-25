
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Search, ChevronLeft, ChevronRight, X, Download, ChevronDown, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import { Complaint } from '../types';
import { fetchComplaints, exportComplaints } from '../services/dashboardService';

export const AdminComplaints = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Resolved'>('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit] = useState(5);

    const loadComplaints = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                search: searchTerm || undefined,
                status: statusFilter !== 'All' ? statusFilter : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                page: currentPage,
                limit: limit,
            };
            const response = await fetchComplaints(params);
            setComplaints(response.data || []);
            setTotalPages(response.meta?.totalPages || 1);
            setTotalRecords(response.meta?.total || 0);
        } catch (err: any) {
            console.error('Failed to fetch complaints:', err);
            
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
                setError('Failed to load complaints');
            }
            setComplaints([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComplaints();
    }, [searchTerm, statusFilter, startDate, endDate, currentPage]);

    const resolveComplaint = async (complaintId: string) => {
        if (resolvingId) return; // Prevent multiple simultaneous resolves

        setResolvingId(complaintId);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${apiBaseUrl}/admin/complaints/${complaintId}/resolve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to resolve complaint');
            }

            // Reload complaints to get updated data
            await loadComplaints();
        } catch (err) {
            console.error('Failed to resolve complaint:', err);
            // Could show a toast notification here, but for now just log
        } finally {
            setResolvingId(null);
        }
    };

    const handleExport = async (format: 'excel' | 'pdf') => {
        setIsExporting(true);
        setIsExportDropdownOpen(false);
        
        try {
            const params = {
                search: searchTerm || undefined,
                status: statusFilter !== 'All' ? statusFilter : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            };
            const exportData = await exportComplaints(params);
            
            // Handle different response structures
            let data: Complaint[] = [];
            if (exportData && typeof exportData === 'object') {
                if (Array.isArray(exportData.data)) {
                    data = exportData.data;
                } else if (Array.isArray(exportData)) {
                    data = exportData as Complaint[];
                }
            }

            if (data.length === 0) {
                alert('No data to export');
                setIsExporting(false);
                return;
            }

            if (format === 'excel') {
                await exportToExcel(data);
            } else {
                await exportToPDF(data);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const exportToExcel = async (data: any[]) => {
        const XLSX = await import('xlsx');
        
        const worksheetData = data.map((complaint) => ({
            'Asset Name': complaint.assetName || 'N/A',
            'Asset ID': complaint.assetId || 'N/A',
            'Status': complaint.status || 'N/A',
            'Description': complaint.description || 'N/A',
            'Reported By': complaint.reportedBy || 'N/A',
            'Date': complaint.date || complaint.timestamp ? new Date(complaint.date || complaint.timestamp).toLocaleString() : 'N/A',
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');
        
        const maxWidth = 30;
        const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
            wch: Math.min(Math.max(key.length, 10), maxWidth)
        }));
        worksheet['!cols'] = colWidths;

        const fileName = `complaints-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const exportToPDF = async (data: any[]) => {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;
        
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Complaints Report', 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 28);
        
        const tableData = data.map((complaint) => [
            complaint.assetName || 'N/A',
            complaint.assetId || 'N/A',
            complaint.status || 'N/A',
            complaint.description ? complaint.description.substring(0, 50) + '...' : 'N/A',
            complaint.reportedBy || 'N/A',
            complaint.date || complaint.timestamp ? new Date(complaint.date || complaint.timestamp).toLocaleDateString() : 'N/A',
        ]);

        autoTable(doc, {
            head: [['Asset Name', 'Asset ID', 'Status', 'Description', 'Reported By', 'Date']],
            body: tableData,
            startY: 35,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        const fileName = `complaints-export-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Filter Section */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto min-w-[350px]">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as 'All' | 'Pending' | 'Resolved');
                                setCurrentPage(1);
                            }}
                            className="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:border-indigo-200 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all"
                        >
                            <option value="All">Status: All</option>
                            <option value="Pending">Pending</option>
                            <option value="Resolved">Resolved</option>
                        </select>

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
                    <div className="text-lg text-slate-600 dark:text-slate-400">Loading complaints...</div>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-red-200 dark:border-red-800 shadow-sm text-center transition-colors duration-200">
                    <div className="text-lg text-red-600 dark:text-red-400">{error}</div>
                </div>
            ) : (
                <>
                    {complaints.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                            <AlertTriangle className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white">No Complaints Found</h3>
                            <p className="text-slate-400 dark:text-slate-500">
                                Everything is running smoothly.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">ASSET NAME</th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">ASSET ID</th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">STATUS</th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">DATE</th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {complaints.map(complaint => (
                                            <tr key={complaint.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                                                    {complaint.assetName}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {complaint.assetId}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${
                                                        complaint.status === 'Pending' || complaint.status === 'PENDING'
                                                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                        }`}>
                                                        {complaint.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(complaint.date || complaint.timestamp || '').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button 
                                                        onClick={() => setSelectedComplaint(complaint)}
                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors">
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                {/* Pagination and Export */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                    <div className="flex items-center justify-between">
                        {/* Export Button - Bottom Left */}
                        <div className="relative">
                            <button
                                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                disabled={isExporting || complaints.length === 0}
                                className={`flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all ${
                                    isExporting || complaints.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <Download size={18} />
                                {isExporting ? 'Exporting...' : 'Export'}
                                {!isExporting && complaints.length > 0 && <ChevronDown size={16} className={`transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />}
                            </button>

                            {isExportDropdownOpen && !isExporting && complaints.length > 0 && (
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
                            {isExportDropdownOpen && !isExporting && complaints.length > 0 && <div className="fixed inset-0 z-10" onClick={() => setIsExportDropdownOpen(false)}></div>}
                        </div>

                        {/* Pagination Info - Centered */}
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            {totalPages > 1 ? (
                                <>Showing page {currentPage} of {totalPages} ({totalRecords} total complaints)</>
                            ) : (
                                <>{totalRecords} total complaint{totalRecords !== 1 ? 's' : ''}</>
                            )}
                        </div>

                        {/* Pagination Buttons */}
                        {totalPages > 1 ? (
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
                        ) : (
                            <div className="w-[200px]"></div>
                        )}
                    </div>
                </div>
            </>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <img 
                            src={selectedImage} 
                            alt="Complaint Evidence" 
                            className="w-full h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Complaint Detail Modal */}
            {selectedComplaint && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedComplaint(null)}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        selectedComplaint.status === 'Pending' || selectedComplaint.status === 'PENDING'
                                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                        {selectedComplaint.status}
                                    </span>
                                    <span className="text-sm text-slate-400 dark:text-slate-500">
                                        {new Date(selectedComplaint.date || selectedComplaint.timestamp || '').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} 
                                        {', '}
                                        {new Date(selectedComplaint.date || selectedComplaint.timestamp || '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {selectedComplaint.assetName} <span className="text-slate-400 dark:text-slate-500 font-normal text-base">({selectedComplaint.assetId})</span>
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Issue Section */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Issue</h3>
                                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {selectedComplaint.description}
                                </p>
                            </div>

                            {/* Reported By Section */}
                            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Reported By</h3>
                                <p className="text-base text-slate-700 dark:text-slate-300 font-semibold">
                                    {selectedComplaint.reportedBy}
                                </p>
                            </div>

                            {/* Asset Information Section */}
                            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Asset Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Asset Name</p>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedComplaint.assetName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Asset ID</p>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedComplaint.assetId}</p>
                                    </div>
                                    {selectedComplaint.assetSerialNumber && (
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Serial Number</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedComplaint.assetSerialNumber}</p>
                                        </div>
                                    )}
                                    {selectedComplaint.assetCategory && (
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Category</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedComplaint.assetCategory}</p>
                                        </div>
                                    )}
                                    {selectedComplaint.assetLocation && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Location</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedComplaint.assetLocation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Evidence Section */}
                            {selectedComplaint.imageUrl && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Evidence</h3>
                                    <img 
                                        src={selectedComplaint.imageUrl} 
                                        alt="Complaint Evidence" 
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 shadow-md object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                            setSelectedImage(selectedComplaint.imageUrl!);
                                        }}
                                    />
                                </div>
                            )}

                            {/* Actions Section */}
                            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                {selectedComplaint.status === 'Pending' ? (
                                    <button 
                                        onClick={() => {
                                            resolveComplaint(selectedComplaint.id);
                                            setSelectedComplaint(null);
                                        }}
                                        disabled={resolvingId === selectedComplaint.id}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold transition-colors text-sm ${
                                            resolvingId === selectedComplaint.id
                                                ? 'bg-indigo-400 cursor-not-allowed text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        <CheckCircle size={18} />
                                        {resolvingId === selectedComplaint.id ? 'Resolving...' : 'Resolve Complaint'}
                                    </button>
                                ) : (
                                    <button disabled className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-5 rounded-xl font-semibold text-sm cursor-not-allowed opacity-75">
                                        <CheckCircle size={18} /> Resolved
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelectedComplaint(null)}
                                    className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 py-3 px-5 rounded-xl font-semibold transition-colors text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
