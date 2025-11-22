import apiClient, { handleApiError } from '@/lib/api-client';

export const serviceCallsApi = {
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20, status, priority, customerId } = params;
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (status) queryParams.append('status', status);
      if (priority) queryParams.append('priority', priority);
      if (customerId) queryParams.append('customerId', customerId);
      const response = await apiClient.get(`/service-calls?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/service-calls/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/service-calls', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/service-calls/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/service-calls/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/service-calls/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getStatistics: async () => {
    try {
      const response = await apiClient.get('/service-calls/stats/overview');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default serviceCallsApi;
