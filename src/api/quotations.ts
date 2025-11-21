import apiClient from './client';

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  job_id?: string;
  title: string;
  status: string;
  issue_date: string;
  valid_until: string;
  line_items: any[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  accepted_at?: string;
  declined_at?: string;
  decline_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateQuotationDto {
  customer_id: string;
  job_id?: string;
  title: string;
  line_items: any[];
  status?: string;
  issue_date: string;
  valid_until: string;
  notes?: string;
  terms?: string;
  discount_amount?: number;
  discount_percentage?: number;
}

export const quotationsApi = {
  getAll: async (filters?: any): Promise<Quotation[]> => {
    const response = await apiClient.get('/quotations', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Quotation> => {
    const response = await apiClient.get(`/quotations/${id}`);
    return response.data;
  },

  create: async (data: CreateQuotationDto): Promise<Quotation> => {
    const response = await apiClient.post('/quotations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateQuotationDto>): Promise<Quotation> => {
    const response = await apiClient.patch(`/quotations/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/quotations/${id}`);
  },

  accept: async (id: string): Promise<Quotation> => {
    const response = await apiClient.post(`/quotations/${id}/accept`);
    return response.data;
  },

  decline: async (id: string, reason?: string): Promise<Quotation> => {
    const response = await apiClient.post(`/quotations/${id}/decline`, { reason });
    return response.data;
  },

  convertToJob: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/quotations/${id}/convert-to-job`);
    return response.data;
  },
};
