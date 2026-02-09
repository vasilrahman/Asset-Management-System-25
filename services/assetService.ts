import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface FetchAssetsParams {
  search?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface FetchAssetsResponse {
  data: any[]; // Asset[]
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchAssets = async (params: FetchAssetsParams): Promise<FetchAssetsResponse> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.category && params.category !== 'All') queryParams.append('category', params.category);
  if (params.status && params.status !== 'All') queryParams.append('status', params.status);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await axios.get(`${API_BASE_URL}/admin/assets?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export interface ExportAssetsParams {
  search?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const fetchAssetsForExport = async (params: ExportAssetsParams): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.category && params.category !== 'All') queryParams.append('category', params.category);
  if (params.status && params.status !== 'All') queryParams.append('status', params.status);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const response = await axios.get(`${API_BASE_URL}/admin/assets/export/data?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Backend returns { data: [...], exportedAt: "..." }
  // Return the full response to handle different structures in the component
  return response.data;
};

export const fetchAssetById = async (assetId: string): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/admin/assets/${assetId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const fetchAssetVerifications = async (assetId: string): Promise<any[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/admin/assets/${assetId}/verifications`, {
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

export const fetchAssetComplaints = async (assetId: string): Promise<any[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/admin/assets/${assetId}/complaints`, {
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

export const fetchStaffAssets = async (): Promise<any[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/staff/assets`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const fetchStaffVerifiedHistory = async (): Promise<any[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/staff/history/verified`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const fetchStaffComplaintsHistory = async (): Promise<any[]> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${API_BASE_URL}/staff/history/complaints`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const verifyStaffAsset = async (assetId: string): Promise<void> => {
  console.log('verifyStaffAsset called with:', assetId);
  console.log('API_BASE_URL:', API_BASE_URL);
  
  const token = localStorage.getItem('accessToken');
  console.log('Token exists:', !!token);
  
  if (!token) {
    throw new Error('No access token found');
  }

  const url = `${API_BASE_URL}/staff/assets/verify`;
  console.log('Making POST request to:', url);
  console.log('Request body:', { assetId });
  
  const response = await axios.post(
    url,
    { assetId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log('Response:', response.data);
  return response.data;
};

export const submitStaffComplaint = async (data: {
  assetId: string;
  description: string;
  imageUrl?: string;
}): Promise<void> => {
  console.log('submitStaffComplaint called with:', data);
  console.log('API_BASE_URL:', API_BASE_URL);
  
  const token = localStorage.getItem('accessToken');
  console.log('Token exists:', !!token);
  
  if (!token) {
    throw new Error('No access token found');
  }

  const url = `${API_BASE_URL}/staff/complaints`;
  console.log('Making POST request to:', url);
  
  const response = await axios.post(
    url,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log('Response:', response.data);
  return response.data;
};

export const updateAsset = async (assetId: string, data: any): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.put(
    `${API_BASE_URL}/admin/assets/${assetId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const regenerateAssetQR = async (assetId: string): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.post(
    `${API_BASE_URL}/admin/assets/${assetId}/regenerate-qr`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const deleteAsset = async (assetId: string): Promise<void> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  await axios.delete(
    `${API_BASE_URL}/admin/assets/${assetId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};