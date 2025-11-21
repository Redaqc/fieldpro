// Centralized API exports
export { default as apiClient } from './client';
export { authApi } from './auth';
export { customersApi } from './customers';
export { jobsApi } from './jobs';
export { serviceCallsApi } from './service-calls';
export { invoicesApi } from './invoices';
export { quotationsApi } from './quotations';
export { techniciansApi } from './technicians';
export { materialsApi } from './materials';
export { assetsApi } from './assets';

// Type exports
export type { LoginDto, RegisterDto, AuthResponse } from './auth';
export type { Customer, CreateCustomerDto } from './customers';
export type { Job, CreateJobDto } from './jobs';
export type { ServiceCall, CreateServiceCallDto } from './service-calls';
export type { Invoice, CreateInvoiceDto } from './invoices';
export type { Quotation, CreateQuotationDto } from './quotations';
export type { Technician, CreateTechnicianDto } from './technicians';
export type { Material, CreateMaterialDto } from './materials';
export type { Asset, CreateAssetDto } from './assets';
