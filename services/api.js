import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api';

// Base API URL - Configured in config/api.js
const API_BASE_URL = API_CONFIG.getBaseURL();

// Storage keys
const TOKEN_STORAGE_KEY = '@berberi_token';
const REFRESH_TOKEN_STORAGE_KEY = '@berberi_refresh_token';

// Get auth token from storage
const getAuthToken = async () => {
  try {
    const tokenData = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed.accessToken || parsed; // Support both formats
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Get refresh token from storage
const getRefreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    return refreshToken;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

// Refresh access token
const refreshAccessToken = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const { accessToken, refreshToken: newRefreshToken } = data.tokens || data;

    // Store new tokens
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ accessToken }));
    if (newRefreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefreshToken);
    }

    return accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Clear tokens on refresh failure
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    throw error;
  }
};

// Base API request function with automatic token refresh
const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
  try {
    const token = await getAuthToken();
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - try to refresh token once
    if (response.status === 401 && retryCount === 0) {
      try {
        const newToken = await refreshAccessToken();
        // Retry the request with new token
        defaultHeaders['Authorization'] = `Bearer ${newToken}`;
        config.headers = {
          ...defaultHeaders,
          ...options.headers,
        };
        const retryResponse = await fetch(url, config);
        
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({ message: 'An error occurred' }));
          throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
        }
        
        const data = await retryResponse.json();
        return data;
      } catch (refreshError) {
        // Refresh failed, clear storage and throw
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem('@berberi_user');
        throw new Error('Session expired. Please login again.');
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// API methods
export const api = {
  // GET request
  get: (endpoint, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'GET',
    });
  },

  // POST request
  post: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT request
  put: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE request
  delete: (endpoint, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },
};

export default api;

