import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface FetchAssetsParams {
  search?: string;
  category?: string;
  status?: string;
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
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await axios.get(`${API_BASE_URL}/admin/assets?${queryParams.toString()}`, {
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