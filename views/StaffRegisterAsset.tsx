
import React, { useState } from 'react';
import { ArrowLeft, QrCode, Package, CheckCircle, Loader } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { registerAsset } from '../services/dashboardService';

interface StaffRegisterAssetProps {
  qrCode?: string;
  qrId?: string;
  alreadyAssigned?: boolean;
  onBack: () => void;
}

export const StaffRegisterAsset = ({ qrCode = 'QR-807182-623', qrId, alreadyAssigned = false, onBack }: StaffRegisterAssetProps) => {
  const [formData, setFormData] = useState({
    assetName: '',
    category: 'LAPTOP',
    serialNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const categoryOptions = [
    { value: 'LAPTOP', label: 'Laptop' },
    { value: 'CAMERA', label: 'Camera' },
    { value: 'MOBILE', label: 'Mobile' },
    { value: 'TABLET', label: 'Tablet' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if QR is already assigned
    if (alreadyAssigned) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await registerAsset({
        qrCode,
        assetName: formData.assetName,
        category: formData.category,
        serialNumber: formData.serialNumber || undefined
      });
      
      // Show success message
      setShowSuccess(true);
      
      // Redirect to staff dashboard after 2 seconds
      setTimeout(() => {
        onBack();
      }, 2000);
      
    } catch (err: any) {
      console.error('Asset registration failed:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to register asset. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle size={20} />
            <span className="font-medium">Asset registered successfully!</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack} 
            className="mb-4 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors inline-flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Register Asset</h1>
            <p className="text-slate-500 dark:text-slate-400">Link QR code to asset details</p>
          </div>
        </div>

        {/* Already Assigned Warning */}
        {alreadyAssigned && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-xl">
            <p className="font-medium">This QR is already linked to an asset</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* QR Code Display Card */}
        <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
              <QrCode size={28} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Linking to QR Code</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{qrCode}</p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-8 space-y-6">
            {/* Asset Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                Asset Name *
              </label>
              <div className="relative">
                <Package size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  disabled={alreadyAssigned}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g. MacBook Pro M3"
                />
              </div>
            </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
              Category *
            </label>
            <CustomSelect
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              options={categoryOptions}
              disabled={alreadyAssigned}
            />
          </div>

            {/* Serial Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                Serial Number <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                disabled={alreadyAssigned}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g. SN-123456789"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-8 pt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-8 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || alreadyAssigned}
              className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/50 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Registering...
                </>
              ) : (
                'Register Asset'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
