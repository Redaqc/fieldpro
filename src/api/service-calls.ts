import apiClient from './client';

export interface ServiceCall {
  id: string;
  call_number: string;
  customer_id: string;
  job_id?: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  scheduled_date?: string;
  assigned_to?: string;
  location?: any;
  custom_fields?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceCallDto {
  customer_id: string;
  job_id?: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  scheduled_date?: string;
  assigned_to?: string;
  location?: any;
  custom_fields?: any;
}

export const serviceCallsApi = {
  getAll: async (filters?: any): Promise<ServiceCall[]> => {
    const response = await apiClient.get('/service-calls', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<ServiceCall> => {
    const response = await apiClient.get(`/service-calls/${id}`);
    return response.data;
  },

  create: async (data: CreateServiceCallDto): Promise<ServiceCall> => {
    const response = await apiClient.post('/service-calls', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateServiceCallDto>): Promise<ServiceCall> => {
    const response = await apiClient.patch(`/service-calls/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/service-calls/${id}`);
  },

  assignTechnician: async (id: string, technicianId: string): Promise<ServiceCall> => {
    const response = await apiClient.post(`/service-calls/${id}/assign/${technicianId}`);
    return response.data;
  },
};
