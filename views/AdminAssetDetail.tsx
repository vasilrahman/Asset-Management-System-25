
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Trash2, Edit, Calendar, User, CheckCircle, AlertTriangle, Package, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import { fetchAssetById, fetchAssetVerifications, fetchAssetComplaints, deleteAsset as deleteAssetAPI } from '../services/assetService';
import toast from 'react-hot-toast';

export const AdminAssetDetail = () => {
  const { currentRoute, navigate, deleteAsset } = useApp();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'verification' | 'complaints'>('verification');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [assetComplaints, setAssetComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  useEffect(() => {
    const loadAsset = async () => {
      if (currentRoute.params?.id) {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchAssetById(currentRoute.params.id);
          setAsset(data);
        } catch (err: any) {
          console.error('Failed to fetch asset:', err);
          setError(err?.response?.data?.message || err?.message || 'Failed to load asset');
        } finally {
          setLoading(false);
        }
      }
    };
    loadAsset();
  }, [currentRoute.params?.id]);

  // Fetch verifications when verification tab is active
  useEffect(() => {
    const loadVerifications = async () => {
      if (asset && activeTab === 'verification') {
        setLoadingVerifications(true);
        try {
          const data = await fetchAssetVerifications(asset.id);
          setVerifications(data);
        } catch (err: any) {
          console.error('Failed to fetch verifications:', err);
          setVerifications([]);
        } finally {
          setLoadingVerifications(false);
        }
      }
    };
    loadVerifications();
  }, [asset?.id, activeTab]);

  // Fetch complaints when complaints tab is active
  useEffect(() => {
    const loadComplaints = async () => {
      if (asset && activeTab === 'complaints') {
        setLoadingComplaints(true);
        try {
          const data = await fetchAssetComplaints(asset.id);
          setAssetComplaints(data);
        } catch (err: any) {
          console.error('Failed to fetch complaints:', err);
          setAssetComplaints([]);
        } finally {
          setLoadingComplaints(false);
        }
      }
    };
    loadComplaints();
  }, [asset?.id, activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw size={48} className="mb-4 opacity-20 animate-spin" />
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertTriangle size={48} className="mb-4 opacity-20 text-red-400" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={() => navigate('/assets')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Assets</button>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Package size={48} className="mb-4 opacity-20" />
        <p>Asset not found</p>
        <button onClick={() => navigate('/assets')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Assets</button>
      </div>
    );
  }

  const handleDelete = async () => {
      setIsDeleting(true);
      try {
        await deleteAssetAPI(asset.id);
        
        // Update local context
        deleteAsset(asset.id);
        
        toast.success('Asset deleted successfully');
        navigate('/assets');
      } catch (error) {
        console.error('Failed to delete asset:', error);
        toast.error('Failed to delete asset. Please try again.');
      } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Breadcrumb / Back + Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
          <button 
            onClick={() => navigate('/assets')} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm">Assets</span>
          <span>/</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{asset.id}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/assets/edit', { id: asset.id })}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Edit size={18} />
            Edit Asset
          </button>
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={18} />
            Remove Asset
          </button>
        </div>
      </div>

      {/* Main Asset Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Asset Image */}
          <div className="lg:w-80 h-80 bg-slate-700 dark:bg-slate-900 flex items-center justify-center shrink-0">
            {asset.imageUrl ? (
              <img 
                src={asset.imageUrl} 
                className="w-full h-full object-cover" 
                alt={asset.assetName || asset.name} 
              />
            ) : (
              <Package className="text-slate-500" size={80} />
            )}
          </div>
          
          {/* Asset Details */}
          <div className="flex-1 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider rounded-md inline-block mb-3">
                  {asset.category}
                </span>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {asset.assetName || asset.name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">
                  {asset.id}
                </p>
              </div>
              
              {/* Status Badge */}
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                asset.status === 'Active' || asset.status === 'ACTIVE' 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                  : asset.status === 'Maintenance' || asset.status === 'MAINTENANCE' 
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  asset.status === 'Active' || asset.status === 'ACTIVE' ? 'bg-emerald-500' 
                  : asset.status === 'Maintenance' || asset.status === 'MAINTENANCE' ? 'bg-amber-500' 
                  : 'bg-slate-400'
                }`}></span>
                {asset.status}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-2">
                  Serial Number
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {asset.serialNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-2">
                  Added By
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {asset.addedBy}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-2">
                  Created Date
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-2">
                  Last Verified
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {asset.lastVerifiedAt ? new Date(asset.lastVerifiedAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification History & Complaints Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-6">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('verification')}
              className={`py-4 px-2 font-semibold text-sm relative ${
                activeTab === 'verification' 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Verification History
              {activeTab === 'verification' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('complaints')}
              className={`py-4 px-2 font-semibold text-sm relative ${
                activeTab === 'complaints' 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Complaints ({assetComplaints.length})
              {activeTab === 'complaints' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></span>
              )}
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'verification' && (
            <>
              {loadingVerifications ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <RefreshCw size={32} className="mb-3 opacity-20 animate-spin" />
                  <p className="text-sm">Loading verifications...</p>
                </div>
              ) : verifications.length > 0 ? (
                <div className="space-y-3">
                  {verifications.map(log => (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            Verified by {log.verifiedBy}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(log.timestamp || log.verifiedAt || log.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="mx-auto mb-3 opacity-20" size={40}/>
                  <p className="text-sm">No verification history</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'complaints' && (
            <>
              {loadingComplaints ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <RefreshCw size={32} className="mb-3 opacity-20 animate-spin" />
                  <p className="text-sm">Loading complaints...</p>
                </div>
              ) : assetComplaints.length > 0 ? (
                <div className="space-y-3">
                  {assetComplaints.map(comp => (
                    <div 
                      key={comp.id} 
                      className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-3 py-1 rounded-md text-xs font-semibold uppercase ${
                          comp.status === 'Pending' || comp.status === 'PENDING' 
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {comp.status}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(comp.date || comp.createdAt || comp.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-white font-medium mb-1">
                        {comp.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Reported by {comp.reportedBy}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ShieldAlert className="mx-auto mb-3 opacity-20" size={40}/>
                  <p className="text-sm">No complaints recorded</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">Delete Asset?</h3>
                  <p className="text-center text-slate-500 dark:text-slate-400 mb-8">This action cannot be undone. This asset and all its history will be permanently removed.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          Cancel
                      </button>
                      <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          {isDeleting ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Yes, Delete'
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
