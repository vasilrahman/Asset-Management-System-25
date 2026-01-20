
import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Login } from './views/Login';
import { AdminDashboard } from './views/AdminDashboard';
import { AdminAssets } from './views/AdminAssets';
import { AdminAssetDetail } from './views/AdminAssetDetail';
import { AdminAssetForm } from './views/AdminAssetForm';
import { AdminUsers } from './views/AdminUsers';
import { AdminUserForm } from './views/AdminUserForm';
import { StaffModule } from './views/StaffModule';
// New Views
import { AdminGenerateQR } from './views/AdminGenerateQR';
import { AdminVerified } from './views/AdminVerified';
import { AdminComplaints } from './views/AdminComplaints';

import { LayoutDashboard, Package, Users, LogOut, Menu, X, Bell, AlertTriangle, User, Moon, Sun, ChevronDown, QrCode, CheckCircle, MessageSquare } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const MainLayout = () => {
    const { currentRoute, navigate, theme, toggleTheme } = useApp();
    const { isAuthenticated, user, logout: authLogout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setShowLogoutModal(false);
    }, [user]);

    // Click outside to close profile dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isAuthenticated) {
        return <Login />;
    }

    // --- STAFF VIEW ---
    if (user?.role === 'STAFF') {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 min-h-screen relative font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
                {/* Simple Staff Header */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 p-4 flex justify-between items-center sticky top-0 z-30 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200 dark:shadow-none">A</div>
                        <span className="font-semibold text-slate-800 dark:text-white tracking-tight">AMS Staff</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button onClick={() => setShowLogoutModal(true)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><LogOut size={20} /></button>
                    </div>
                </div>
                <StaffModule />

                {showLogoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">Sign Out?</h3>
                            <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to log out of your account?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button onClick={authLogout} className="flex-1 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors">
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- ADMIN VIEW ---
    if (user?.role !== 'ADMIN') {
        return <Login />;
    }

    const renderContent = () => {
        if (currentRoute.path === '/assets/edit') return <AdminAssetForm />;
        if (currentRoute.path === '/users/edit') return <AdminUserForm />;

        switch (currentRoute.path) {
            case '/dashboard': return <AdminDashboard />;
            case '/assets': return <AdminAssets />;
            case '/assets/new': return <AdminAssetForm />;
            case '/assets/detail': return <AdminAssetDetail />;
            case '/users': return <AdminUsers />;
            case '/users/new': return <AdminUserForm />;
            case '/generate-qr': return <AdminGenerateQR />;
            case '/verified': return <AdminVerified />;
            case '/complaints': return <AdminComplaints />;
            default: return <AdminDashboard />;
        }
    };

    const NavItem = ({ path, icon, label }: any) => {
        const isActive = currentRoute.path.startsWith(path) && (path !== '/dashboard' || currentRoute.path === '/dashboard');

        return (
            <button
                onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
            >
                {React.cloneElement(icon, { size: 20, className: isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300' })}
                <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{label}</span>
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-200">

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 h-full border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_24px_-12px_rgba(0,0,0,0.05)] z-20 transition-colors duration-200">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                        <span className="font-bold text-xl text-white">A</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">AMS Admin</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">System Online</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 py-4">
                    <NavItem path="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
                    <NavItem path="/assets" icon={<Package />} label="Assets" />
                    <NavItem path="/verified" icon={<CheckCircle />} label="Verified" />
                    <NavItem path="/complaints" icon={<MessageSquare />} label="Complaints" />
                    <NavItem path="/users" icon={<Users />} label="User & Role" />
                    <NavItem path="/generate-qr" icon={<QrCode />} label="Create QR" />
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950">
                {/* Mobile Header */}
                <header className="md:hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">A</div>
                        <span className="font-bold tracking-tight">AMS</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute inset-0 bg-white dark:bg-slate-900 z-20 pt-20 px-4 space-y-2">
                        <NavItem path="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
                        <NavItem path="/assets" icon={<Package />} label="Assets" />
                        <NavItem path="/verified" icon={<CheckCircle />} label="Verified" />
                        <NavItem path="/complaints" icon={<MessageSquare />} label="Complaints" />
                        <NavItem path="/users" icon={<Users />} label="Users" />
                        <NavItem path="/generate-qr" icon={<QrCode />} label="Create QR" />

                        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-4">
                            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium">
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </button>
                            <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl mt-2 font-medium">
                                <LogOut size={20} /> Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Header (Desktop) */}
                <header className="hidden md:flex justify-between items-center px-8 py-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-200">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {currentRoute.path === '/dashboard' && 'Overview'}
                        {currentRoute.path.startsWith('/assets') && 'Asset Management'}
                        {currentRoute.path.startsWith('/users') && 'Team Members'}
                        {currentRoute.path === '/generate-qr' && 'QR Generation'}
                        {currentRoute.path === '/verified' && 'Verification Logs'}
                        {currentRoute.path === '/complaints' && 'User Complaints'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all shadow-sm"
                            >
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                        <User size={16} />
                                    </div>
                                )}
                                <div className="text-left hidden lg:block">
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none mb-0.5">{user?.name}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none uppercase font-bold">{user?.role}</p>
                                </div>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                                    <div className="p-2">
                                        <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-700/50 mb-1 lg:hidden">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                        </div>

                                        {/* Dark Mode Toggle Item */}
                                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                                                Dark Mode
                                            </div>
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>

                                        <button
                                            onClick={() => setShowLogoutModal(true)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                        >
                                            <LogOut size={18} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-4 md:px-8 md:pb-8">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Admin Logout Confirmation Modal */}
            {showLogoutModal && user?.role === 'ADMIN' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">Sign Out?</h3>
                        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to log out of your account?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button onClick={authLogout} className="flex-1 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    return (
        <AppProvider>
            <MainLayout />
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </AppProvider>
    );
};

export default App;
