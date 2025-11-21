import apiClient from './client';

export interface Asset {
  id: string;
  name: string;
  asset_tag?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  category?: string;
  customer_id?: string;
  purchase_date?: string;
  warranty_expires?: string;
  location?: string;
  status: string;
  notes?: string;
  custom_fields?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetDto {
  name: string;
  asset_tag?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  category?: string;
  customer_id?: string;
  purchase_date?: string;
  warranty_expires?: string;
  location?: string;
  status?: string;
  notes?: string;
  custom_fields?: any;
}

export const assetsApi = {
  getAll: async (filters?: any): Promise<Asset[]> => {
    const response = await apiClient.get('/assets', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Asset> => {
    const response = await apiClient.get(`/assets/${id}`);
    return response.data;
  },

  create: async (data: CreateAssetDto): Promise<Asset> => {
    const response = await apiClient.post('/assets', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateAssetDto>): Promise<Asset> => {
    const response = await apiClient.patch(`/assets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assets/${id}`);
  },

  getMaintenanceHistory: async (id: string): Promise<any[]> => {
    const response = await apiClient.get(`/assets/${id}/maintenance-history`);
    return response.data;
  },
};
