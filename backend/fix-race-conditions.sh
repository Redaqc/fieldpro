#!/bin/bash

# Fix race conditions in auto-numbering by using database sequences

echo "Fixing race conditions in jobs.service.ts..."
sed -i 's/const jobCount = await this.tenantPrisma.count(tenantId, '\''Job'\'', {});/\/\/ ✅ RACE CONDITION FIX: Use database sequence\n    const result = await this.tenantPrisma.queryRaw<Array<{ nextval: number }>>(\n      `SELECT nextval('\''{schema}.job_number_seq'\'') as nextval`\n    );/g' /home/user/fieldpro/backend/src/jobs/jobs.service.ts

sed -i 's/const jobNumber = `JOB-\${String(jobCount + 1).padStart(6, '\''0'\'')}`;/const jobNumber = `JOB-\${String(result[0].nextval).padStart(6, '\''0'\'')}`;/g' /home/user/fieldpro/backend/src/jobs/jobs.service.ts

echo "Fixing race conditions in invoices.service.ts..."
sed -i 's/const invoiceCount = await this.tenantPrisma.count(tenantId, '\''Invoice'\'', {});/\/\/ ✅ RACE CONDITION FIX: Use database sequence\n    const result = await this.tenantPrisma.queryRaw<Array<{ nextval: number }>>(\n      `SELECT nextval('\''{schema}.invoice_number_seq'\'') as nextval`\n    );/g' /home/user/fieldpro/backend/src/invoices/invoices.service.ts

sed -i 's/const invoiceNumber = `INV-\${String(invoiceCount + 1).padStart(6, '\''0'\'')}`;/const invoiceNumber = `INV-\${String(result[0].nextval).padStart(6, '\''0'\'')}`;/g' /home/user/fieldpro/backend/src/invoices/invoices.service.ts

echo "Fixing race conditions in quotations.service.ts..."
sed -i 's/const jobCount = await this.tenantPrisma.count(tenantId, '\''Job'\'', {});/\/\/ ✅ RACE CONDITION FIX: Use database sequence\n    const jobResult = await this.tenantPrisma.queryRaw<Array<{ nextval: number }>>(\n      `SELECT nextval('\''{schema}.job_number_seq'\'') as nextval`\n    );/g' /home/user/fieldpro/backend/src/quotations/quotations.service.ts

sed -i 's/const jobNumber = `JOB-\${String(jobCount + 1).padStart(6, '\''0'\'')}`;/const jobNumber = `JOB-\${String(jobResult[0].nextval).padStart(6, '\''0'\'')}`;/g' /home/user/fieldpro/backend/src/quotations/quotations.service.ts

sed -i 's/const count = await this.tenantPrisma.count(tenantId, '\''Quotation'\'', {});/\/\/ ✅ RACE CONDITION FIX: Use database sequence\n    const result = await this.tenantPrisma.queryRaw<Array<{ nextval: number }>>(\n      `SELECT nextval('\''{schema}.quotation_number_seq'\'') as nextval`\n    );/g' /home/user/fieldpro/backend/src/quotations/quotations.service.ts

sed -i 's/const quotationNumber = `QUO-\${String(count + 1).padStart(6, '\''0'\'')}`;/const quotationNumber = `QUO-\${String(result[0].nextval).padStart(6, '\''0'\'')}`;/g' /home/user/fieldpro/backend/src/quotations/quotations.service.ts

echo "Fixing race conditions in service-calls.service.ts..."
sed -i 's/const count = await this.tenantPrisma.count(tenantId, '\''ServiceCall'\'', {});/\/\/ ✅ RACE CONDITION FIX: Use database sequence\n    const result = await this.tenantPrisma.queryRaw<Array<{ nextval: number }>>(\n      `SELECT nextval('\''{schema}.service_call_number_seq'\'') as nextval`\n    );/g' /home/user/fieldpro/backend/src/service-calls/service-calls.service.ts

sed -i 's/const callNumber = `CALL-\${String(count + 1).padStart(6, '\''0'\'')}`;/const callNumber = `CALL-\${String(result[0].nextval).padStart(6, '\''0'\'')}`;/g' /home/user/fieldpro/backend/src/service-calls/service-calls.service.ts

echo "✅ All race conditions fixed!"
