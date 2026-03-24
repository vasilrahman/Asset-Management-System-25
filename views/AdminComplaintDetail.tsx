import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminComplaintDetail = () => {
  const { currentRoute, navigate } = useApp();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveComment, setResolveComment] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'verification' | 'complaints'>('complaints');

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setLoading(true);
        
        const complaintData = currentRoute.params?.complaintData;
        const complaintId = complaintData?.id;
        
        if (!complaintId) {
          setError('Complaint ID not found');
          setLoading(false);
          return;
        }

        // Fetch fresh complaint data from API
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found');
        }

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/admin/complaints/${complaintId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch complaint');
        }

        const result = await response.json();
        setComplaint(result);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch complaint:', err);
        setError(err instanceof Error ? err.message : 'Failed to load complaint details');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [currentRoute.params?.complaintData]);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/admin/complaints/${complaint.id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolution: resolveComment })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resolve complaint');
      }

      const result = await response.json();
      
      toast.success('Complaint resolved successfully');
      setResolveComment('');
      setShowResolveModal(false);
      setComplaint(result);
    } catch (err) {
      console.error('Failed to resolve complaint:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to resolve complaint');
    } finally {
      setIsResolving(false);
    }
  };

  const handleAddToMaintenance = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/admin/assets/${complaint.assetId}/maintenance`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add asset to maintenance');
      }

      const result = await response.json();

      setComplaint(prev => ({
        ...prev,
        assetStatus: result.asset.status
      }));

      toast.success('Asset added to maintenance successfully');
    } catch (err) {
      console.error('Failed to add to maintenance:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add asset to maintenance');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw size={48} className="mb-4 opacity-20 animate-spin" />
        <p>Loading complaint details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertTriangle size={48} className="mb-4 opacity-20 text-red-400" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={() => navigate('/complaints')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Complaints</button>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertTriangle size={48} className="mb-4 opacity-20" />
        <p>Complaint not found</p>
        <button onClick={() => navigate('/complaints')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Complaints</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* TOP BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back Button + Breadcrumb */}
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/complaints')} className="inline-flex p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span>Assets</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-gray-900 dark:text-white">{complaint?.assetId}</span>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowResolveModal(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm border ${
                  complaint?.status === 'Pending' || complaint?.status === 'PENDING'
                    ? 'bg-green-100 text-green-600 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-700'
                }`}
                disabled={complaint?.status !== 'Pending' && complaint?.status !== 'PENDING'}
              >
                ✓ Resolve
              </button>
              <button 
                onClick={handleAddToMaintenance}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm border ${
                  complaint?.status === 'Pending' || complaint?.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-600 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-700'
                }`}
                disabled={complaint?.status !== 'Pending' && complaint?.status !== 'PENDING'}
              >
                🟠 Add To Maintenance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* HERO CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
          <div className="flex">
            {/* LEFT: Image Block (35%) */}
            <div className="w-1/3 bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center min-h-96 relative">
              {complaint?.imageUrl ? (
                <img 
                  src={complaint.imageUrl} 
                  alt="Asset Evidence" 
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(complaint.imageUrl)}
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-600 dark:bg-slate-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <AlertTriangle size={32} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400">No evidence image</p>
                </div>
              )}
            </div>

            {/* RIGHT: Content Block (65%) */}
            <div className="flex-1 p-6 flex flex-col">
              {/* TOP ROW: Badges & Title */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                      {complaint?.assetCategory || 'ASSET'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{complaint?.assetName}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{complaint?.assetId}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    complaint?.status?.toUpperCase() === 'RESOLVED'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300'
                      : complaint?.assetStatus?.toUpperCase() === 'MAINTENANCE'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
                      : complaint?.assetStatus?.toUpperCase() === 'ACTIVE'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {complaint?.status?.toUpperCase() === 'RESOLVED' 
                      ? 'RESOLVED'
                      : complaint?.assetStatus?.toUpperCase() === 'MAINTENANCE'
                      ? 'MAINTENANCE'
                      : complaint?.assetStatus?.toUpperCase() === 'ACTIVE'
                      ? 'ACTIVE'
                      : 'UNKNOWN'}
                  </span>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Serial Number</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{complaint?.assetSerialNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reported By</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{complaint?.reportedBy}</p>
                </div>
                {complaint?.date || complaint?.timestamp ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Report Date</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-50">
                      {new Date(complaint?.date || complaint?.timestamp || '').toLocaleDateString()}
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Category</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{complaint?.assetCategory || 'N/A'}</p>
                </div>
              </div>

              {/* DIVIDER + ISSUE DESCRIPTION */}
              <div className="border-t border-gray-100 dark:border-slate-700 mt-6 pt-6">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Issue Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{complaint?.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS SECTION */}
        <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-4 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'complaints'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Complaints
              {activeTab === 'complaints' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`py-4 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'verification'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Verification History
              {activeTab === 'verification' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
              )}
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div>
          {activeTab === 'complaints' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {complaint?.status?.toUpperCase() === 'RESOLVED' ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Complaint Resolved</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Original Issue:</span>
                        <p className="mt-1">{complaint?.description}</p>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 mt-4">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Resolution Taken:</span>
                        <p className="mt-1">{complaint?.resolution && complaint?.resolution !== '' ? complaint.resolution : 'N/A'}</p>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                        Resolved on {new Date(complaint?.createdAt || complaint?.date || complaint?.timestamp || '').toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Complaint Pending</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{complaint?.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                        Reported on {new Date(complaint?.date || complaint?.timestamp || '').toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">Asset Verified</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Last verification completed successfully</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                      {new Date(complaint?.date || complaint?.timestamp || '').toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={selectedImage} 
            alt="Full view" 
            className="max-w-4xl max-h-screen object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowResolveModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-md transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resolve Complaint</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add details about the resolution</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Resolution Comment</label>
                <textarea 
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  placeholder="Describe the resolution steps taken..."
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/50 transition-all resize-none h-32 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 rounded-b-xl flex gap-3">
              <button 
                onClick={() => setShowResolveModal(false)}
                className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleResolve}
                disabled={isResolving}
                className={`flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${
                  isResolving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <CheckCircle size={16} />
                {isResolving ? 'Resolving...' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
