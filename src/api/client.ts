import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private refreshing = false;
  private refreshQueue: Array<() => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        const tenantSlug = localStorage.getItem('tenant_slug');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (tenantSlug) {
          config.headers['X-Tenant-Slug'] = tenantSlug;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            return new Promise((resolve) => {
              this.refreshQueue.push(() => {
                originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshing = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);

            this.refreshQueue.forEach((callback) => callback());
            this.refreshQueue = [];

            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.refreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

const apiClient = new ApiClient().getInstance();
export default apiClient;
