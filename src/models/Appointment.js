const pool = require('../config/database');

class Appointment {
  static async create(data) {
    const { user_id, therapist_id, appointment_date, duration, notes } = data;
    
    const result = await pool.query(
      `INSERT INTO appointments (user_id, therapist_id, appointment_date, duration, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, therapist_id, appointment_date, duration, notes]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT a.*, 
              t.specialization, t.bio,
              u1.first_name as patient_first_name, u1.last_name as patient_last_name,
              u2.first_name as therapist_first_name, u2.last_name as therapist_last_name
       FROM appointments a
       JOIN users u1 ON a.user_id = u1.id
       JOIN therapists t ON a.therapist_id = t.id
       JOIN users u2 ON t.user_id = u2.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getByUser(userId, filters = {}) {
    let query = `
      SELECT a.*, 
             t.specialization, t.bio,
             u.first_name as therapist_first_name, 
             u.last_name as therapist_last_name
      FROM appointments a
      JOIN therapists t ON a.therapist_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE a.user_id = $1`;
    
    const values = [userId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    query += ' ORDER BY a.appointment_date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getByTherapist(therapistId, filters = {}) {
    let query = `
      SELECT a.*, 
             u.first_name as patient_first_name, 
             u.last_name as patient_last_name,
             u.email as patient_email
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      WHERE a.therapist_id = $1`;
    
    const values = [therapistId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    query += ' ORDER BY a.appointment_date ASC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE appointments 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE appointments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM appointments WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async checkConflict(therapistId, appointmentDate) {
    const result = await pool.query(
      `SELECT id FROM appointments 
       WHERE therapist_id = $1 
       AND appointment_date = $2 
       AND status != 'cancelled'`,
      [therapistId, appointmentDate]
    );
    return result.rows.length > 0;
  }
}

module.exports = Appointment;