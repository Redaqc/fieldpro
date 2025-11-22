import apiClient, { handleApiError } from '@/lib/api-client';

export const notificationTemplatesApi = {
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20 } = params;
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      Object.keys(params).forEach(key => {
        if (key !== 'page' && key !== 'limit' && params[key] !== undefined) {
          queryParams.append(key, params[key].toString());
        }
      });
      const response = await apiClient.get(`/notification-templates?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/notification-templates/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/notification-templates', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/notification-templates/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/notification-templates/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default notificationTemplatesApi;
