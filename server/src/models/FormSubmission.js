/**
 * FormSubmission Model
 */
import { query } from '../database/config.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';

export class FormSubmission {
  static async create(data) {
    const { template_id, job_id, technician_id, data: formData = {}, submitted_at = new Date().toISOString() } = data;
    if (!template_id) throw badRequest('Template ID required');

    const result = await query(
      `INSERT INTO form_submissions (template_id, job_id, technician_id, data, submitted_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [template_id, job_id, technician_id, formData, submitted_at]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM form_submissions WHERE id = $1', [id]);
    if (result.rows.length === 0) throw notFound(`FormSubmission ${id} not found`);
    return result.rows[0];
  }

  static async update(id, updateData) {
    await this.findById(id);
    const result = await query(
      `UPDATE form_submissions SET data = $1 WHERE id = $2 RETURNING *`,
      [updateData.data, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await this.findById(id);
    await query('DELETE FROM form_submissions WHERE id = $1', [id]);
    return true;
  }

  static async getByJob(jobId) {
    const result = await query(
      `SELECT fs.*, ft.name as template_name FROM form_submissions fs
       JOIN form_templates ft ON fs.template_id = ft.id
       WHERE fs.job_id = $1 ORDER BY fs.submitted_at DESC`,
      [jobId]
    );
    return result.rows;
  }

  static async list(options = {}) {
    const { limit = 50, offset = 0, template_id, job_id, technician_id } = options;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (template_id) {
      conditions.push(`template_id = $${paramCount++}`);
      values.push(template_id);
    }
    if (job_id) {
      conditions.push(`job_id = $${paramCount++}`);
      values.push(job_id);
    }
    if (technician_id) {
      conditions.push(`technician_id = $${paramCount++}`);
      values.push(technician_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM form_submissions ${whereClause} ORDER BY submitted_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );
    return result.rows;
  }
}

export default FormSubmission;
