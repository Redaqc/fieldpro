/**
 * LanguageSettings Model
 * Manages user language and localization preferences
 */

import pool from '../database/pool.js';

class LanguageSettings {
  /**
   * Get language settings by user ID
   */
  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM language_settings WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get or create default settings for user
   */
  static async getOrCreate(userId) {
    let settings = await this.findByUserId(userId);

    if (!settings) {
      settings = await this.create({
        user_id: userId,
        language_code: 'en',
        locale: 'en-US',
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY',
        time_format: 'hh:mm A',
        currency: 'USD'
      });
    }

    return settings;
  }

  /**
   * Create new language settings
   */
  static async create(data) {
    const {
      user_id,
      language_code,
      locale,
      timezone,
      date_format,
      time_format,
      currency
    } = data;

    const result = await pool.query(
      `INSERT INTO language_settings
       (user_id, language_code, locale, timezone, date_format, time_format, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user_id,
        language_code || 'en',
        locale || 'en-US',
        timezone || 'UTC',
        date_format || 'MM/DD/YYYY',
        time_format || 'hh:mm A',
        currency || 'USD'
      ]
    );

    return result.rows[0];
  }

  /**
   * Update language settings
   */
  static async update(userId, data) {
    const {
      language_code,
      locale,
      timezone,
      date_format,
      time_format,
      currency
    } = data;

    const result = await pool.query(
      `UPDATE language_settings
       SET language_code = COALESCE($1, language_code),
           locale = COALESCE($2, locale),
           timezone = COALESCE($3, timezone),
           date_format = COALESCE($4, date_format),
           time_format = COALESCE($5, time_format),
           currency = COALESCE($6, currency),
           updated_at = NOW()
       WHERE user_id = $7
       RETURNING *`,
      [language_code, locale, timezone, date_format, time_format, currency, userId]
    );

    return result.rows[0];
  }

  /**
   * Update language only
   */
  static async updateLanguage(userId, languageCode) {
    const localeMap = {
      'en': 'en-US',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'zh': 'zh-CN',
      'ja': 'ja-JP'
    };

    const locale = localeMap[languageCode] || 'en-US';

    const result = await pool.query(
      `UPDATE language_settings
       SET language_code = $1,
           locale = $2,
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      [languageCode, locale, userId]
    );

    return result.rows[0];
  }

  /**
   * Update timezone
   */
  static async updateTimezone(userId, timezone) {
    const result = await pool.query(
      `UPDATE language_settings
       SET timezone = $1,
           updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [timezone, userId]
    );

    return result.rows[0];
  }

  /**
   * Update date format
   */
  static async updateDateFormat(userId, dateFormat) {
    const result = await pool.query(
      `UPDATE language_settings
       SET date_format = $1,
           updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [dateFormat, userId]
    );

    return result.rows[0];
  }

  /**
   * Update currency
   */
  static async updateCurrency(userId, currency) {
    const result = await pool.query(
      `UPDATE language_settings
       SET currency = $1,
           updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [currency, userId]
    );

    return result.rows[0];
  }

  /**
   * Delete language settings
   */
  static async delete(userId) {
    const result = await pool.query(
      'DELETE FROM language_settings WHERE user_id = $1 RETURNING *',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', locale: 'en-US' },
      { code: 'fr', name: 'Français', locale: 'fr-FR' },
      { code: 'es', name: 'Español', locale: 'es-ES' },
      { code: 'de', name: 'Deutsch', locale: 'de-DE' },
      { code: 'it', name: 'Italiano', locale: 'it-IT' },
      { code: 'pt', name: 'Português', locale: 'pt-BR' },
      { code: 'zh', name: '中文', locale: 'zh-CN' },
      { code: 'ja', name: '日本語', locale: 'ja-JP' }
    ];
  }

  /**
   * Get supported date formats
   */
  static getDateFormats() {
    return [
      { format: 'MM/DD/YYYY', example: '12/31/2025' },
      { format: 'DD/MM/YYYY', example: '31/12/2025' },
      { format: 'YYYY-MM-DD', example: '2025-12-31' },
      { format: 'DD.MM.YYYY', example: '31.12.2025' }
    ];
  }

  /**
   * Get supported time formats
   */
  static getTimeFormats() {
    return [
      { format: 'hh:mm A', example: '02:30 PM' },
      { format: 'HH:mm', example: '14:30' }
    ];
  }

  /**
   * Get supported currencies
   */
  static getCurrencies() {
    return [
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
      { code: 'GBP', symbol: '£', name: 'British Pound' },
      { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
      { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }
    ];
  }
}

export default LanguageSettings;
