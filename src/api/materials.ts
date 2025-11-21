import apiClient from './client';

export interface Material {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  cost_price: number;
  sell_price: number;
  quantity_in_stock: number;
  reorder_level?: number;
  unit?: string;
  is_active: boolean;
  supplier?: string;
  custom_fields?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialDto {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  cost_price: number;
  sell_price: number;
  quantity_in_stock?: number;
  reorder_level?: number;
  unit?: string;
  is_active?: boolean;
  supplier?: string;
  custom_fields?: any;
}

export const materialsApi = {
  getAll: async (filters?: any): Promise<Material[]> => {
    const response = await apiClient.get('/materials', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Material> => {
    const response = await apiClient.get(`/materials/${id}`);
    return response.data;
  },

  create: async (data: CreateMaterialDto): Promise<Material> => {
    const response = await apiClient.post('/materials', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateMaterialDto>): Promise<Material> => {
    const response = await apiClient.patch(`/materials/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/materials/${id}`);
  },

  adjustStock: async (id: string, adjustment: number, reason?: string): Promise<Material> => {
    const response = await apiClient.post(`/materials/${id}/adjust-stock`, {
      adjustment,
      reason,
    });
    return response.data;
  },

  getLowStock: async (): Promise<Material[]> => {
    const response = await apiClient.get('/materials/low-stock');
    return response.data;
  },
};
