/**
 * API Configuration
 * 
 * Update the API_BASE_URL with your actual backend API endpoint.
 * 
 * For development, you can use:
 * - Local machine: 'http://localhost:3000/api'
 * - Local network: 'http://YOUR_IP_ADDRESS:3000/api' (e.g., 'http://192.168.1.100:3000/api')
 * 
 * For production, use your deployed API URL:
 * - 'https://your-api-domain.com/api'
 */

export const API_CONFIG = {
  // Development API URL
  DEV_API_URL: 'http://localhost:3000/api',
  
  // Production API URL
  PROD_API_URL: 'https://your-api-domain.com/api',
  
  // Current environment
  // Set to 'development' or 'production'
  ENV: __DEV__ ? 'development' : 'production',
  
  // Get the current API base URL
  getBaseURL: () => {
    return API_CONFIG.ENV === 'development' 
      ? API_CONFIG.DEV_API_URL 
      : API_CONFIG.PROD_API_URL;
  },
};

export default API_CONFIG;

