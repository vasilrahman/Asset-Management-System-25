
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Complaint } from '../types';
import { fetchComplaints } from '../services/dashboardService';

export const AdminComplaints = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    useEffect(() => {
        const loadComplaints = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchComplaints();
                setComplaints(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch complaints:', err);
                setError('Failed to load complaints');
                setComplaints([]);
            } finally {
                setLoading(false);
            }
        };
        loadComplaints();
    }, []);

    const resolveComplaint = async (complaintId: string) => {
        if (resolvingId) return; // Prevent multiple simultaneous resolves

        setResolvingId(complaintId);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(`http://localhost:3000/admin/complaints/${complaintId}/resolve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to resolve complaint');
            }

            // Update local state - change status to RESOLVED
            setComplaints(prevComplaints =>
                prevComplaints.map(complaint =>
                    complaint.id === complaintId
                        ? { ...complaint, status: 'Resolved' as const }
                        : complaint
                )
            );
        } catch (err) {
            console.error('Failed to resolve complaint:', err);
            // Could show a toast notification here, but for now just log
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Complaints & Issues</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track and resolve issues reported by staff.</p>
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
                <div className="grid grid-cols-1 gap-4">
                    {complaints.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                            <AlertTriangle className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white">No Complaints</h3>
                            <p className="text-slate-400 dark:text-slate-500">Everything is running smoothly.</p>
                        </div>
                    ) : (
                        complaints.map(complaint => (
                            <div key={complaint.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 transition-colors duration-200">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${complaint.status === 'Pending'
                                                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {complaint.status}
                                        </span>
                                        <span className="text-sm text-slate-400 dark:text-slate-500">{new Date(complaint.date).toLocaleString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{complaint.assetName} <span className="text-slate-400 font-normal text-sm">({complaint.assetId})</span></h3>
                                    <p className="text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">{complaint.description}</p>
                                    {complaint.imageUrl && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-slate-500 mb-1">Attached Evidence:</p>
                                            <img src={complaint.imageUrl} alt="Evidence" className="h-32 rounded-lg border border-slate-200 dark:border-slate-700 object-cover hover:scale-105 transition-transform cursor-pointer" />
                                        </div>
                                    )}
                                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Reported by:</span> {complaint.reportedBy}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                                    {complaint.status === 'Pending' ? (
                                        <button 
                                            onClick={() => resolveComplaint(complaint.id)}
                                            disabled={resolvingId === complaint.id}
                                            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium shadow-sm transition-colors text-sm ${
                                                resolvingId === complaint.id
                                                    ? 'bg-indigo-400 cursor-not-allowed text-white'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            <CheckCircle size={16} />
                                            {resolvingId === complaint.id ? 'Resolving...' : 'Resolve'}
                                        </button>
                                    ) : (
                                        <button disabled className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-xl font-medium shadow-sm text-sm cursor-not-allowed opacity-75">
                                            <CheckCircle size={16} /> Resolved
                                        </button>
                                    )}
                                    <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 py-2 px-4 rounded-xl font-medium transition-colors text-sm">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
