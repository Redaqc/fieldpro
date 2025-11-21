import apiClient from './client';

export interface Technician {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  avatar_url?: string;
  is_active: boolean;
  skills?: string[];
  certifications?: any[];
  custom_fields?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateTechnicianDto {
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  avatar_url?: string;
  is_active?: boolean;
  skills?: string[];
  certifications?: any[];
  custom_fields?: any;
}

export const techniciansApi = {
  getAll: async (filters?: any): Promise<Technician[]> => {
    const response = await apiClient.get('/technicians', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Technician> => {
    const response = await apiClient.get(`/technicians/${id}`);
    return response.data;
  },

  create: async (data: CreateTechnicianDto): Promise<Technician> => {
    const response = await apiClient.post('/technicians', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTechnicianDto>): Promise<Technician> => {
    const response = await apiClient.patch(`/technicians/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/technicians/${id}`);
  },

  getSchedule: async (id: string, startDate: string, endDate: string): Promise<any> => {
    const response = await apiClient.get(`/technicians/${id}/schedule`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getAvailable: async (date: string): Promise<Technician[]> => {
    const response = await apiClient.get('/technicians/available', {
      params: { date },
    });
    return response.data;
  },
};
