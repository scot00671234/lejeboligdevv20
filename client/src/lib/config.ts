// API Configuration for development and production environments
export const API_CONFIG = {
  // Use relative URLs for production (same domain as frontend)
  // Use localhost for development
  baseURL: import.meta.env.DEV ? 'http://localhost:5000' : '',
  
  // Build full API URL
  getApiUrl: (path: string) => {
    const baseUrl = API_CONFIG.baseURL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
};