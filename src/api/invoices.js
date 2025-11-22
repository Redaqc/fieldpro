import apiClient, { handleApiError } from '@/lib/api-client';

/**
 * Invoices API service
 */
export const invoicesApi = {
  /**
   * Get all invoices with pagination and filters
   */
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20, status, customerId, startDate, endDate } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) queryParams.append('status', status);
      if (customerId) queryParams.append('customerId', customerId);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await apiClient.get(`/invoices?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get invoice by ID
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create new invoice
   */
  create: async (data) => {
    try {
      const response = await apiClient.post('/invoices', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update invoice
   */
  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/invoices/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete invoice
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get invoice statistics
   */
  getStatistics: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await apiClient.get(`/invoices/stats/overview?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default invoicesApi;
