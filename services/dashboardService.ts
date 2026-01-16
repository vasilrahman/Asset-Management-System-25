import axios from 'axios';
import { Asset, VerificationLog } from '../types';

export interface DashboardData {
  totalAssets: number;
  activeAssets: number;
  verifiedToday: number;
  complaintsCount: number;
  charts: {
    assetsByCategory: { category: string; count: number }[];
    assetsByStatus: { status: string; count: number }[];
    verificationTrend: { date: string; count: number }[];
  };
  recent: {
    recentAssets: Asset[];
    recentVerified: {
      assetId: string;
      verifiedBy: string;
      verifiedAt: string;
    }[];
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchDashboardData = async (): Promise<DashboardData> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};