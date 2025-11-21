import apiClient from './client';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  job_id?: string;
  status: string;
  issue_date: string;
  due_date: string;
  line_items: any[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceDto {
  customer_id: string;
  job_id?: string;
  line_items: any[];
  status?: string;
  issue_date: string;
  due_date: string;
  notes?: string;
  terms?: string;
  discount_amount?: number;
  discount_percentage?: number;
}

export const invoicesApi = {
  getAll: async (filters?: any): Promise<Invoice[]> => {
    const response = await apiClient.get('/invoices', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response = await apiClient.post('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateInvoiceDto>): Promise<Invoice> => {
    const response = await apiClient.patch(`/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  send: async (id: string): Promise<Invoice> => {
    const response = await apiClient.post(`/invoices/${id}/send`);
    return response.data;
  },

  markAsPaid: async (id: string, paymentDetails: any): Promise<Invoice> => {
    const response = await apiClient.post(`/invoices/${id}/mark-paid`, paymentDetails);
    return response.data;
  },
};
