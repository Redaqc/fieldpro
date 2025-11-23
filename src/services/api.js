/**
 * API Client
 * Replaces @base44/sdk for all backend communication
 *
 * This centralized API client handles:
 * - Authentication tokens
 * - HTTP requests to backend
 * - Error handling
 * - Request/response interceptors
 */

import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'fieldpro_auth_token';
const USER_KEY = 'fieldpro_user';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION API
// ============================================

export const auth = {
  /**
   * Login user
   * Replaces: base44.auth.login()
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user, token } = response.data;

    // Store auth data
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { user, token };
  },

  /**
   * Register new user
   * Replaces: base44.auth.register()
   */
  async register(email, password, name, role = 'technician') {
    const response = await apiClient.post('/auth/register', { email, password, name, role });
    const { user, token } = response.data;

    // Store auth data
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { user, token };
  },

  /**
   * Logout user
   * Replaces: base44.auth.logout()
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Get current user
   * Replaces: base44.auth.me()
   */
  async me() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Get current user from local storage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

// ============================================
// ENTITIES API
// ============================================

/**
 * Generic entity operations
 * Replaces: base44.entities.*
 */
export const entities = {
  /**
   * Create entity
   * Replaces: base44.entities.{EntityType}.create()
   */
  async create(entityType, data) {
    const response = await apiClient.post(`/entities/${entityType}`, data);
    return response.data;
  },

  /**
   * Get entity by ID
   * Replaces: base44.entities.{EntityType}.findById()
   */
  async findById(entityType, id, withRelations = false) {
    const response = await apiClient.get(`/entities/${entityType}/${id}`, {
      params: { with_relations: withRelations }
    });
    return response.data;
  },

  /**
   * Update entity
   * Replaces: base44.entities.{EntityType}.update()
   */
  async update(entityType, id, data) {
    const response = await apiClient.put(`/entities/${entityType}/${id}`, data);
    return response.data;
  },

  /**
   * Delete entity
   * Replaces: base44.entities.{EntityType}.delete()
   */
  async delete(entityType, id) {
    const response = await apiClient.delete(`/entities/${entityType}/${id}`);
    return response.data;
  },

  /**
   * List entities with pagination
   * Replaces: base44.entities.{EntityType}.list()
   */
  async list(entityType, options = {}) {
    const response = await apiClient.get(`/entities/${entityType}`, {
      params: options
    });
    return response.data;
  },

  /**
   * Filter entities
   * Replaces: base44.entities.{EntityType}.filter()
   */
  async filter(entityType, filters = {}) {
    const response = await apiClient.post(`/entities/${entityType}/filter`, filters);
    return response.data;
  },

  /**
   * Search entities
   * Replaces: base44.entities.{EntityType}.search()
   */
  async search(entityType, query) {
    const response = await apiClient.get(`/entities/${entityType}/search`, {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Archive entity (soft delete)
   */
  async archive(entityType, id) {
    const response = await apiClient.post(`/entities/${entityType}/${id}/archive`);
    return response.data;
  },

  /**
   * Restore archived entity
   */
  async restore(entityType, id) {
    const response = await apiClient.post(`/entities/${entityType}/${id}/restore`);
    return response.data;
  }
};

// ============================================
// SPECIFIC ENTITY SHORTCUTS
// ============================================

export const Customer = {
  create: (data) => entities.create('customers', data),
  findById: (id, withRelations) => entities.findById('customers', id, withRelations),
  update: (id, data) => entities.update('customers', id, data),
  delete: (id) => entities.delete('customers', id),
  list: (options) => entities.list('customers', options),
  filter: (filters) => entities.filter('customers', filters),
  search: (query) => entities.search('customers', query),
  archive: (id) => entities.archive('customers', id),
  restore: (id) => entities.restore('customers', id)
};

export const Job = {
  create: (data) => entities.create('jobs', data),
  findById: (id, withRelations) => entities.findById('jobs', id, withRelations),
  update: (id, data) => entities.update('jobs', id, data),
  delete: (id) => entities.delete('jobs', id),
  list: (options) => entities.list('jobs', options),
  filter: (filters) => entities.filter('jobs', filters),
  search: (query) => entities.search('jobs', query)
};

export const Invoice = {
  create: (data) => entities.create('invoices', data),
  findById: (id, withRelations) => entities.findById('invoices', id, withRelations),
  update: (id, data) => entities.update('invoices', id, data),
  delete: (id) => entities.delete('invoices', id),
  list: (options) => entities.list('invoices', options),
  filter: (filters) => entities.filter('invoices', filters),
  search: (query) => entities.search('invoices', query)
};

export const TimeEntry = {
  create: (data) => entities.create('time_entries', data),
  findById: (id) => entities.findById('time_entries', id),
  update: (id, data) => entities.update('time_entries', id, data),
  delete: (id) => entities.delete('time_entries', id),
  list: (options) => entities.list('time_entries', options),
  filter: (filters) => entities.filter('time_entries', filters)
};

export const Technician = {
  create: (data) => entities.create('technicians', data),
  findById: (id, withRelations) => entities.findById('technicians', id, withRelations),
  update: (id, data) => entities.update('technicians', id, data),
  delete: (id) => entities.delete('technicians', id),
  list: (options) => entities.list('technicians', options),
  filter: (filters) => entities.filter('technicians', filters),
  search: (query) => entities.search('technicians', query)
};

export const Material = {
  create: (data) => entities.create('materials', data),
  findById: (id) => entities.findById('materials', id),
  update: (id, data) => entities.update('materials', id, data),
  delete: (id) => entities.delete('materials', id),
  list: (options) => entities.list('materials', options),
  filter: (filters) => entities.filter('materials', filters),
  search: (query) => entities.search('materials', query)
};

export const Payment = {
  create: (data) => entities.create('payments', data),
  findById: (id) => entities.findById('payments', id),
  update: (id, data) => entities.update('payments', id, data),
  delete: (id) => entities.delete('payments', id),
  list: (options) => entities.list('payments', options),
  filter: (filters) => entities.filter('payments', filters)
};

export const ServiceCall = {
  create: (data) => entities.create('service_calls', data),
  findById: (id) => entities.findById('service_calls', id),
  update: (id, data) => entities.update('service_calls', id, data),
  delete: (id) => entities.delete('service_calls', id),
  list: (options) => entities.list('service_calls', options),
  filter: (filters) => entities.filter('service_calls', filters)
};

export const Quotation = {
  create: (data) => entities.create('quotations', data),
  findById: (id, withRelations) => entities.findById('quotations', id, withRelations),
  update: (id, data) => entities.update('quotations', id, data),
  delete: (id) => entities.delete('quotations', id),
  list: (options) => entities.list('quotations', options),
  filter: (filters) => entities.filter('quotations', filters)
};

// ============================================
// FUNCTIONS API
// ============================================

export const functions = {
  /**
   * Generate sequential number
   * Replaces: base44.functions.invoke('generateSequentialNumber')
   */
  async generateSequentialNumber(type, format = null, options = {}) {
    const response = await apiClient.post('/functions/utils/sequential-number', {
      type,
      format,
      options
    });
    return response.data.number;
  },

  /**
   * Calculate profitability for job
   * Replaces: base44.functions.invoke('calculateProfitability')
   */
  async calculateProfitability(jobId) {
    const response = await apiClient.post('/functions/analytics/profitability', {
      job_id: jobId
    });
    return response.data;
  },

  /**
   * Calculate period profitability
   */
  async calculatePeriodProfitability(startDate, endDate) {
    const response = await apiClient.post('/functions/analytics/profitability/period', {
      start_date: startDate,
      end_date: endDate
    });
    return response.data;
  },

  /**
   * Calculate customer profitability
   */
  async calculateCustomerProfitability(customerId, startDate = null, endDate = null) {
    const response = await apiClient.post('/functions/analytics/profitability/customer', {
      customer_id: customerId,
      start_date: startDate,
      end_date: endDate
    });
    return response.data;
  },

  /**
   * Export to CSV
   */
  async exportCSV(entityType, filters = {}) {
    const response = await apiClient.post('/functions/csv/export', {
      entity_type: entityType,
      filters
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Import from CSV
   */
  async importCSV(entityType, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);

    const response = await apiClient.post('/functions/csv/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Send email notification
   */
  async sendEmail(to, subject, body, attachments = []) {
    const response = await apiClient.post('/functions/notifications/email', {
      to,
      subject,
      body,
      attachments
    });
    return response.data;
  },

  /**
   * Send SMS notification
   */
  async sendSMS(to, message) {
    const response = await apiClient.post('/functions/notifications/sms', {
      to,
      message
    });
    return response.data;
  },

  /**
   * GPS auto time tracking
   */
  async gpsAutoTracking(technicianId, location) {
    const response = await apiClient.post('/functions/gps/auto-tracking', {
      technician_id: technicianId,
      location
    });
    return response.data;
  },

  /**
   * Execute automation rules
   */
  async executeAutomation(trigger, data) {
    const response = await apiClient.post('/functions/automation/engine', {
      trigger,
      data
    });
    return response.data;
  },

  /**
   * AI schedule optimizer
   */
  async optimizeSchedule(jobs, technicians, constraints = {}) {
    const response = await apiClient.post('/functions/ai/schedule-optimizer', {
      jobs,
      technicians,
      constraints
    });
    return response.data;
  },

  /**
   * Route optimizer
   */
  async optimizeRoute(jobs, startLocation, endLocation = null) {
    const response = await apiClient.post('/functions/ai/route-optimizer', {
      jobs,
      start_location: startLocation,
      end_location: endLocation
    });
    return response.data;
  }
};

// ============================================
// STORAGE API (for file uploads)
// ============================================

export const storage = {
  /**
   * Upload file
   * Replaces: base44.storage.upload()
   */
  async upload(file, folder = 'uploads') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await apiClient.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Delete file
   * Replaces: base44.storage.delete()
   */
  async delete(fileUrl) {
    const response = await apiClient.delete('/storage/delete', {
      data: { file_url: fileUrl }
    });
    return response.data;
  },

  /**
   * Get file URL
   * Replaces: base44.storage.getUrl()
   */
  getUrl(filePath) {
    return `${API_BASE_URL}/storage/${filePath}`;
  }
};

// ============================================
// INTEGRATIONS API
// ============================================

export const integrations = {
  /**
   * Stripe payment
   */
  async createStripePayment(amount, description) {
    const response = await apiClient.post('/integrations/stripe/payment', {
      amount,
      description
    });
    return response.data;
  },

  /**
   * Sync customers with Zoho
   */
  async syncZohoCustomers() {
    const response = await apiClient.post('/integrations/zoho/sync-customers');
    return response.data;
  }
};

// Export default API object
export default {
  auth,
  entities,
  functions,
  storage,
  integrations,
  // Entity shortcuts
  Customer,
  Job,
  Invoice,
  TimeEntry,
  Technician,
  Material,
  Payment,
  ServiceCall,
  Quotation
};
