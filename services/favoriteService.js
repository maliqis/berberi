import api from './api';

/**
 * Favorite Service
 * Handles all API calls related to favorites
 */
class FavoriteService {
  /**
   * Get all favorites for current user
   * @returns {Promise<Array>}
   */
  async getFavorites() {
    try {
      const response = await api.get('/favorites');
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  /**
   * Add a favorite shop
   * @param {string} shopId
   * @returns {Promise<Object>}
   */
  async addFavorite(shopId) {
    try {
      const response = await api.post('/favorites', { shopId });
      return response.data || response;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  /**
   * Remove a favorite
   * @param {string} favoriteId
   * @returns {Promise<void>}
   */
  async removeFavorite(favoriteId) {
    try {
      await api.delete(`/favorites/${favoriteId}`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }
}

export default new FavoriteService();

