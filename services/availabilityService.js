import api from './api';

/**
 * Availability Service
 * Handles availability checks for barbershops and employees
 */
class AvailabilityService {
  /**
   * Get availability for a shop on a specific date
   * @param {string} shopId
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} barberId - Optional barber ID to filter by specific barber
   * @returns {Promise<Array>} Array of availability slots
   */
  async getAvailability(shopId, date, barberId = null) {
    try {
      const params = { date };
      if (barberId) {
        params.barberId = barberId;
      }

      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/barbers/${shopId}/availability?${queryString}`;
      
      const response = await api.get(endpoint);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }
}

export default new AvailabilityService();

