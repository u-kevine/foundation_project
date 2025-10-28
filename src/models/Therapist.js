const pool = require('../config/database');

class Therapist {
  static async create(data) {
    const { user_id, license_number, specialization, bio, years_experience, availability } = data;
    
    const result = await pool.query(
      `INSERT INTO therapists (user_id, license_number, specialization, bio, years_experience, availability) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [user_id, license_number, specialization, bio, years_experience, JSON.stringify(availability)]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT t.*, u.first_name, u.last_name, u.email, u.profile_picture
       FROM therapists t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM therapists WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  static async findByLicenseNumber(licenseNumber) {
    const result = await pool.query(
      'SELECT * FROM therapists WHERE license_number = $1',
      [licenseNumber]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        if (key === 'availability') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(data[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(data[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE therapists SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async verify(id) {
    const result = await pool.query(
      'UPDATE therapists SET is_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT t.*, u.first_name, u.last_name, u.email, u.profile_picture,
             (SELECT COUNT(*) FROM appointments WHERE therapist_id = t.id) as total_appointments
      FROM therapists t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1`;
    
    const values = [];
    let paramCount = 1;

    if (filters.specialization) {
      query += ` AND $${paramCount} = ANY(t.specialization)`;
      values.push(filters.specialization);
      paramCount++;
    }

    if (filters.is_verified !== undefined) {
      query += ` AND t.is_verified = $${paramCount}`;
      values.push(filters.is_verified);
      paramCount++;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM therapists WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Therapist;