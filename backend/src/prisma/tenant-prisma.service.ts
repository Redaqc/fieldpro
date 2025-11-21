import { Injectable, Scope, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  private readonly logger = new Logger(TenantPrismaService.name);
  private tenantSchema!: string;
  private tenantId!: string;

  // ✅ SECURITY: Whitelist allowed tables
  private readonly ALLOWED_TABLES = [
    'customers',
    'jobs',
    'service_calls',
    'invoices',
    'quotations',
    'technicians',
    'materials',
    'assets',
    'activities',
    'payments',
    'stock_adjustments',
  ];

  // ✅ SECURITY: Common column whitelist (extend as needed)
  private readonly COMMON_COLUMNS = [
    'id', 'created_at', 'updated_at', 'is_active', 'status', 'priority',
    'customer_id', 'job_id', 'technician_id', 'assigned_to', 'user_id',
    'first_name', 'last_name', 'email', 'phone', 'mobile', 'company_name',
    'title', 'description', 'notes', 'tags', 'custom_fields',
    'scheduled_date', 'completed_date', 'due_date', 'issue_date', 'valid_until',
    'name', 'sku', 'category', 'quantity_in_stock', 'cost_price', 'sell_price',
    'invoice_number', 'job_number', 'quotation_number', 'customer_number', 'call_number',
    'subtotal', 'tax_amount', 'discount_amount', 'total', 'line_items',
    'asset_id', 'material_id', 'quotation_id', 'invoice_id',
    'asset_tag', 'serial_number', 'model', 'manufacturer', 'location',
    'reorder_level', 'unit', 'supplier', 'address', 'billing_address', 'shipping_address',
    'entity_type', 'entity_id', 'action', 'metadata',
    'amount', 'payment_date', 'payment_method', 'transaction_id',
    'adjustment', 'previous_quantity', 'new_quantity', 'reason', 'created_by',
    'sent_at', 'paid_at', 'accepted_at', 'declined_at', 'decline_reason',
    'avatar_url', 'skills', 'certifications', 'warranty_expires', 'purchase_date',
    'terms', 'discount_percentage', 'permissions', 'role',
  ];

  constructor(private prisma: PrismaService) {}

  setTenantSchema(schema: string) {
    // ✅ SECURITY: Validate schema name format
    if (!/^tenant_[a-z0-9_]+$/.test(schema)) {
      this.logger.error(`Invalid tenant schema format: ${schema}`);
      throw new UnauthorizedException('Invalid tenant configuration');
    }
    this.tenantSchema = schema;

    // Extract tenant ID from schema name (tenant_xxx -> xxx)
    this.tenantId = schema.replace('tenant_', '').replace(/_/g, '-');
  }

  getTenantSchema(): string {
    return this.tenantSchema;
  }

  // ✅ SECURITY: Verify tenant isolation
  private verifyTenantIsolation(tenantId: string) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    // Convert tenantId to expected schema name
    const expectedSchema = `tenant_${tenantId.replace(/-/g, '_')}`;

    if (this.tenantSchema !== expectedSchema) {
      this.logger.error(
        `Tenant isolation violation: schema=${this.tenantSchema}, expected=${expectedSchema}, tenantId=${tenantId}`
      );
      throw new UnauthorizedException('Tenant context mismatch');
    }
  }

  // ✅ SECURITY: Validate and sanitize table name
  private validateTableName(tableName: string): string {
    const sanitized = this.sanitizeTableName(tableName);

    if (!this.ALLOWED_TABLES.includes(sanitized)) {
      this.logger.error(`Attempt to access unauthorized table: ${tableName} -> ${sanitized}`);
      throw new Error(`Invalid table name: ${tableName}`);
    }

    return sanitized;
  }

  // ✅ SECURITY: Validate column name
  private validateColumnName(columnName: string): string {
    // Must match lowercase with underscores
    if (!/^[a-z_]+$/.test(columnName)) {
      this.logger.error(`Invalid column name format: ${columnName}`);
      throw new Error(`Invalid column name: ${columnName}`);
    }

    // Check against whitelist
    if (!this.COMMON_COLUMNS.includes(columnName)) {
      this.logger.warn(`Column not in whitelist (may need to add): ${columnName}`);
      // Don't throw - just log for now, but consider throwing in production
    }

    return columnName;
  }

  // ✅ SECURITY: Sanitize query results
  private sanitizeResult(result: any): any {
    if (Array.isArray(result)) {
      return result.map(r => this.sanitizeSingleResult(r));
    }
    return this.sanitizeSingleResult(result);
  }

  private sanitizeSingleResult(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized: any = {};
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    for (const [key, value] of Object.entries(obj)) {
      if (dangerousKeys.includes(key)) continue;
      sanitized[key] = value;
    }

    return sanitized;
  }

  async findMany(tenantId: string, tableName: string, options: any = {}) {
    this.verifyTenantIsolation(tenantId);

    const { where, orderBy, take, skip } = options;
    const sanitizedTable = this.validateTableName(tableName);

    let query = `SELECT * FROM "${this.tenantSchema}"."${sanitizedTable}"`;
    const params: any[] = [];
    let paramIndex = 1;

    // ✅ Build WHERE clause with validation
    if (where && Object.keys(where).length > 0) {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(where)) {
        if (value !== undefined && value !== null) {
          this.validateColumnName(key); // ✅ Validate column name
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    // ✅ Build ORDER BY clause with validation
    if (orderBy && Object.keys(orderBy).length > 0) {
      const [field, direction] = Object.entries(orderBy)[0];
      this.validateColumnName(field); // ✅ Validate column name

      const dir = String(direction).toUpperCase();
      if (dir !== 'ASC' && dir !== 'DESC') {
        throw new Error('Invalid order direction. Must be ASC or DESC');
      }

      query += ` ORDER BY ${field} ${dir}`;
    }

    // ✅ Add LIMIT with validation
    if (take) {
      const limit = parseInt(String(take));
      if (isNaN(limit) || limit < 0 || limit > 1000) {
        throw new Error('Invalid limit. Must be between 0 and 1000');
      }
      query += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }

    // ✅ Add OFFSET with validation
    if (skip) {
      const offset = parseInt(String(skip));
      if (isNaN(offset) || offset < 0) {
        throw new Error('Invalid offset. Must be >= 0');
      }
      query += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }

    // ✅ Use $queryRawUnsafe but with validated inputs
    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    return this.sanitizeResult(result);
  }

  async findOne(tenantId: string, tableName: string, options: any = {}) {
    this.verifyTenantIsolation(tenantId);

    const { where } = options;
    const sanitizedTable = this.validateTableName(tableName);

    if (!where || !where.id) {
      throw new Error('findOne requires where.id parameter');
    }

    // ✅ Validate UUID format
    if (!this.isValidUUID(where.id)) {
      throw new Error('Invalid ID format');
    }

    const query = `SELECT * FROM "${this.tenantSchema}"."${sanitizedTable}" WHERE id = $1 LIMIT 1`;
    const result = await this.prisma.$queryRawUnsafe(query, where.id);

    return result[0] ? this.sanitizeResult(result[0]) : null;
  }

  async create(tenantId: string, tableName: string, options: any) {
    this.verifyTenantIsolation(tenantId);

    const data = options.data;
    if (!data) {
      throw new Error('create requires data parameter');
    }

    const sanitizedTable = this.validateTableName(tableName);

    // ✅ SECURITY: Use cryptographically secure UUID
    if (!data.id) {
      data.id = randomUUID();
    }

    // Add timestamps
    if (!data.created_at) {
      data.created_at = new Date();
    }
    if (!data.updated_at) {
      data.updated_at = new Date();
    }

    // ✅ Validate all column names
    const columns = Object.keys(data);
    columns.forEach(col => this.validateColumnName(col));

    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO "${this.tenantSchema}"."${sanitizedTable}"
      (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.prisma.$queryRawUnsafe(query, ...values);
    return this.sanitizeResult(result[0]);
  }

  async update(tenantId: string, tableName: string, options: any) {
    this.verifyTenantIsolation(tenantId);

    const { where, data } = options;
    const sanitizedTable = this.validateTableName(tableName);

    if (!where || !where.id) {
      throw new Error('update requires where.id parameter');
    }

    // ✅ Validate UUID format
    if (!this.isValidUUID(where.id)) {
      throw new Error('Invalid ID format');
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error('update requires data parameter');
    }

    // Add updated timestamp
    data.updated_at = new Date();

    // ✅ Validate all column names
    const columns = Object.keys(data);
    columns.forEach(col => this.validateColumnName(col));

    const setClause = columns
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');

    const values = [...Object.values(data), where.id];

    const query = `
      UPDATE "${this.tenantSchema}"."${sanitizedTable}"
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await this.prisma.$queryRawUnsafe(query, ...values);
    return result[0] ? this.sanitizeResult(result[0]) : null;
  }

  async delete(tenantId: string, tableName: string, options: any) {
    this.verifyTenantIsolation(tenantId);

    const { where } = options;
    const sanitizedTable = this.validateTableName(tableName);

    if (!where || !where.id) {
      throw new Error('delete requires where.id parameter');
    }

    // ✅ Validate UUID format
    if (!this.isValidUUID(where.id)) {
      throw new Error('Invalid ID format');
    }

    const query = `DELETE FROM "${this.tenantSchema}"."${sanitizedTable}" WHERE id = $1`;
    await this.prisma.$executeRawUnsafe(query, where.id);

    return { id: where.id, deleted: true };
  }

  async count(tenantId: string, tableName: string, options: any = {}) {
    this.verifyTenantIsolation(tenantId);

    const { where } = options;
    const sanitizedTable = this.validateTableName(tableName);

    let query = `SELECT COUNT(*) as count FROM "${this.tenantSchema}"."${sanitizedTable}"`;
    const params: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions: string[] = [];
      let paramIndex = 1;
      for (const [key, value] of Object.entries(where)) {
        if (value !== undefined && value !== null) {
          this.validateColumnName(key); // ✅ Validate column name
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    return parseInt(result[0].count);
  }

  async findManyByIds(tenantId: string, tableName: string, ids: string[]) {
    this.verifyTenantIsolation(tenantId);

    if (!ids || ids.length === 0) {
      return [];
    }

    // ✅ Validate all UUIDs
    ids.forEach(id => {
      if (!this.isValidUUID(id)) {
        throw new Error(`Invalid ID format: ${id}`);
      }
    });

    // ✅ Limit batch size
    if (ids.length > 100) {
      throw new Error('Cannot query more than 100 IDs at once');
    }

    const sanitizedTable = this.validateTableName(tableName);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const query = `SELECT * FROM "${this.tenantSchema}"."${sanitizedTable}" WHERE id IN (${placeholders})`;

    const result = await this.prisma.$queryRawUnsafe(query, ...ids);
    return this.sanitizeResult(result);
  }

  // ✅ TRANSACTION SUPPORT
  async $transaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    // Execute within transaction context
    return this.prisma.$transaction(async (tx: any) => {
      return fn(tx as PrismaService);
    });
  }

  // Legacy methods for backward compatibility
  async queryRaw<T = any>(query: string, params?: any[]): Promise<T> {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    // ✅ Validate schema name in template
    if (!/^tenant_[a-z0-9_]+$/.test(this.tenantSchema)) {
      throw new Error('Invalid tenant schema');
    }

    const fullQuery = query.replace(/\{schema\}/g, `"${this.tenantSchema}"`);
    const result = await this.prisma.$queryRawUnsafe(fullQuery, ...(params || []));
    return this.sanitizeResult(result);
  }

  async executeRaw(query: string, params?: any[]) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    // ✅ Validate schema name in template
    if (!/^tenant_[a-z0-9_]+$/.test(this.tenantSchema)) {
      throw new Error('Invalid tenant schema');
    }

    const fullQuery = query.replace(/\{schema\}/g, `"${this.tenantSchema}"`);
    return this.prisma.$executeRawUnsafe(fullQuery, ...(params || []));
  }

  // ✅ SECURITY: Validate UUID format
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private sanitizeTableName(tableName: string): string {
    // Convert PascalCase to snake_case (e.g., "Invoice" -> "invoices")
    const snakeCase = tableName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .substring(1);

    // Add 's' for plural if not already plural
    if (!snakeCase.endsWith('s')) {
      return snakeCase + 's';
    }

    return snakeCase;
  }
}
