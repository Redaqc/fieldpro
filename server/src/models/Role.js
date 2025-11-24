/**
 * Role Model
 * Manages user roles and permissions
 */

import pool from '../database/pool.js';

class Role {
  /**
   * Get all roles
   */
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM roles ORDER BY name'
    );
    return result.rows;
  }

  /**
   * Get role by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get role by name
   */
  static async findByName(name) {
    const result = await pool.query(
      'SELECT * FROM roles WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  /**
   * Create new role
   */
  static async create(data) {
    const { name, description, permissions, is_system_role } = data;

    const result = await pool.query(
      `INSERT INTO roles (name, description, permissions, is_system_role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, permissions || {}, is_system_role || false]
    );

    return result.rows[0];
  }

  /**
   * Update role
   */
  static async update(id, data) {
    const { name, description, permissions } = data;

    const result = await pool.query(
      `UPDATE roles
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           permissions = COALESCE($3, permissions),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, description, permissions, id]
    );

    return result.rows[0];
  }

  /**
   * Delete role (only non-system roles)
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 AND is_system_role = false RETURNING *',
      [id]
    );

    return result.rows[0];
  }

  /**
   * Check if role has permission
   */
  static async hasPermission(roleId, permissionKey) {
    const role = await this.findById(roleId);
    if (!role || !role.permissions) return false;

    return role.permissions[permissionKey] === true;
  }

  /**
   * Grant permission to role
   */
  static async grantPermission(roleId, permissionKey) {
    const role = await this.findById(roleId);
    if (!role) throw new Error('Role not found');

    const permissions = role.permissions || {};
    permissions[permissionKey] = true;

    return await this.update(roleId, { permissions });
  }

  /**
   * Revoke permission from role
   */
  static async revokePermission(roleId, permissionKey) {
    const role = await this.findById(roleId);
    if (!role) throw new Error('Role not found');

    const permissions = role.permissions || {};
    delete permissions[permissionKey];

    return await this.update(roleId, { permissions });
  }
}

export default Role;
