
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Download, QrCode, Trash2, Edit, Calendar, User, CheckCircle, AlertTriangle, Package, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import QRLib from 'qrcode';
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

  const handleDownloadPDF = async () => {
    try {
      console.log('Starting PDF generation for asset:', asset);
      
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("AMS Asset Card", 20, 25);
      doc.setFontSize(10);
      doc.text("Property of Asset Management System Corp.", 20, 32);
      
      // Content
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      let y = 60;
      const addLine = (label: string, value: any) => {
          doc.setFont("helvetica", "bold");
          doc.text(label, 20, y);
          doc.setFont("helvetica", "normal");
          // Convert to string and handle objects/undefined
          const textValue = value != null ? String(value) : 'N/A';
          doc.text(textValue, 70, y);
          y += 10;
      };

      addLine("Asset ID:", asset.id);
      addLine("Name:", asset.assetName || asset.name);
      addLine("Category:", asset.category);
      addLine("Serial Number:", asset.serialNumber);
      addLine("Status:", asset.status);
      addLine("Added By:", asset.addedBy || asset.createdBy || 'System');
      addLine("Created Date:", asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A');
      
      console.log('Asset details added to PDF');
      
      // QR Code
      try {
          const qrDataUrl = await QRLib.toDataURL(
              JSON.stringify({ assetId: asset.id, url: `${window.location.origin}/assets/detail?id=${asset.id}` }), 
              { width: 600, margin: 2, errorCorrectionLevel: 'H' }
          );
          doc.addImage(qrDataUrl, 'PNG', 130, 50, 60, 60);
          doc.setFontSize(10);
          doc.text("Scan to open asset", 160, 115, { align: "center" });
          console.log('QR code added to PDF');
      } catch(e) {
          console.error("PDF QR Error", e);
          doc.text("QR Generation Failed", 130, 80);
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 280);

      const assetName = (asset.assetName || asset.name || 'Asset').replace(/\s+/g, '_');
      const fileName = `${assetName}_${asset.id.slice(0, 8)}.pdf`;
      console.log('Saving PDF as:', fileName);
      doc.save(fileName);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assets')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
              <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
             <span>Assets</span>
             <span>/</span>
             <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.id}</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Image & Main Info & History */}
          <div className="lg:col-span-2 space-y-6">
              {/* Header Card (Main Info) */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                   <div className="flex flex-col md:flex-row gap-8">
                       {/* Asset Photo */}
                       <div className="w-full md:w-64 h-64 bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                           {asset.imageUrl ? (
                               <img src={asset.imageUrl} className="w-full h-full object-cover" alt={asset.name} />
                           ) : (
                               <Package className="text-slate-300 dark:text-slate-500" size={64} />
                           )}
                       </div>
                       
                       {/* Main Details */}
                       <div className="flex-1 space-y-6">
                           <div>
                               <div className="flex justify-between items-start">
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg mb-2 inline-block">{asset.category}</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-2 ${
                                        asset.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full ${asset.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                        {asset.status}
                                    </span>
                               </div>
                               <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-1">{asset.name}</h1>
                               <p className="text-slate-400 font-mono text-base">{asset.id}</p>
                           </div>

                           <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t border-slate-50 dark:border-slate-700">
                               <div>
                                   <p className="text-xs text-slate-400 uppercase font-bold mb-1">Serial Number</p>
                                   <p className="font-medium text-slate-700 dark:text-slate-200">{asset.serialNumber}</p>
                               </div>
                               <div>
                                   <p className="text-xs text-slate-400 uppercase font-bold mb-1">Added By</p>
                                   <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                                       <User size={16} className="text-indigo-500"/> {asset.addedBy}
                                   </div>
                               </div>
                               <div>
                                   <p className="text-xs text-slate-400 uppercase font-bold mb-1">Created Date</p>
                                   <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                                       <Calendar size={16} className="text-indigo-500"/> {new Date(asset.createdDate).toLocaleDateString()}
                                   </div>
                               </div>
                               <div>
                                   <p className="text-xs text-slate-400 uppercase font-bold mb-1">Last Verified</p>
                                   <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                                       <CheckCircle size={16} className="text-emerald-500"/> {asset.lastVerifiedDate ? new Date(asset.lastVerifiedDate).toLocaleDateString() : 'Never'}
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
              </div>

              {/* History Section (Verification & Complaints) */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex gap-4">
                       <button 
                            onClick={() => setActiveTab('verification')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'verification' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            Verification History
                        </button>
                        <button 
                            onClick={() => setActiveTab('complaints')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'complaints' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            Complaints ({assetComplaints.length})
                        </button>
                   </div>
                   
                   <div className="p-6 min-h-[200px]">
                       {activeTab === 'verification' && (
                           <>
                            {loadingVerifications ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <RefreshCw size={32} className="mb-2 opacity-20 animate-spin" />
                                    <p className="text-sm">Loading verifications...</p>
                                </div>
                            ) : verifications.length > 0 ? (
                                <div className="space-y-4">
                                    {verifications.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
                                                    <CheckCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Verified by {log.verifiedBy}</p>
                                                    <p className="text-xs text-slate-400">{new Date(log.timestamp || log.verifiedAt || log.date).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Clock className="mx-auto mb-2 opacity-30" size={32}/>
                                    <p>No verification history</p>
                                </div>
                            )}
                           </>
                       )}

                       {activeTab === 'complaints' && (
                           <>
                                {loadingComplaints ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <RefreshCw size={32} className="mb-2 opacity-20 animate-spin" />
                                        <p className="text-sm">Loading complaints...</p>
                                    </div>
                                ) : assetComplaints.length > 0 ? (
                                    <div className="space-y-4">
                                        {assetComplaints.map(comp => (
                                            <div key={comp.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex justify-between mb-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${comp.status === 'Pending' || comp.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{comp.status}</span>
                                                    <span className="text-xs text-slate-400">{new Date(comp.date || comp.createdAt || comp.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-1">{comp.description}</p>
                                                <p className="text-xs text-slate-500">Reported by {comp.reportedBy}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <ShieldAlert className="mx-auto mb-2 opacity-30" size={32}/>
                                        <p>No complaints recorded.</p>
                                    </div>
                                )}
                           </>
                       )}
                   </div>
              </div>
          </div>

          {/* RIGHT COLUMN: QR & Actions */}
          <div className="space-y-6">
               
               {/* Actions Card */}
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Actions</h3>
                   <div className="space-y-3">
                       {/* Secondary Style Edit Button */}
                       <button onClick={() => navigate('/assets/edit', { id: asset.id })} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-4 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                           <Edit size={20} /> Edit Asset Details
                       </button>

                       {/* Updated text to "Remove Details" */}
                       <button onClick={() => setShowDeleteModal(true)} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 text-red-500 py-4 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-4">
                           <Trash2 size={20} /> Remove Details
                       </button>
                   </div>
               </div>

               {/* QR Code Display */}
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center transition-colors duration-200">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Asset QR Code</h3>
                   <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 mb-4">
                       <QRCode value={JSON.stringify({ assetId: asset.id, url: window.location.href })} size={180} />
                   </div>
                   <p className="text-xs text-slate-400">Scan to view or verify this asset.</p>
                   
                   <button onClick={handleDownloadPDF} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                        <Download size={16}/> Download PDF
                   </button>
               </div>
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
