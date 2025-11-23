/**
 * AppSettings Model - Application-wide settings
 */
import { query } from '../database/config.js';

export class AppSettings {
  static async get() {
    const result = await query('SELECT * FROM app_settings LIMIT 1', []);
    return result.rows[0] || null;
  }

  static async update(data) {
    const {
      app_name,
      app_logo_url,
      timezone,
      date_format,
      time_format,
      currency,
      language,
      enable_gps_tracking = true,
      enable_notifications = true,
      enable_automations = true,
      enable_recurring_jobs = true,
      working_hours_start,
      working_hours_end,
      working_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      maintenance_mode = false,
      features = {}
    } = data;

    const existing = await this.get();

    if (existing) {
      const result = await query(
        `UPDATE app_settings SET
         app_name = $1, app_logo_url = $2, timezone = $3, date_format = $4, time_format = $5,
         currency = $6, language = $7, enable_gps_tracking = $8, enable_notifications = $9,
         enable_automations = $10, enable_recurring_jobs = $11, working_hours_start = $12,
         working_hours_end = $13, working_days = $14, maintenance_mode = $15, features = $16,
         updated_at = NOW()
         WHERE id = $17 RETURNING *`,
        [app_name, app_logo_url, timezone, date_format, time_format, currency, language,
         enable_gps_tracking, enable_notifications, enable_automations, enable_recurring_jobs,
         working_hours_start, working_hours_end, JSON.stringify(working_days), maintenance_mode,
         JSON.stringify(features), existing.id]
      );
      return result.rows[0];
    } else {
      const result = await query(
        `INSERT INTO app_settings (
          app_name, app_logo_url, timezone, date_format, time_format, currency, language,
          enable_gps_tracking, enable_notifications, enable_automations, enable_recurring_jobs,
          working_hours_start, working_hours_end, working_days, maintenance_mode, features,
          created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
         RETURNING *`,
        [app_name, app_logo_url, timezone, date_format, time_format, currency, language,
         enable_gps_tracking, enable_notifications, enable_automations, enable_recurring_jobs,
         working_hours_start, working_hours_end, JSON.stringify(working_days), maintenance_mode,
         JSON.stringify(features)]
      );
      return result.rows[0];
    }
  }
}

export default AppSettings;
