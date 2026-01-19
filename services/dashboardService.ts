import axios from 'axios';
import { Asset, VerificationLog, Complaint, User } from '../types';

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

export const fetchVerifications = async (): Promise<VerificationLog[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/admin/verifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle different response structures
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  } else if (data && Array.isArray(data.data)) {
    return data.data;
  } else {
    return [];
  }
};

export const fetchComplaints = async (): Promise<Complaint[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/admin/complaints`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle different response structures
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  } else if (data && Array.isArray(data.data)) {
    return data.data;
  } else {
    return [];
  }
};

export const fetchUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle different response structures
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  } else if (data && Array.isArray(data.data)) {
    return data.data;
  } else {
    return [];
  }
};

export interface QRCode {
  code: string;
}

export const generateQRCodes = async (count: number): Promise<QRCode[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.post(
    `${API_BASE_URL}/admin/qr/generate`,
    { count },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('QR API Response:', response.data);

  // Handle different response structures
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  } else if (data && Array.isArray(data.data)) {
    return data.data;
  } else if (data && Array.isArray(data.qrCodes)) {
    return data.qrCodes;
  } else {
    console.error('Unexpected response format:', data);
    throw new Error('Invalid response format from backend');
  }
};

export interface RegisterAssetPayload {
  qrCode: string;
  assetName: string;
  category: string;
  serialNumber?: string;
}

export const registerAsset = async (payload: RegisterAssetPayload): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.post(
    `${API_BASE_URL}/staff/assets/register`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

export interface VerifyQRResponse {
  valid: boolean;
  message?: string;
  qrId?: string;
  code?: string;
  alreadyAssigned?: boolean;
}

export const verifyQRCode = async (qrCode: string): Promise<VerifyQRResponse> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.post(
    `${API_BASE_URL}/staff/qr/verify`,
    { qrCode },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};