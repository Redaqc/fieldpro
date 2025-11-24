/**
 * DashboardConfig Model
 * Manages user dashboard configurations and preferences
 */

import pool from '../database/pool.js';

class DashboardConfig {
  /**
   * Get dashboard config by user ID
   */
  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM dashboard_configs WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get dashboard config by role ID
   */
  static async findByRoleId(roleId) {
    const result = await pool.query(
      'SELECT * FROM dashboard_configs WHERE role_id = $1',
      [roleId]
    );
    return result.rows[0];
  }

  /**
   * Get or create default config for user
   */
  static async getOrCreate(userId, roleId = null) {
    let config = await this.findByUserId(userId);

    if (!config) {
      // Try to get role-based config as template
      let templateConfig = null;
      if (roleId) {
        templateConfig = await this.findByRoleId(roleId);
      }

      // Create default config
      config = await this.create({
        user_id: userId,
        role_id: roleId,
        layout: templateConfig?.layout || this.getDefaultLayout(),
        widgets: templateConfig?.widgets || this.getDefaultWidgets(),
        preferences: templateConfig?.preferences || {}
      });
    }

    return config;
  }

  /**
   * Create new dashboard config
   */
  static async create(data) {
    const { user_id, role_id, layout, widgets, preferences } = data;

    const result = await pool.query(
      `INSERT INTO dashboard_configs (user_id, role_id, layout, widgets, preferences)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, role_id, layout || [], widgets || [], preferences || {}]
    );

    return result.rows[0];
  }

  /**
   * Update dashboard config
   */
  static async update(userId, data) {
    const { layout, widgets, preferences } = data;

    const result = await pool.query(
      `UPDATE dashboard_configs
       SET layout = COALESCE($1, layout),
           widgets = COALESCE($2, widgets),
           preferences = COALESCE($3, preferences),
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [layout, widgets, preferences, userId]
    );

    return result.rows[0];
  }

  /**
   * Update layout
   */
  static async updateLayout(userId, layout) {
    const result = await pool.query(
      `UPDATE dashboard_configs
       SET layout = $1,
           updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [layout, userId]
    );

    return result.rows[0];
  }

  /**
   * Add widget
   */
  static async addWidget(userId, widget) {
    const config = await this.findByUserId(userId);
    if (!config) {
      throw new Error('Dashboard config not found');
    }

    const widgets = config.widgets || [];
    widgets.push(widget);

    return await this.update(userId, { widgets });
  }

  /**
   * Remove widget
   */
  static async removeWidget(userId, widgetId) {
    const config = await this.findByUserId(userId);
    if (!config) {
      throw new Error('Dashboard config not found');
    }

    const widgets = (config.widgets || []).filter(w => w.id !== widgetId);

    return await this.update(userId, { widgets });
  }

  /**
   * Update widget position
   */
  static async updateWidgetPosition(userId, widgetId, position) {
    const config = await this.findByUserId(userId);
    if (!config) {
      throw new Error('Dashboard config not found');
    }

    const widgets = config.widgets || [];
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);

    if (widgetIndex !== -1) {
      widgets[widgetIndex] = { ...widgets[widgetIndex], ...position };
    }

    return await this.update(userId, { widgets });
  }

  /**
   * Update preferences
   */
  static async updatePreferences(userId, preferences) {
    const config = await this.findByUserId(userId);
    if (!config) {
      throw new Error('Dashboard config not found');
    }

    const updatedPreferences = { ...(config.preferences || {}), ...preferences };

    return await this.update(userId, { preferences: updatedPreferences });
  }

  /**
   * Reset to default
   */
  static async resetToDefault(userId) {
    return await this.update(userId, {
      layout: this.getDefaultLayout(),
      widgets: this.getDefaultWidgets(),
      preferences: {}
    });
  }

  /**
   * Delete dashboard config
   */
  static async delete(userId) {
    const result = await pool.query(
      'DELETE FROM dashboard_configs WHERE user_id = $1 RETURNING *',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get default layout
   */
  static getDefaultLayout() {
    return [
      { i: 'stats', x: 0, y: 0, w: 12, h: 2 },
      { i: 'recent-jobs', x: 0, y: 2, w: 6, h: 4 },
      { i: 'calendar', x: 6, y: 2, w: 6, h: 4 },
      { i: 'technicians', x: 0, y: 6, w: 6, h: 3 },
      { i: 'alerts', x: 6, y: 6, w: 6, h: 3 }
    ];
  }

  /**
   * Get default widgets
   */
  static getDefaultWidgets() {
    return [
      { id: 'stats', type: 'statistics', enabled: true },
      { id: 'recent-jobs', type: 'job-list', enabled: true },
      { id: 'calendar', type: 'calendar', enabled: true },
      { id: 'technicians', type: 'technician-status', enabled: true },
      { id: 'alerts', type: 'alerts-panel', enabled: true }
    ];
  }
}

export default DashboardConfig;
