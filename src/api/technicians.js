import apiClient, { handleApiError } from '@/lib/api-client';

export const techniciansApi = {
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20, isActive, skills } = params;
      const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
      if (skills) queryParams.append('skills', skills);
      const response = await apiClient.get(`/technicians?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/technicians/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post('/technicians', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/technicians/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/technicians/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getStatistics: async () => {
    try {
      const response = await apiClient.get('/technicians/stats/overview');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getAvailable: async (date) => {
    try {
      const response = await apiClient.get(`/technicians/available?date=${date}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default techniciansApi;
