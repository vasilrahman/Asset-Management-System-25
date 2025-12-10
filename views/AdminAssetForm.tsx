
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AssetCategory, AssetStatus } from '../types';
import { ArrowLeft, QrCode, Image as ImageIcon, Trash2, Package } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export const AdminAssetForm = () => {
  const { navigate, addAsset, updateAsset, assets, currentRoute, currentUser } = useApp();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editAssetId, setEditAssetId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<any>({
      name: '', category: 'Laptop', serialNumber: '', status: 'Active'
  });

  // State for CustomSelects
  const [selectedCategory, setSelectedCategory] = useState<string>('Laptop');
  const [selectedStatus, setSelectedStatus] = useState<string>('Active');

  useEffect(() => {
    // Check if we are in Edit mode
    if (currentRoute.path === '/assets/edit' && currentRoute.params?.id) {
        const asset = assets.find(a => a.id === currentRoute.params.id);
        if (asset) {
            setEditAssetId(asset.id);
            setDefaultValues({
                name: asset.name,
                category: asset.category,
                serialNumber: asset.serialNumber,
                status: asset.status,
            });
            setSelectedCategory(asset.category);
            setSelectedStatus(asset.status);
            setImagePreview(asset.imageUrl || null);
        }
    }
  }, [currentRoute, assets]);

  const handleBack = () => {
      if (editAssetId) {
          navigate('/assets/detail', { id: editAssetId });
      } else {
          navigate('/assets');
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      } else {
          alert("Please upload an image file.");
      }
    }
  };

  const removeImage = () => {
      setImageFile(null);
      setImagePreview(null);
  };

  const generatePDF = async (asset: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(79, 70, 229); // Indigo 600
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
    const addLine = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 70, y);
        y += 10;
    };

    addLine("Asset ID:", asset.id);
    addLine("Name:", asset.name);
    addLine("Category:", asset.category);
    addLine("Serial Number:", asset.serialNumber);
    addLine("Status:", asset.status);
    addLine("Added By:", asset.addedBy);

    // REAL QR CODE GENERATION (High Quality)
    try {
        const qrDataUrl = await QRCode.toDataURL(
            JSON.stringify({ assetId: asset.id, url: `${window.location.origin}/assets/detail/${asset.id}` }), 
            { width: 600, margin: 2, errorCorrectionLevel: 'H' }
        );
        doc.addImage(qrDataUrl, 'PNG', 130, 50, 60, 60);
        doc.setFontSize(10);
        doc.text("Scan to open asset", 160, 115, { align: "center" });
    } catch (err) {
        console.error("QR Gen Error", err);
        doc.text("QR Generation Failed", 130, 80);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 280);

    doc.save(`QR_${asset.id}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('data-action');

    const imageUrl = imagePreview || '';

    if (editAssetId) {
        // Update Existing
        const updates: any = {
            name: formData.get('name') as string,
            category: selectedCategory as AssetCategory,
            serialNumber: formData.get('serial') as string,
            status: selectedStatus as AssetStatus,
        };
        
        if (imagePreview !== assets.find(a => a.id === editAssetId)?.imageUrl) {
            updates.imageUrl = imageUrl;
        }

        updateAsset(editAssetId, updates);
        
        if (action === 'qr') {
             const asset = assets.find(a => a.id === editAssetId);
             if (asset) {
                 await generatePDF({ ...asset, ...updates });
                 updateAsset(editAssetId, { isQrGenerated: true });
             }
        }
        
        alert("Asset updated successfully.");
        navigate('/assets/detail', { id: editAssetId });

    } else {
        // Create New
        const newAsset = {
            id: `AST-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
            name: formData.get('name') as string,
            category: selectedCategory as AssetCategory,
            serialNumber: formData.get('serial') as string,
            status: selectedStatus as AssetStatus,
            location: 'Not Assigned', 
            imageUrl: imageUrl,
            purchaseDate: new Date().toISOString(),
            createdDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            addedBy: currentUser?.name || 'Admin',
            isQrGenerated: action === 'qr',
            verifiedBy: '',
            attachments: [],
            qrData: '' 
        };
        
        newAsset.qrData = JSON.stringify({ assetId: newAsset.id, url: `${window.location.origin}/assets/detail?id=${newAsset.id}` });

        await new Promise(resolve => setTimeout(resolve, 800));
        addAsset(newAsset);

        if (action === 'qr') {
            await generatePDF(newAsset);
        }

        alert("Asset has been successfully added.");
        navigate('/assets/detail', { id: newAsset.id });
    }
    
    setIsSubmitting(false);
  };

  const categoryOptions = [
      { value: 'Laptop', label: 'Laptop' },
      { value: 'Camera', label: 'Camera' },
      { value: 'Mobile', label: 'Mobile' },
      { value: 'Tablet', label: 'Tablet' },
      { value: 'Other', label: 'Other' },
  ];

  const statusOptions = [
      { value: 'Active', label: 'Active' },
      { value: 'Maintenance', label: 'Maintenance' },
      { value: 'Retired', label: 'Retired' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{editAssetId ? 'Edit Asset' : 'Add New Asset'}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{editAssetId ? 'Update asset details.' : 'Register a new item into the inventory system.'}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-visible">
            <div className="p-8 space-y-6">
                
                {/* 2 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column: Fields */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Asset Name *</label>
                            <input name="name" required defaultValue={defaultValues.name} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="e.g. MacBook Pro M3" />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
                            <CustomSelect 
                                value={selectedCategory} 
                                onChange={setSelectedCategory} 
                                options={categoryOptions} 
                            />
                        </div>

                         {/* Serial Number in its own row */}
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Serial Number</label>
                            <input name="serial" defaultValue={defaultValues.serialNumber} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="e.g. SN-123456" />
                        </div>

                        {/* Status in its own row */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Status</label>
                            <CustomSelect 
                                value={selectedStatus} 
                                onChange={setSelectedStatus} 
                                options={statusOptions} 
                            />
                        </div>
                    </div>

                    {/* Right Column: Image Upload */}
                    <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Asset Image</label>
                         
                         {!imagePreview ? (
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl h-64 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors relative group">
                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                    <Package size={32} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">Upload Asset Photo</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">PNG, JPG (max. 5MB)</p>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileChange} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg text-sm font-medium shadow-sm z-0 text-slate-700 dark:text-slate-300">
                                    Browse Image
                                </div>
                            </div>
                         ) : (
                             <div className="relative h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                 <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                     <button type="button" onClick={removeImage} className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors" title="Remove">
                                         <Trash2 size={20} />
                                     </button>
                                     <div className="relative">
                                         <button type="button" className="px-4 py-2 bg-white rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors pointer-events-none">
                                            Change Image
                                         </button>
                                         <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleFileChange} 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                     </div>
                                 </div>
                             </div>
                         )}
                    </div>
                </div>

            </div>

            {/* Actions */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleBack} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-colors"
                >
                    {editAssetId ? 'Save Changes' : 'Submit'}
                </button>
                <button 
                    type="submit" 
                    data-action="qr"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-colors"
                >
                    {isSubmitting ? 'Processing...' : <><QrCode size={18} /> {editAssetId ? 'Save & Re-generate QR' : 'Generate QR & Submit'}</>}
                </button>
            </div>
        </form>
    </div>
  );
};
