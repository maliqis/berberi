import api from './api';
import Barber from '../models/Barber';

/**
 * Barber Service
 * Handles all API calls related to barbers/barbershops
 */
class BarberService {
  /**
   * Get all barbers/barbershops
   * @param {Object} params - Query parameters (e.g., { search: 'keyword' })
   * @returns {Promise<Barber[]>}
   */
  async getAllBarbers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/barbers?${queryString}` : '/barbers';
      
      const response = await api.get(endpoint);
      
      // Transform API response to Barber models
      if (response.data && Array.isArray(response.data)) {
        return Barber.fromApiResponseArray(response.data);
      } else if (Array.isArray(response)) {
        return Barber.fromApiResponseArray(response);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching barbers:', error);
      throw error;
    }
  }

  /**
   * Get a single barber by ID
   * @param {string} barberId
   * @returns {Promise<Barber>}
   */
  async getBarberById(barberId) {
    try {
      const response = await api.get(`/barbers/${barberId}`);
      
      if (response.data) {
        return Barber.fromApiResponse(response.data);
      } else {
        return Barber.fromApiResponse(response);
      }
    } catch (error) {
      console.error('Error fetching barber:', error);
      throw error;
    }
  }

  /**
   * Search barbers by keyword
   * @param {string} keyword
   * @returns {Promise<Barber[]>}
   */
  async searchBarbers(keyword) {
    try {
      return await this.getAllBarbers({ search: keyword });
    } catch (error) {
      console.error('Error searching barbers:', error);
      throw error;
    }
  }
}

export default new BarberService();

