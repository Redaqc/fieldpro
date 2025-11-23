/**
 * User Model - User management and authentication
 */
import { query } from '../database/config.js';
import { badRequest, notFound, unauthorized } from '../middleware/errorHandler.js';
import bcrypt from 'bcrypt';

export class User {
  static async create(data) {
    const {
      email,
      password,
      name,
      role = 'technician',
      phone = null,
      avatar_url = null,
      is_active = true
    } = data;

    // Validation
    if (!email) {
      throw badRequest('Email is required');
    }
    if (!password) {
      throw badRequest('Password is required');
    }
    if (!name) {
      throw badRequest('Name is required');
    }

    const validRoles = ['admin', 'manager', 'dispatcher', 'technician'];
    if (!validRoles.includes(role)) {
      throw badRequest(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Check if email already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw badRequest('Email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (email, password_hash, name, role, phone, avatar_url, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id, email, name, role, phone, avatar_url, is_active, created_at, updated_at`,
      [email, password_hash, name, role, phone, avatar_url, is_active]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, email, name, role, phone, avatar_url, is_active, last_login, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      throw notFound('User not found');
    }
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async update(id, data) {
    await this.findById(id);

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['email', 'name', 'role', 'phone', 'avatar_url', 'is_active'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        // Check if email is being changed and if it already exists
        if (field === 'email') {
          const existingUser = await query('SELECT * FROM users WHERE email = $1 AND id != $2', [data[field], id]);
          if (existingUser.rows.length > 0) {
            throw badRequest('Email already exists');
          }
        }

        fields.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw badRequest('No valid fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, name, role, phone, avatar_url, is_active, last_login, created_at, updated_at`,
      values
    );

    return result.rows[0];
  }

  static async updatePassword(id, oldPassword, newPassword) {
    const user = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      throw notFound('User not found');
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.rows[0].password_hash);
    if (!isValid) {
      throw unauthorized('Current password is incorrect');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, id]
    );

    return { success: true, message: 'Password updated successfully' };
  }

  static async resetPassword(id, newPassword) {
    await this.findById(id);

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, id]
    );

    return { success: true, message: 'Password reset successfully' };
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM users WHERE id = $1', [id]);
    return { success: true };
  }

  static async list(options = {}) {
    const { limit = 100, offset = 0, role = null, is_active = null } = options;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (role) {
      conditions.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const result = await query(
      `SELECT id, email, name, role, phone, avatar_url, is_active, last_login, created_at, updated_at
       FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return result.rows;
  }

  static async authenticate(email, password) {
    const user = await this.findByEmail(email);

    if (!user) {
      throw unauthorized('Invalid email or password');
    }

    if (!user.is_active) {
      throw unauthorized('Account is inactive');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw unauthorized('Invalid email or password');
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async deactivate(id) {
    return await this.update(id, { is_active: false });
  }

  static async activate(id) {
    return await this.update(id, { is_active: true });
  }

  static async getByRole(role) {
    const result = await query(
      `SELECT id, email, name, role, phone, avatar_url, is_active, last_login, created_at, updated_at
       FROM users WHERE role = $1 AND is_active = true ORDER BY name ASC`,
      [role]
    );
    return result.rows;
  }

  static async search(searchTerm, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await query(
      `SELECT id, email, name, role, phone, avatar_url, is_active, last_login, created_at, updated_at
       FROM users
       WHERE (name ILIKE $1 OR email ILIKE $1)
       ORDER BY name ASC LIMIT $2 OFFSET $3`,
      [`%${searchTerm}%`, limit, offset]
    );

    return result.rows;
  }
}

export default User;
