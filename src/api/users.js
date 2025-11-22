import apiClient, { handleApiError } from '@/lib/api-client';

export const usersApi = {
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20, role, isActive } = params;
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (role) queryParams.append('role', role);
      if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
      const response = await apiClient.get(`/users?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/users', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getStatistics: async () => {
    try {
      const response = await apiClient.get('/users/stats/overview');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default usersApi;
