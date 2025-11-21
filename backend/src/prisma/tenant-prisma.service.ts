import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  constructor(private prisma: PrismaService) {}

  private tenantSchema: string;

  setTenantSchema(schema: string) {
    this.tenantSchema = schema;
  }

  getTenantSchema(): string {
    return this.tenantSchema;
  }

  async queryRaw<T = any>(query: string, params?: any[]): Promise<T> {
    const fullQuery = query.replace(/\{schema\}/g, this.tenantSchema);
    return this.prisma.$queryRawUnsafe(fullQuery, ...(params || []));
  }

  async executeRaw(query: string, params?: any[]) {
    const fullQuery = query.replace(/\{schema\}/g, this.tenantSchema);
    return this.prisma.$executeRawUnsafe(fullQuery, ...(params || []));
  }

  async findOne(tableName: string, id: string) {
    const result = await this.queryRaw(
      `SELECT * FROM {schema}.${tableName} WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result[0] || null;
  }

  async create(tableName: string, data: any) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await this.queryRaw(
      `INSERT INTO {schema}.${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result[0];
  }

  async update(tableName: string, id: string, data: any) {
    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = [...Object.values(data), id];

    const result = await this.queryRaw(
      `UPDATE {schema}.${tableName} SET ${setClause}, updated_date = NOW() WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return result[0];
  }

  async delete(tableName: string, id: string) {
    await this.executeRaw(
      `DELETE FROM {schema}.${tableName} WHERE id = $1`,
      [id],
    );
    return { id, deleted: true };
  }
}
