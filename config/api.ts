/**
 * API Configuration with automatic server/local detection
 * Priority: Server IP -> Localhost fallback
 */

// Get the API base URL with fallback logic
export const getApiBaseUrl = (): string => {
  // Check if environment variable is set
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback: Detect based on current window location
  const currentHost = window.location.hostname;
  
  // If running on server IP, use server backend
  if (currentHost === '192.168.185.91') {
    return 'http://192.168.185.91:3015';
  }
  
  // If running on localhost, use localhost backend
  return 'http://localhost:3015';
};

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

// Helper function to check if server is reachable (optional)
export const checkServerHealth = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => null);
    
    clearTimeout(timeoutId);
    return response?.ok || false;
  } catch {
    return false;
  }
};

// Get API URL with health check fallback
export const getApiUrlWithFallback = async (): Promise<string> => {
  const primaryUrl = 'http://192.168.185.91:3015';
  const fallbackUrl = 'http://localhost:3015';
  
  // Try primary (server) first
  const isServerHealthy = await checkServerHealth(primaryUrl);
  if (isServerHealthy) {
    return primaryUrl;
  }
  
  // Fallback to localhost
  return fallbackUrl;
};
