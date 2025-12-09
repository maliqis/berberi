import api from './api';

/**
 * Reservation Service
 * Handles all API calls related to reservations
 */
class ReservationService {
  /**
   * Get all reservations for current user
   * @param {Object} params - Query parameters (e.g., { shopId, date, barberId })
   * @returns {Promise<Array>}
   */
  async getReservations(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/reservations?${queryString}` : '/reservations';
      
      const response = await api.get(endpoint);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }
  }

  /**
   * Get a single reservation by ID
   * @param {string} reservationId
   * @returns {Promise<Object>}
   */
  async getReservationById(reservationId) {
    try {
      const response = await api.get(`/reservations/${reservationId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching reservation:', error);
      throw error;
    }
  }

  /**
   * Create a new reservation
   * @param {Object} reservationData
   * @returns {Promise<Object>}
   */
  async createReservation(reservationData) {
    try {
      const payload = {
        shopId: reservationData.shopId,
        date: reservationData.date, // Should be "YYYY-MM-DD" format (not ISO string)
        time: reservationData.time, // HH:mm format
        firstName: reservationData.firstName,
        lastName: reservationData.lastName,
        comment: reservationData.comment || '',
        clientNumber: reservationData.clientNumber || '',
      };

      // Include barberId only if specified (omit for auto-assign)
      if (reservationData.barberId) {
        payload.barberId = reservationData.barberId;
      }

      const response = await api.post('/reservations', payload);
      return response.data || response;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  /**
   * Update a reservation
   * @param {string} reservationId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateReservation(reservationId, updates) {
    try {
      const response = await api.put(`/reservations/${reservationId}`, updates);
      return response.data || response;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }

  /**
   * Cancel/delete a reservation
   * @param {string} reservationId
   * @returns {Promise<void>}
   */
  async cancelReservation(reservationId) {
    try {
      await api.delete(`/reservations/${reservationId}`);
    } catch (error) {
      console.error('Error canceling reservation:', error);
      throw error;
    }
  }
}

export default new ReservationService();

