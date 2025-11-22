import apiClient, { handleApiError } from '@/lib/api-client';

/**
 * Customers API service
 */
export const customersApi = {
  /**
   * Get all customers with pagination and filters
   * @param {Object} params - { page, limit, search, isActive }
   * @returns {Promise} Paginated customers data
   */
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20, search, isActive } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) queryParams.append('search', search);
      if (isActive !== undefined) queryParams.append('isActive', isActive.toString());

      const response = await apiClient.get(`/customers?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise} Customer data
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create new customer
   * @param {Object} data - Customer data
   * @returns {Promise} Created customer
   */
  create: async (data) => {
    try {
      const response = await apiClient.post('/customers', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update customer
   * @param {string} id - Customer ID
   * @param {Object} data - Updated customer data
   * @returns {Promise} Updated customer
   */
  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/customers/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete customer
   * @param {string} id - Customer ID
   * @returns {Promise}
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get customer statistics
   * @returns {Promise} Customer statistics
   */
  getStatistics: async () => {
    try {
      const response = await apiClient.get('/customers/stats/overview');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Search customers
   * @param {string} query - Search query
   * @returns {Promise} Search results
   */
  search: async (query) => {
    try {
      const response = await apiClient.get(`/customers?search=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default customersApi;
