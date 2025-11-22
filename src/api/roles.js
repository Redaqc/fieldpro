import apiClient, { handleApiError } from '@/lib/api-client';

export const rolesApi = {
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20 } = params;
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      Object.keys(params).forEach(key => {
        if (key !== 'page' && key !== 'limit' && params[key] !== undefined) {
          queryParams.append(key, params[key].toString());
        }
      });
      const response = await apiClient.get(`/roles?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/roles/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/roles', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/roles/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/roles/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  getStatistics: async () => {
    try {
      const response = await apiClient.get('/roles/stats/overview');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default rolesApi;
