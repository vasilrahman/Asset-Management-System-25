
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, AssetCategory, AssetStatus } from '../types';
import { QrCode, Box, ClipboardCheck, AlertTriangle, ChevronLeft, Camera, Check, Search, X, Package, Tag, Save, RefreshCw, Image as ImageIcon, ScanLine } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import jsQR from 'jsqr';
import { StaffRegisterAsset } from './StaffRegisterAsset';
import { verifyQRCode } from '../services/dashboardService';
import { verifyStaffAsset, submitStaffComplaint, fetchStaffAssets, fetchStaffVerifiedHistory, fetchStaffComplaintsHistory } from '../services/assetService';

type ViewState = 'HOME' | 'SCANNER' | 'ASSETS' | 'VERIFIED' | 'COMPLAINT' | 'DETAIL' | 'REGISTER_FORM' | 'REGISTER_ASSET';

export const StaffModule = () => {
    const { verifyAsset, currentUser, addComplaint, registerAsset } = useApp();
    const [staffAssets, setStaffAssets] = useState<Asset[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [verifiedHistory, setVerifiedHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [complaintsHistory, setComplaintsHistory] = useState<any[]>([]);
    const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
    const [view, setView] = useState<ViewState>('HOME');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [scannedQRData, setScannedQRData] = useState<{ qrId: string; qrCode: string; alreadyAssigned?: boolean } | null>(null);
    const [complaintText, setComplaintText] = useState('');

    // History View State
    const [historyTab, setHistoryTab] = useState<'VERIFIED' | 'COMPLAINTS'>('VERIFIED');
    const [historySearch, setHistorySearch] = useState('');

    // Registration Form State
    const [regData, setRegData] = useState({
        name: '',
        category: 'Laptop',
        serialNumber: '',
        status: 'Active',
        imageUrl: ''
    });

    const [complaintImage, setComplaintImage] = useState<string>('');
    const [assetSearch, setAssetSearch] = useState('');

    // Scanner Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scanError, setScanError] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);

    // Scanner Mode: 'VERIFY' or 'REGISTER'
    const [scannerMode, setScannerMode] = useState<'VERIFY' | 'REGISTER'>('VERIFY');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

    // Show toast message
    const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch staff assets when ASSETS view is opened
    useEffect(() => {
        if (view === 'ASSETS') {
            setIsLoadingAssets(true);
            fetchStaffAssets()
                .then(data => {
                    setStaffAssets(data);
                })
                .catch(error => {
                    console.error('Failed to fetch staff assets:', error);
                    showToast('Failed to load assets', 'error');
                    setStaffAssets([]);
                })
                .finally(() => {
                    setIsLoadingAssets(false);
                });
        } else {
            // Reset assets when leaving ASSETS view
            setStaffAssets([]);
            setAssetSearch('');
        }
    }, [view]);

    // Fetch verified history when VERIFIED view is opened
    useEffect(() => {
        if (view === 'VERIFIED' && historyTab === 'VERIFIED') {
            setIsLoadingHistory(true);
            fetchStaffVerifiedHistory()
                .then(data => {
                    setVerifiedHistory(data);
                })
                .catch(error => {
                    console.error('Failed to fetch verified history:', error);
                    showToast('Failed to load history', 'error');
                    setVerifiedHistory([]);
                })
                .finally(() => {
                    setIsLoadingHistory(false);
                });
        } else if (view !== 'VERIFIED') {
            // Reset history when leaving VERIFIED view
            setVerifiedHistory([]);
            setComplaintsHistory([]);
            setHistorySearch('');
        }
    }, [view, historyTab]);

    // Fetch complaints history when COMPLAINTS tab is selected
    useEffect(() => {
        if (view === 'VERIFIED' && historyTab === 'COMPLAINTS') {
            setIsLoadingComplaints(true);
            fetchStaffComplaintsHistory()
                .then(data => {
                    setComplaintsHistory(data);
                })
                .catch(error => {
                    console.error('Failed to fetch complaints history:', error);
                    showToast('Failed to load complaints', 'error');
                    setComplaintsHistory([]);
                })
                .finally(() => {
                    setIsLoadingComplaints(false);
                });
        }
    }, [view, historyTab]);

    // Handle successful scan (string data)
    const handleScanResult = async (data: string) => {
        try {
            // Call backend API to verify QR code
            const response = await verifyQRCode(data);

            if (!response.valid) {
                showToast(response.message || 'Invalid QR code', 'error');
                return;
            }

            // ✅ VERIFY FLOW
            if (scannerMode === 'VERIFY') {
                if (!response.alreadyAssigned || !response.asset) {
                    showToast('This QR is not registered yet', 'warning');
                    return;
                }

                setSelectedAsset(response.asset);
                setView('DETAIL');
                return;
            }

            // ✅ REGISTER FLOW
            if (scannerMode === 'REGISTER') {
                setScannedQRData({
                    qrId: response.qrId,
                    qrCode: data,
                    alreadyAssigned: response.alreadyAssigned
                });

                setView('REGISTER_ASSET');
            }

        } catch (error: any) {
            console.error('QR verification failed:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to verify QR code';
            showToast(errorMessage, 'error');
        }
    };

    const handleVerify = async () => {
        console.log('handleVerify called', { selectedAsset, currentUser });
        if (selectedAsset) {
            try {
                console.log('Calling verifyStaffAsset with:', selectedAsset.id);
                await verifyStaffAsset(selectedAsset.id);
                console.log('verifyStaffAsset successful');
                if (currentUser) {
                    verifyAsset(selectedAsset.id, currentUser.name);
                }
                showToast('Asset verified successfully', 'success');
                setView('HOME');
            } catch (error: any) {
                console.error('Failed to verify asset:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to verify asset';
                showToast(errorMessage, 'error');
            }
        } else {
            console.log('Missing selectedAsset');
        }
    };

    const handleComplaintSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleComplaintSubmit called', { selectedAsset, currentUser });
        if (selectedAsset) {
            setIsSubmittingComplaint(true);
            try {
                console.log('Calling submitStaffComplaint with:', {
                    assetId: selectedAsset.id,
                    description: complaintText,
                    imageUrl: complaintImage || undefined
                });
                await submitStaffComplaint({
                    assetId: selectedAsset.id,
                    description: complaintText,
                    imageUrl: complaintImage || undefined
                });
                console.log('submitStaffComplaint successful');
                if (currentUser) {
                    addComplaint({
                        id: `c-${Date.now()}`,
                        assetId: selectedAsset.id,
                        assetName: selectedAsset.name,
                        reportedBy: currentUser.name,
                        date: new Date().toISOString(),
                        description: complaintText,
                        status: 'Pending',
                        imageUrl: complaintImage
                    });
                }
                setComplaintText('');
                setComplaintImage('');
                showToast('Issue reported successfully', 'success');
                setView('HOME');
            } catch (error: any) {
                console.error('Failed to submit complaint:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to report issue';
                showToast(errorMessage, 'error');
            } finally {
                setIsSubmittingComplaint(false);
            }
        } else {
            console.log('Missing selectedAsset');
        }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAsset) {
            registerAsset(selectedAsset.id, {
                name: regData.name,
                category: regData.category as AssetCategory,
                serialNumber: regData.serialNumber,
                status: regData.status as AssetStatus,
                imageUrl: regData.imageUrl || ''
            });
            // Toast handled in context
            setView('HOME');
            setRegData({ name: '', category: 'Laptop', serialNumber: '', status: 'Active', imageUrl: '' });
        }
    };

    const handleImageRegisterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setRegData(prev => ({ ...prev, imageUrl: ev.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleComplaintImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setComplaintImage(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Gallery Upload Logic
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    if (code) {
                        handleScanResult(code.data);
                    } else {
                        alert("No QR code found in image. Please try a clearer photo.");
                    }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    // Camera Logic
    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const tick = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.height = videoRef.current.videoHeight;
                    canvas.width = videoRef.current.videoWidth;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                        // Only attempt QR scan if we have valid image data
                        if (imageData.width > 0 && imageData.height > 0) {
                            try {
                                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                    inversionAttempts: "dontInvert",
                                });

                                if (code && code.data) {
                                    handleScanResult(code.data);
                                    return; // Stop loop
                                }
                            } catch (e) {
                                // Ignore frame errors
                            }
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        const startCamera = async () => {
            if (view === 'SCANNER') {
                setIsScanning(true);
                setScanError('');

                // Check if API is supported
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setScanError('Camera API not supported in this browser or context (requires HTTPS).');
                    setIsScanning(false);
                    return;
                }

                try {
                    // Try environment camera first
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: 'environment', width: { ideal: 1280 } }
                        });
                    } catch (err) {
                        console.warn("Environment camera failed, falling back to any video source.");
                        // Fallback to any camera
                        stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    }

                    if (videoRef.current && stream) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.setAttribute("playsinline", "true"); // Critical for iOS

                        // Wait for video metadata to load before playing
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play().catch(e => {
                                console.error("Video play error:", e);
                                setScanError("Failed to start video stream.");
                            });
                            requestAnimationFrame(tick);
                        };
                    }
                } catch (err: any) {
                    console.error("Camera access error:", err);
                    setIsScanning(false);

                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setScanError('Permission denied. Please allow camera access in your browser settings.');
                    } else if (err.name === 'NotFoundError') {
                        setScanError('No camera found on this device.');
                    } else if (err.name === 'NotReadableError') {
                        setScanError('Camera is currently in use by another application.');
                    } else {
                        setScanError(`Camera error: ${err.message || 'Unknown error'}`);
                    }
                }
            }
        };

        if (view === 'SCANNER') {
            startCamera();
        }

        // Cleanup
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            cancelAnimationFrame(animationFrameId);
            setIsScanning(false);
        };
    }, [view]);

    const handleRetryCamera = () => {
        setScanError('');
        // Force re-render of camera component logic
        const currentMode = scannerMode;
        setView('HOME');
        setTimeout(() => {
            setScannerMode(currentMode);
            setView('SCANNER');
        }, 100);
    };

    // 1. Staff Home
    if (view === 'HOME') {
        return (
            <div className="p-6 space-y-8 animate-in fade-in duration-300">
                {toast && <Toast message={toast.message} type={toast.type} />}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <h1 className="text-3xl font-light mb-1">Hello, <span className="font-semibold">{currentUser?.name.split(' ')[0]}</span></h1>
                    <p className="text-indigo-100 font-light">What would you like to do today?</p>
                </div>

                {/* 2-2-1 Grid Layout */}
                {/* 2-2-1 Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Row 1 - Scan & Register */}
                    <DashboardTile
                        icon={<ScanLine size={24} />}
                        title="Scan QR"
                        subtitle="Verify Asset"
                        color="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900"
                        onClick={() => { setScannerMode('VERIFY'); setView('SCANNER'); }}
                    />
                    <DashboardTile
                        icon={<QrCode size={24} />}
                        title="Register QR"
                        subtitle="Link New"
                        color="bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900"
                        onClick={() => { setScannerMode('REGISTER'); setView('SCANNER'); }}
                    />

                    {/* Row 2 */}
                    <DashboardTile
                        icon={<ClipboardCheck size={24} />}
                        title="History"
                        subtitle="Verified & Issues"
                        color="bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                        onClick={() => setView('VERIFIED')}
                    />
                    <DashboardTile
                        icon={<Box size={24} />}
                        title="Assets"
                        subtitle="Browse All"
                        color="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        onClick={() => setView('ASSETS')}
                    />
                </div>
            </div>
        );
    }

    // 2. Register Asset View
    if (view === 'REGISTER_ASSET') {
        return (
            <StaffRegisterAsset 
                qrCode={scannedQRData?.qrCode || "QR-807182-623"} 
                qrId={scannedQRData?.qrId}
                onBack={() => {
                    setScannedQRData(null);
                    setView('HOME');
                }} 
            />
        );
    }

    // 3. Scanner View
    if (view === 'SCANNER') {
        return (
            <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
                {toast && <Toast message={toast.message} type={toast.type} />}
                <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent absolute top-0 w-full z-10">
                    <button onClick={() => setView('HOME')} className="bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-colors"><X size={24} /></button>
                    <span className="font-medium tracking-wide">{scannerMode === 'REGISTER' ? 'Scan New QR' : 'Scan Asset QR'}</span>
                    <div className="w-12"></div>
                </div>

                <div className="flex-1 relative flex items-center justify-center bg-slate-900 overflow-hidden">
                    {!scanError ? (
                        <>
                            <video
                                ref={videoRef}
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                                muted
                                playsInline
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Scanning Overlay UI */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 ${scannerMode === 'REGISTER' ? 'border-purple-500' : 'border-indigo-500'} rounded-3xl z-10 shadow-[0_0_100px_rgba(99,102,241,0.3)]`}>
                                <div className={`absolute top-0 left-0 w-full h-1 ${scannerMode === 'REGISTER' ? 'bg-purple-400' : 'bg-indigo-400'} shadow-[0_0_20px_rgba(99,102,241,1)] animate-[scan_2s_infinite]`}></div>
                                <div className="absolute inset-0 border-[20px] border-black/30 rounded-3xl"></div>
                                {/* Corner markers */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl -mb-1 -mr-1"></div>
                            </div>
                            <div className="absolute bottom-40 w-full text-center z-20">
                                <p className="text-white/90 text-sm font-medium bg-black/40 backdrop-blur-md inline-block px-4 py-2 rounded-full border border-white/10">Align QR code within frame</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm z-30">
                            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6">
                                <AlertTriangle size={40} className="text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Camera Error</h3>
                            <p className="text-slate-300 mb-6 text-sm">{scanError}</p>
                            <button onClick={handleRetryCamera} className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors border border-white/10 mb-4">
                                <RefreshCw size={18} /> Retry Camera
                            </button>
                        </div>
                    )}

                    {/* Manual Entry / Gallery Upload */}
                    <div className="absolute bottom-0 w-full px-6 pb-8 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
                        <div className="max-w-md mx-auto">
                            <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-wider font-semibold">
                                {scanError ? "Alternative Option" : "Trouble scanning?"}
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={triggerFileUpload}
                                className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-xl px-5 py-4 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                            >
                                <ImageIcon size={20} /> Upload from Gallery
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Register New Asset Form (Staff)
    if (view === 'REGISTER_FORM' && selectedAsset) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setView('HOME')} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400"><ChevronLeft size={20} /></button>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Register Asset</h1>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1 flex flex-col">
                    <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                        <QrCode className="text-indigo-600 dark:text-indigo-400" size={24} />
                        <div>
                            <p className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase">Linking to ID</p>
                            <p className="font-mono font-bold text-indigo-700 dark:text-indigo-200">{selectedAsset.id}</p>
                        </div>
                    </div>

                    <form onSubmit={handleRegisterSubmit} className="space-y-4 flex-1">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
                            <input
                                required
                                value={regData.name}
                                onChange={e => setRegData({ ...regData, name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none dark:text-white"
                                placeholder="e.g. Dell Monitor 27"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                            <CustomSelect
                                value={regData.category}
                                onChange={(val) => setRegData({ ...regData, category: val })}
                                options={[
                                    { value: 'Laptop', label: 'Laptop' },
                                    { value: 'Camera', label: 'Camera' },
                                    { value: 'Mobile', label: 'Mobile' },
                                    { value: 'Tablet', label: 'Tablet' },
                                    { value: 'Other', label: 'Other' },
                                ]}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Serial Number</label>
                            <input
                                value={regData.serialNumber}
                                onChange={e => setRegData({ ...regData, serialNumber: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none dark:text-white"
                                placeholder="Optional S/N"
                            />
                        </div>

                        <div className="pt-4 mt-auto">
                            <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2">
                                <Save size={20} /> Register Asset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 4. Asset Detail (Verification)
    if (view === 'DETAIL' && selectedAsset) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                <div className="relative h-72 bg-slate-800 flex items-center justify-center">
                    {selectedAsset.imageUrl ? (
                        <img src={selectedAsset.imageUrl} className="w-full h-full object-cover opacity-80" alt="Asset" />
                    ) : (
                        <Package className="text-slate-500" size={64} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    <button onClick={() => setView('HOME')} className="absolute top-6 left-6 bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"><ChevronLeft /></button>
                    <div className="absolute bottom-6 left-6 text-white max-w-[80%]">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block ${selectedAsset.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>{selectedAsset.status}</span>
                        <h2 className="text-3xl font-bold leading-tight mb-1">{selectedAsset.name}</h2>
                        <p className="text-slate-300 font-mono text-sm">{selectedAsset.id}</p>
                    </div>
                </div>

                <div className="flex-1 p-6 -mt-6 bg-white dark:bg-slate-950 rounded-t-3xl relative z-10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                    <div className="space-y-6 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoCard label="Serial" value={selectedAsset.serialNumber} />
                            <InfoCard label="Category" value={selectedAsset.category} />
                            <InfoCard label="Location" value={selectedAsset.location} />
                            <InfoCard label="Last Verified" value={selectedAsset.lastVerifiedDate ? new Date(selectedAsset.lastVerifiedDate).toLocaleDateString() : 'Never'} />
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <button onClick={handleVerify} className="w-full bg-indigo-600 active:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                            <Check size={24} /> Mark as Verified
                        </button>
                        <button onClick={() => setView('COMPLAINT')} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            Report Issue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 5. Asset List
    if (view === 'ASSETS') {
        const filteredAssets = staffAssets.filter(a =>
            a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
            a.id.toLowerCase().includes(assetSearch.toLowerCase())
        );
        return (
            <div className="p-4 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-4 mb-4 pt-2">
                    <button onClick={() => setView('HOME')} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-500 dark:text-slate-400"><ChevronLeft size={24} /></button>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Assets</h2>
                </div>

                <div className="mb-4 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 outline-none focus:border-indigo-300 dark:focus:border-indigo-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 transition-all font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                        placeholder="Search assets..."
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pb-20 pr-1 custom-scrollbar">
                    {isLoadingAssets ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <RefreshCw size={48} className="mb-4 opacity-20 animate-spin" />
                            <p>Loading assets...</p>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Box size={48} className="mb-4 opacity-20" />
                            <p>{assetSearch ? 'No assets found' : 'No assets available'}</p>
                        </div>
                    ) : (
                        filteredAssets.map(asset => (
                            <div key={asset.id} onClick={() => { setSelectedAsset(asset); setView('DETAIL'); }} className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4 items-center cursor-pointer active:scale-95 transition-transform">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                                    {asset.imageUrl ? (
                                        <img src={asset.imageUrl} className="w-full h-full object-cover" alt={asset.name} />
                                    ) : (
                                        <Package className="text-slate-400 dark:text-slate-500" size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate">{asset.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">{asset.id} • {asset.location}</p>
                                </div>
                                <div className="pr-2">
                                    <span className={`w-3 h-3 rounded-full block ${asset.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // 6. History View (Verified / Complaints)
    if (view === 'VERIFIED') {
        const filteredLogs = verifiedHistory.filter(l =>
            l.assetName?.toLowerCase().includes(historySearch.toLowerCase()) || l.assetId?.toLowerCase().includes(historySearch.toLowerCase())
        );

        const filteredComplaints = complaintsHistory.filter(c =>
            c.assetName?.toLowerCase().includes(historySearch.toLowerCase()) || c.assetId?.toLowerCase().includes(historySearch.toLowerCase()) || c.description?.toLowerCase().includes(historySearch.toLowerCase())
        );

        return (
            <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setView('HOME')} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-500 dark:text-slate-400"><ChevronLeft size={24} /></button>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">History</h2>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 outline-none focus:border-indigo-300 dark:focus:border-indigo-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 transition-all font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                        placeholder="Search history..."
                    />
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                    <button
                        onClick={() => setHistoryTab('VERIFIED')}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${historyTab === 'VERIFIED' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Verified
                    </button>
                    <button
                        onClick={() => setHistoryTab('COMPLAINTS')}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${historyTab === 'COMPLAINTS' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Complaints
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto pb-20 flex-1">
                    {historyTab === 'VERIFIED' ? (
                        <>
                            {isLoadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <RefreshCw size={48} className="mb-4 opacity-20 animate-spin" />
                                    <p>Loading history...</p>
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <ClipboardCheck size={48} className="mb-4 opacity-20" />
                                    <p>No verification history found.</p>
                                </div>
                            ) : (
                                filteredLogs.map(log => (
                                    <div key={log.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{log.assetName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{log.assetId}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(log.timestamp || log.verifiedAt || log.date).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                                            <Check size={18} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            {isLoadingComplaints ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <RefreshCw size={48} className="mb-4 opacity-20 animate-spin" />
                                    <p>Loading complaints...</p>
                                </div>
                            ) : filteredComplaints.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <AlertTriangle size={48} className="mb-4 opacity-20" />
                                    <p>No complaints raised found.</p>
                                </div>
                            ) : (
                                filteredComplaints.map(complaint => (
                                    <div key={complaint.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{complaint.assetName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(complaint.date || complaint.createdAt || complaint.timestamp).toLocaleString()}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${complaint.status === 'Pending' || complaint.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                            {complaint.description}
                                        </p>
                                        {complaint.imageUrl && (
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-slate-500 mb-1">Evidence:</p>
                                                <img src={complaint.imageUrl} alt="Evidence" className="h-24 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // 7. Complaint Form
    if (view === 'COMPLAINT') {
        return (
            <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"><ChevronLeft size={20} /> Cancel</button>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Report Issue</h2>
                    <div className="w-10"></div>
                </div>

                <form onSubmit={handleComplaintSubmit} className="space-y-6 flex-1 flex flex-col">
                    {!selectedAsset ? (
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asset ID</label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 dark:text-white"
                                placeholder="Enter ID (e.g. AST-001)"
                                required
                                onBlur={(e) => {
                                    const found = staffAssets.find(a => a.id === e.target.value);
                                    if (found) setSelectedAsset(found);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                                    {selectedAsset.imageUrl ? (
                                        <img src={selectedAsset.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="text-slate-400 dark:text-slate-500" size={24} />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{selectedAsset.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedAsset.id}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setSelectedAsset(null)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full text-slate-400"><X size={18} /></button>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl h-full min-h-[150px] outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 resize-none font-medium text-slate-700 dark:text-white"
                            placeholder="Please describe the issue in detail..."
                            value={complaintText}
                            onChange={e => setComplaintText(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <label className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-400 font-medium flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 transition-colors cursor-pointer">
                        {complaintImage ? (
                            <img src={complaintImage} className="max-h-32 object-contain" />
                        ) : (
                            <>
                                <Camera size={24} />
                                <span>Attach Photo Evidence</span>
                            </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleComplaintImageUpload} />
                    </label>

                    <button 
                        type="submit" 
                        disabled={isSubmittingComplaint}
                        className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-slate-200 dark:shadow-indigo-900/30 mt-auto disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isSubmittingComplaint ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>
        );
    }

    return null;
};

const DashboardTile = ({ icon, title, subtitle, color, onClick, isPrimary, fullWidth }: any) => (
    <button
        onClick={onClick}
        className={`p-6 rounded-3xl shadow-sm border dark:border-0 transition-all active:scale-95 text-left flex flex-col justify-between ${color} ${(isPrimary || fullWidth) ? 'col-span-2' : ''}`}
    >
        <div className={`p-3 rounded-2xl w-fit mb-4 ${isPrimary ? 'bg-current bg-opacity-10 text-current' : 'bg-slate-50 dark:bg-slate-700'}`}>
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-xs font-medium opacity-70">{subtitle}</p>
        </div>
    </button>
);

const InfoCard = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={value}>{value}</p>
    </div>
);

// Toast Component
const Toast = ({ message, type }: { message: string; type: 'success' | 'error' | 'warning' }) => {
    const bgColors = {
        success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
    };

    return (
        <div className={`fixed top-4 right-4 z-50 ${bgColors[type]} border px-6 py-4 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-300`}>
            <p className="font-medium">{message}</p>
        </div>
    );
};
