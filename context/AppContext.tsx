
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Asset, User, Complaint, VerificationLog, Theme, Notification } from '../types';
import { INITIAL_ASSETS, INITIAL_USERS, INITIAL_LOGS } from '../mockData';
import { useAuth } from './AuthContext';

// Simple Router State to replace React Router for this demo
interface RouteState {
  path: string;
  params?: any;
}

interface AppContextType {
  assets: Asset[];
  users: User[];
  logs: VerificationLog[];
  complaints: Complaint[];
  currentRoute: RouteState;
  theme: Theme;

  navigate: (path: string, params?: any) => void;
  toggleTheme: () => void;

  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addComplaint: (complaint: Complaint) => void;
  verifyAsset: (assetId: string, verifierName: string) => void;

  // New functions for QR workflow
  createDummyAssets: (count: number) => Promise<Asset[]>;
  registerAsset: (id: string, details: Partial<Asset>) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (title: string, message: string, type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR') => void;
  markAllNotificationsRead: () => void;

  // Toast
  toast: { message: string; show: boolean; type: 'SUCCESS' | 'ERROR' | 'INFO' };
  showToast: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const { user: currentUser } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [logs, setLogs] = useState<VerificationLog[]>(INITIAL_LOGS);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [theme, setTheme] = useState<Theme>('light');

  // Notifications & Toasts
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<{ message: string; show: boolean; type: 'SUCCESS' | 'ERROR' | 'INFO' }>({ message: '', show: false, type: 'INFO' });

  const addNotification = (title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') => {
    setNotifications(prev => [{
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type
    }, ...prev]);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const showToast = (message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' = 'SUCCESS') => {
    setToast({ message, show: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const hideToast = () => setToast(prev => ({ ...prev, show: false }));

  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<RouteState>({ path: '/dashboard' });

  // Initialize Theme from LocalStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Apply Theme to DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navigate = (path: string, params?: any) => {
    setCurrentRoute({ path, params });
  };

  const addAsset = (asset: Asset) => {
    // Add to beginning of array for Recent-First sorting
    setAssets((prev) => [asset, ...prev]);
    addNotification('New Asset Added', `${asset.name} has been added to the system.`, 'SUCCESS');
    showToast('New asset has been added');
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)));
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const addUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addComplaint = (complaint: Complaint) => {
    setComplaints((prev) => [complaint, ...prev]);
    addNotification('Complaint Raised', `${complaint.assetName} (${complaint.assetId}) complaint has been raised`, 'WARNING');
    showToast(`${complaint.assetName} (${complaint.assetId}) issue has been raised`, 'ERROR');
  };

  const verifyAsset = (assetId: string, verifierName: string) => {
    const timestamp = new Date().toISOString();
    updateAsset(assetId, { lastVerifiedDate: timestamp, verifiedBy: verifierName });

    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setLogs(prev => [{
        id: `log-${Date.now()}`,
        assetId,
        assetName: asset.name,
        verifiedBy: verifierName,
        timestamp
      }, ...prev]);
    }
  };

  const createDummyAssets = async (count: number): Promise<Asset[]> => {
    const newAssets: Asset[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < count; i++) {
      // Generate a short ID
      const uniqueId = `QR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      newAssets.push({
        id: uniqueId,
        name: 'Unassigned Asset',
        category: 'Other',
        serialNumber: 'N/A',
        status: 'Active',
        imageUrl: '',
        purchaseDate: now,
        createdDate: now,
        createdAt: now,
        updatedAt: now,
        addedBy: currentUser?.name || 'Admin',
        isQrGenerated: true,
        location: 'Not Assigned',
        attachments: [],
        isDummy: true, // Mark as dummy
        qrData: JSON.stringify({ assetId: uniqueId })
      });
      // Slight delay to ensure unique timestamps if needed, though Math.random helps
    }

    setAssets(prev => [...newAssets, ...prev]);
    return newAssets;
  };

  const registerAsset = (id: string, details: Partial<Asset>) => {
    updateAsset(id, {
      ...details,
      isDummy: false,
      updatedAt: new Date().toISOString(),
      // Ensure mandatory fields for a registered asset
      createdDate: new Date().toISOString()
    });
  };

  return (
    <AppContext.Provider
      value={{
        assets,
        users,
        logs,
        complaints,
        currentRoute,
        theme,
        navigate,
        toggleTheme,
        addAsset,
        updateAsset,
        deleteAsset,
        addUser,
        updateUser,
        deleteUser,
        addComplaint,
        verifyAsset,
        createDummyAssets,
        registerAsset,
        notifications,
        addNotification,
        markAllNotificationsRead,
        toast,
        showToast,
        hideToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
