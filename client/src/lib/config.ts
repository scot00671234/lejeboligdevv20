// API Configuration for development and production environments
export const API_CONFIG = {
  // Use relative URLs for both development and production 
  // Vite dev server will proxy API requests to the backend
  baseURL: '',
  
  // Build full API URL
  getApiUrl: (path: string) => {
    if (!path || typeof path !== 'string') {
      console.error('Invalid API path:', path);
      return '';
    }
    
    const baseUrl = API_CONFIG.baseURL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
};