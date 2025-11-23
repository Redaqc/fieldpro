/**
 * TaxSettings Model
 */
import { query } from '../database/config.js';

export class TaxSettings {
  static async get() {
    const result = await query('SELECT * FROM tax_settings LIMIT 1', []);
    return result.rows[0] || null;
  }

  static async update(data) {
    const { default_tax_rate, tax_name, tax_number, enable_tax = true } = data;
    const existing = await this.get();

    if (existing) {
      const result = await query(
        `UPDATE tax_settings SET default_tax_rate = $1, tax_name = $2, tax_number = $3, enable_tax = $4, updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [default_tax_rate, tax_name, tax_number, enable_tax, existing.id]
      );
      return result.rows[0];
    } else {
      const result = await query(
        `INSERT INTO tax_settings (default_tax_rate, tax_name, tax_number, enable_tax, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
        [default_tax_rate, tax_name, tax_number, enable_tax]
      );
      return result.rows[0];
    }
  }
}

export default TaxSettings;
