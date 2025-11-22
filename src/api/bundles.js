import apiClient, { handleApiError } from '@/lib/api-client';

export const bundlesApi = {
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20 } = params;
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      Object.keys(params).forEach(key => {
        if (key !== 'page' && key !== 'limit' && params[key] !== undefined) {
          queryParams.append(key, params[key].toString());
        }
      });
      const response = await apiClient.get(`/bundles?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/bundles/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/bundles', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/bundles/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/bundles/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default bundlesApi;
