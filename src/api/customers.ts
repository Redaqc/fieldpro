import apiClient from './client';

export interface Customer {
  id: string;
  customer_number: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  billing_address?: any;
  shipping_address?: any;
  location?: any;
  notes?: string;
  tags?: string[];
  custom_fields?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerDto {
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  billing_address?: any;
  shipping_address?: any;
  location?: any;
  notes?: string;
  tags?: string[];
  custom_fields?: any;
}

export const customersApi = {
  getAll: async (filters?: any): Promise<Customer[]> => {
    const response = await apiClient.get('/customers', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCustomerDto>): Promise<Customer> => {
    const response = await apiClient.patch(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};
