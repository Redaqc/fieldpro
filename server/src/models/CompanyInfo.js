/**
 * CompanyInfo Model - Company settings
 */
import { query } from '../database/config.js';
import { notFound } from '../middleware/errorHandler.js';

export class CompanyInfo {
  static async get() {
    const result = await query('SELECT * FROM company_info LIMIT 1', []);
    return result.rows[0] || null;
  }

  static async update(data) {
    const { name, address, city, state, zip, country, phone, email, website, logo_url, tax_id } = data;

    const existing = await this.get();

    if (existing) {
      const result = await query(
        `UPDATE company_info SET name = $1, address = $2, city = $3, state = $4, zip = $5,
         country = $6, phone = $7, email = $8, website = $9, logo_url = $10, tax_id = $11, updated_at = NOW()
         WHERE id = $12 RETURNING *`,
        [name, address, city, state, zip, country, phone, email, website, logo_url, tax_id, existing.id]
      );
      return result.rows[0];
    } else {
      const result = await query(
        `INSERT INTO company_info (name, address, city, state, zip, country, phone, email, website, logo_url, tax_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
        [name, address, city, state, zip, country, phone, email, website, logo_url, tax_id]
      );
      return result.rows[0];
    }
  }
}

export default CompanyInfo;
