import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  constructor(private prisma: PrismaService) {}

  private tenantSchema!: string;

  setTenantSchema(schema: string) {
    this.tenantSchema = schema;
  }

  getTenantSchema(): string {
    return this.tenantSchema;
  }

  // ✅ FIXED: Added all missing methods with correct signatures

  async findMany(tenantId: string, tableName: string, options: any = {}) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    const { where, include, orderBy, take, skip } = options;
    const sanitizedTable = this.sanitizeTableName(tableName);

    let query = `SELECT * FROM "${this.tenantSchema}"."${sanitizedTable}"`;
    const params: any[] = [];
    let paramIndex = 1;

    if (where && Object.keys(where).length > 0) {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(where)) {
        if (value !== undefined && value !== null) {
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    if (orderBy && Object.keys(orderBy).length > 0) {
      const [field, direction] = Object.entries(orderBy)[0];
      query += ` ORDER BY ${field} ${String(direction).toUpperCase()}`;
    }

    if (take) {
      query += ` LIMIT $${paramIndex}`;
      params.push(take);
      paramIndex++;
    }

    if (skip) {
      query += ` OFFSET $${paramIndex}`;
      params.push(skip);
    }

    return this.prisma.$queryRawUnsafe(query, ...params);
  }

  async findOne(tenantId: string, tableName: string, options: any = {}) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    const { where, include } = options;
    const sanitizedTable = this.sanitizeTableName(tableName);

    if (!where || !where.id) {
      throw new Error('findOne requires where.id parameter');
    }

    const query = `SELECT * FROM "${this.tenantSchema}"."${sanitizedTable}" WHERE id = $1 LIMIT 1`;
    const result = await this.prisma.$queryRawUnsafe(query, where.id);
    return result[0] || null;
  }

  async create(tenantId: string, tableName: string, options: any) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    const data = options.data;
    if (!data) {
      throw new Error('create requires data parameter');
    }

    const sanitizedTable = this.sanitizeTableName(tableName);

    // Generate UUID if not provided
    if (!data.id) {
      data.id = this.generateUUID();
    }

    // Add timestamps
    if (!data.created_at) {
      data.created_at = new Date();
    }
    if (!data.updated_at) {
      data.updated_at = new Date();
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO "${this.tenantSchema}"."${sanitizedTable}"
      (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.prisma.$queryRawUnsafe(query, ...values);
    return result[0];
  }

  async update(tenantId: string, tableName: string, options: any) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    const { where, data } = options;
    const sanitizedTable = this.sanitizeTableName(tableName);

    if (!where || !where.id) {
      throw new Error('update requires where.id parameter');
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error('update requires data parameter');
    }

    // Add updated timestamp
    data.updated_at = new Date();

    const setClause = Object.keys(data)
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
    return result[0];
  }

  async delete(tenantId: string, tableName: string, options: any) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    const { where } = options;
    const sanitizedTable = this.sanitizeTableName(tableName);

    if (!where || !where.id) {
      throw new Error('delete requires where.id parameter');
    }

    const query = `DELETE FROM "${this.tenantSchema}"."${sanitizedTable}" WHERE id = $1`;
    await this.prisma.$executeRawUnsafe(query, where.id);

    return { id: where.id, deleted: true };
  }

  async count(tenantId: string, tableName: string, options: any = {}) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    const { where } = options;
    const sanitizedTable = this.sanitizeTableName(tableName);

    let query = `SELECT COUNT(*) as count FROM "${this.tenantSchema}"."${sanitizedTable}"`;
    const params: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions: string[] = [];
      let paramIndex = 1;
      for (const [key, value] of Object.entries(where)) {
        if (value !== undefined && value !== null) {
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

  // ✅ ADDED: Batch query support
  async findManyByIds(tenantId: string, tableName: string, ids: string[]) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }

    if (!ids || ids.length === 0) {
      return [];
    }

    const sanitizedTable = this.sanitizeTableName(tableName);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const query = `SELECT * FROM "${this.tenantSchema}"."${sanitizedTable}" WHERE id IN (${placeholders})`;

    return this.prisma.$queryRawUnsafe(query, ...ids);
  }

  // Legacy methods for backward compatibility
  async queryRaw<T = any>(query: string, params?: any[]): Promise<T> {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }
    const fullQuery = query.replace(/\{schema\}/g, `"${this.tenantSchema}"`);
    return this.prisma.$queryRawUnsafe(fullQuery, ...(params || []));
  }

  async executeRaw(query: string, params?: any[]) {
    if (!this.tenantSchema) {
      throw new Error('Tenant schema not set');
    }
    const fullQuery = query.replace(/\{schema\}/g, `"${this.tenantSchema}"`);
    return this.prisma.$executeRawUnsafe(fullQuery, ...(params || []));
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

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
