#!/bin/bash

# Fix auth DTOs
sed -i 's/email: string;/email!: string;/g' /home/user/fieldpro/backend/src/auth/dto/login.dto.ts
sed -i 's/password: string;/password!: string;/g' /home/user/fieldpro/backend/src/auth/dto/login.dto.ts
sed -i 's/tenant_slug: string;/tenant_slug!: string;/g' /home/user/fieldpro/backend/src/auth/dto/login.dto.ts

sed -i 's/refresh_token: string;/refresh_token!: string;/g' /home/user/fieldpro/backend/src/auth/dto/refresh-token.dto.ts

sed -i 's/  email: string;/  email!: string;/g' /home/user/fieldpro/backend/src/auth/dto/register.dto.ts
sed -i 's/  password: string;/  password!: string;/g' /home/user/fieldpro/backend/src/auth/dto/register.dto.ts
sed -i 's/  first_name: string;/  first_name!: string;/g' /home/user/fieldpro/backend/src/auth/dto/register.dto.ts
sed -i 's/  last_name: string;/  last_name!: string;/g' /home/user/fieldpro/backend/src/auth/dto/register.dto.ts

# Fix assets DTOs
sed -i 's/  name: string;/  name!: string;/g' /home/user/fieldpro/backend/src/assets/dto/create-asset.dto.ts

# Fix customers DTOs
sed -i 's/  first_name: string;/  first_name!: string;/g' /home/user/fieldpro/backend/src/customers/dto/create-customer.dto.ts
sed -i 's/  last_name: string;/  last_name!: string;/g' /home/user/fieldpro/backend/src/customers/dto/create-customer.dto.ts
sed -i 's/  email: string;/  email!: string;/g' /home/user/fieldpro/backend/src/customers/dto/create-customer.dto.ts
sed -i 's/  phone: string;/  phone!: string;/g' /home/user/fieldpro/backend/src/customers/dto/create-customer.dto.ts

# Fix invoices DTOs
sed -i 's/  description: string;/  description!: string;/g' /home/user/fieldpro/backend/src/invoices/dto/create-invoice.dto.ts
sed -i 's/  quantity: number;/  quantity!: number;/g' /home/user/fieldpro/backend/src/invoices/dto/create-invoice.dto.ts
sed -i 's/  unit_price: number;/  unit_price!: number;/g' /home/user/fieldpro/backend/src/invoices/dto/create-invoice.dto.ts
sed -i 's/  customer_id: string;/  customer_id!: string;/g' /home/user/fieldpro/backend/src/invoices/dto/create-invoice.dto.ts
sed -i 's/  line_items: InvoiceLineItemDto\[\];/  line_items!: InvoiceLineItemDto[];/g' /home/user/fieldpro/backend/src/invoices/dto/create-invoice.dto.ts
sed -i 's/  issue_date: string;/  issue_date!: string;/g' /home/user/fieldpro/backend/src/invoices/dto/create-invoice.dto.ts
sed -i 's/  due_date: string;/  due_date!: string;/g' /home/user/fieldpro/backend/src/invoices/dto/create-invoice.dto.ts

# Fix jobs DTOs
sed -i 's/  customer_id: string;/  customer_id!: string;/g' /home/user/fieldpro/backend/src/jobs/dto/create-job.dto.ts
sed -i 's/  title: string;/  title!: string;/g' /home/user/fieldpro/backend/src/jobs/dto/create-job.dto.ts

# Fix materials DTOs
sed -i 's/  name: string;/  name!: string;/g' /home/user/fieldpro/backend/src/materials/dto/create-material.dto.ts
sed -i 's/  sku: string;/  sku!: string;/g' /home/user/fieldpro/backend/src/materials/dto/create-material.dto.ts

# Fix quotations DTOs
sed -i 's/  description: string;/  description!: string;/g' /home/user/fieldpro/backend/src/quotations/dto/create-quotation.dto.ts
sed -i 's/  quantity: number;/  quantity!: number;/g' /home/user/fieldpro/backend/src/quotations/dto/create-quotation.dto.ts
sed -i 's/  unit_price: number;/  unit_price!: number;/g' /home/user/fieldpro/backend/src/quotations/dto/create-quotation.dto.ts
sed -i 's/  customer_id: string;/  customer_id!: string;/g' /home/user/fieldpro/backend/src/quotations/dto/create-quotation.dto.ts
sed -i 's/  title: string;/  title!: string;/g' /home/user/fieldpro/backend/src/quotations/dto/create-quotation.dto.ts
sed -i 's/  line_items: QuotationLineItemDto\[\];/  line_items!: QuotationLineItemDto[];/g' /home/user/fieldpro/backend/src/quotations/dto/create-quotation.dto.ts
sed -i 's/  issue_date: string;/  issue_date!: string;/g' /home/user/fieldpro/backend/src/quotations/dto/create-quotation.dto.ts
sed -i 's/  valid_until: string;/  valid_until!: string;/g' /home/user/fieldpro/backend/src/quotations/dto/create-quotation.dto.ts

# Fix service-calls DTOs
sed -i 's/  customer_id: string;/  customer_id!: string;/g' /home/user/fieldpro/backend/src/service-calls/dto/create-service-call.dto.ts
sed -i 's/  title: string;/  title!: string;/g' /home/user/fieldpro/backend/src/service-calls/dto/create-service-call.dto.ts

# Fix technicians DTOs
sed -i 's/  first_name: string;/  first_name!: string;/g' /home/user/fieldpro/backend/src/technicians/dto/create-technician.dto.ts
sed -i 's/  last_name: string;/  last_name!: string;/g' /home/user/fieldpro/backend/src/technicians/dto/create-technician.dto.ts
sed -i 's/  email: string;/  email!: string;/g' /home/user/fieldpro/backend/src/technicians/dto/create-technician.dto.ts

echo "✅ Fixed all DTO property initializations"
