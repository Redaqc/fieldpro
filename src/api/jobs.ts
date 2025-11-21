import apiClient from './client';

export interface Job {
  id: string;
  job_number: string;
  customer_id: string;
  asset_id?: string;
  quotation_id?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  scheduled_date?: string;
  completed_date?: string;
  assigned_to?: string;
  location?: any;
  address?: any;
  custom_fields?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateJobDto {
  customer_id: string;
  asset_id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  scheduled_date?: string;
  assigned_to?: string;
  location?: any;
  address?: any;
  custom_fields?: any;
}

export const jobsApi = {
  getAll: async (filters?: any): Promise<Job[]> => {
    const response = await apiClient.get('/jobs', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Job> => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data;
  },

  create: async (data: CreateJobDto): Promise<Job> => {
    const response = await apiClient.post('/jobs', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateJobDto>): Promise<Job> => {
    const response = await apiClient.patch(`/jobs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobs/${id}`);
  },

  assign: async (id: string, technicianId: string): Promise<Job> => {
    const response = await apiClient.post(`/jobs/${id}/assign/${technicianId}`);
    return response.data;
  },
};
