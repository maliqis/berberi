import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import API_CONFIG from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const USER_STORAGE_KEY = '@berberi_user';
const TOKEN_STORAGE_KEY = '@berberi_token';
const REFRESH_TOKEN_STORAGE_KEY = '@berberi_refresh_token';
const API_BASE_URL = API_CONFIG.getBaseURL();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const tokenData = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (userData && tokenData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      const { user: userData, tokens } = response;
      const { accessToken, refreshToken } = tokens;

      // Store tokens
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ accessToken }));
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      }

      // Store user
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const payload = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'user',
      };

      // If barber admin, include shop info as FLAT fields (not nested)
      // API contract requires flat structure: shopName, logo (not logoUrl), workingDays, etc.
      if (userData.role === 'barber' || userData.role === 'barberAdmin') {
        payload.shopName = userData.shopName;
        payload.logo = userData.logo || null; // API contract uses "logo" in signup, not "logoUrl"
        payload.workingDays = userData.workingDays || [];
        payload.shiftStart = userData.shiftStart;
        payload.shiftEnd = userData.shiftEnd;
        payload.slotLengthMinutes = userData.slotLengthMinutes;
      }

      const response = await api.post('/auth/signup', payload);

      const { user: newUser, tokens } = response;
      const { accessToken, refreshToken } = tokens;

      // Store tokens
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ accessToken }));
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      }

      // Store user
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);

      return newUser;
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Continue with local cleanup even if API call fails
        console.warn('Logout API call failed, continuing with local cleanup:', error);
      }

      // Clear local storage
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local state even if storage removal fails
      setUser(null);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      // Call backend API to update user
      const response = await api.put('/me', updatedUserData);
      const updatedUser = response.user || response;

      // Update local storage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

