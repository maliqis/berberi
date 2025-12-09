import api from './api';

/**
 * Employee Service
 * Handles all API calls related to employees/barbers
 */
class EmployeeService {
  /**
   * Get all employees for a shop
   * @param {string} shopId
   * @returns {Promise<Array>}
   */
  async getEmployees(shopId) {
    try {
      const response = await api.get(`/barbers/${shopId}/employees`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  /**
   * Create a new employee
   * @param {string} shopId
   * @param {Object} employeeData
   * @returns {Promise<Object>}
   */
  async createEmployee(shopId, employeeData) {
    try {
      const response = await api.post(`/barbers/${shopId}/employees`, employeeData);
      return response.data || response;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update an employee
   * @param {string} shopId
   * @param {string} employeeId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateEmployee(shopId, employeeId, updates) {
    try {
      const response = await api.put(`/barbers/${shopId}/employees/${employeeId}`, updates);
      return response.data || response;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Delete an employee
   * @param {string} shopId
   * @param {string} employeeId
   * @returns {Promise<void>}
   */
  async deleteEmployee(shopId, employeeId) {
    try {
      await api.delete(`/barbers/${shopId}/employees/${employeeId}`);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }
}

export default new EmployeeService();

