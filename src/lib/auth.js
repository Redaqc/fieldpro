import apiClient, { tokenManager, handleApiError } from './api-client';

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise} User data with tokens
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { accessToken, refreshToken, user } = response.data;

      // Store tokens
      tokenManager.setTokens(accessToken, refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Register new user
   * @param {Object} userData - { email, password, fullName, role }
   * @returns {Promise} User data with tokens
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      const { accessToken, refreshToken, user } = response.data;

      // Store tokens
      tokenManager.setTokens(accessToken, refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();

      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }

      // Clear tokens regardless of API response
      tokenManager.clearTokens();
    } catch (error) {
      // Always clear tokens even if API call fails
      tokenManager.clearTokens();
      throw handleApiError(error);
    }
  },

  /**
   * Get current user profile
   * @returns {Promise} User data
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Refresh access token
   * @returns {Promise} New tokens
   */
  refreshToken: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh', null, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      tokenManager.setTokens(accessToken, newRefreshToken);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      tokenManager.clearTokens();
      throw handleApiError(error);
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!tokenManager.getAccessToken();
  },
};

export default authApi;
