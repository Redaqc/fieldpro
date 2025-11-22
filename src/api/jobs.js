import apiClient, { handleApiError } from '@/lib/api-client';

/**
 * Jobs API service
 */
export const jobsApi = {
  /**
   * Get all jobs with pagination and filters
   * @param {Object} params - { page, limit, status, priority, customerId, technicianId, search }
   * @returns {Promise} Paginated jobs data
   */
  getAll: async (params = {}) => {
    try {
      const { page = 1, limit = 20, status, priority, customerId, technicianId, search } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) queryParams.append('status', status);
      if (priority) queryParams.append('priority', priority);
      if (customerId) queryParams.append('customerId', customerId);
      if (technicianId) queryParams.append('technicianId', technicianId);
      if (search) queryParams.append('search', search);

      const response = await apiClient.get(`/jobs?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get job by ID
   * @param {string} id - Job ID
   * @returns {Promise} Job data
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create new job
   * @param {Object} data - Job data
   * @returns {Promise} Created job
   */
  create: async (data) => {
    try {
      const response = await apiClient.post('/jobs', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update job
   * @param {string} id - Job ID
   * @param {Object} data - Updated job data
   * @returns {Promise} Updated job
   */
  update: async (id, data) => {
    try {
      const response = await apiClient.patch(`/jobs/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete job
   * @param {string} id - Job ID
   * @returns {Promise}
   */
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update job status
   * @param {string} id - Job ID
   * @param {string} status - New status
   * @returns {Promise} Updated job
   */
  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/jobs/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Assign technician to job
   * @param {string} id - Job ID
   * @param {string} technicianId - Technician ID
   * @returns {Promise} Updated job
   */
  assignTechnician: async (id, technicianId) => {
    try {
      const response = await apiClient.patch(`/jobs/${id}/assign`, { technicianId });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get job statistics
   * @param {Object} filters - { startDate, endDate }
   * @returns {Promise} Job statistics
   */
  getStatistics: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await apiClient.get(`/jobs/stats/overview?${queryParams}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default jobsApi;
