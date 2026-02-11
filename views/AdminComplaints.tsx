
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Complaint } from '../types';
import { fetchComplaints } from '../services/dashboardService';

export const AdminComplaints = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Resolved'>('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit] = useState(10);

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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Complaints</h1>
                    <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2">
                        <AlertTriangle size={20} />
                        {totalRecords} Total
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Asset name, ID, description..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as 'All' | 'Pending' | 'Resolved');
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Active filters count */}
                {(searchTerm || statusFilter !== 'All' || startDate || endDate) && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Showing {complaints.length} of {totalRecords} complaints
                        </p>
                        <button
                            onClick={handleClearFilters}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
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
                    <div className="grid grid-cols-1 gap-4">
                        {complaints.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                            <AlertTriangle className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white">No Complaints Found</h3>
                            <p className="text-slate-400 dark:text-slate-500">
                                {complaints.length === 0 ? 'Everything is running smoothly.' : 'Try adjusting your filters.'}
                            </p>
                        </div>
                    ) : (
                        complaints.map(complaint => (
                            <div key={complaint.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start justify-between gap-6 transition-colors duration-200">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                            complaint.status === 'Pending' || complaint.status === 'PENDING'
                                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {complaint.status}
                                        </span>
                                        <span className="text-sm text-slate-400 dark:text-slate-500">{new Date(complaint.date || complaint.timestamp || '').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ', ' + new Date(complaint.date || complaint.timestamp || '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {complaint.assetName} <span className="text-slate-400 dark:text-slate-500 font-normal text-base">({complaint.assetId})</span>
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                        {complaint.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 pt-2">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Reported by:</span>
                                        <span>{complaint.reportedBy}</span>
                                    </div>
                                    {complaint.imageUrl && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Evidence:</p>
                                            <img 
                                                src={complaint.imageUrl} 
                                                alt="Complaint Evidence" 
                                                className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-xs h-32 object-cover hover:scale-105 transition-transform cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedImage(complaint.imageUrl!);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 min-w-[140px]">
                                    {complaint.status === 'Pending' ? (
                                        <button 
                                            onClick={() => resolveComplaint(complaint.id)}
                                            disabled={resolvingId === complaint.id}
                                            className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold shadow-sm transition-colors text-sm ${
                                                resolvingId === complaint.id
                                                    ? 'bg-indigo-400 cursor-not-allowed text-white'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            <CheckCircle size={18} />
                                            {resolvingId === complaint.id ? 'Resolving...' : 'Resolve'}
                                        </button>
                                    ) : (
                                        <button disabled className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 px-5 rounded-xl font-semibold shadow-sm text-sm cursor-not-allowed opacity-75">
                                            <CheckCircle size={18} /> Resolved
                                        </button>
                                    )}
                                    <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 py-2.5 px-5 rounded-xl font-semibold transition-colors text-sm">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Showing page {currentPage} of {totalPages} ({totalRecords} total complaints)
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
        </div>
    );
};
