const pool = require('../config/database');

const appointmentController = {
  async createAppointment(req, res) {
    try {
      const { therapist_id, appointment_date, duration = 60, notes } = req.body;
      const userId = req.user.id;

      const therapistCheck = await pool.query(
        'SELECT id FROM therapists WHERE id = $1 AND is_verified = true',
        [therapist_id]
      );

      if (therapistCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Therapist not found or not verified',
        });
      }

      const conflictCheck = await pool.query(
        `SELECT id FROM appointments 
         WHERE therapist_id = $1 
         AND appointment_date = $2 
         AND status != 'cancelled'`,
        [therapist_id, appointment_date]
      );

      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Time slot already booked',
        });
      }

      const result = await pool.query(
        `INSERT INTO appointments (user_id, therapist_id, appointment_date, duration, notes) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userId, therapist_id, appointment_date, duration, notes]
      );

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating appointment',
      });
    }
  },

  async getUserAppointments(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      let query = `
        SELECT a.*, 
               t.specialization, t.bio,
               u.first_name as therapist_first_name, 
               u.last_name as therapist_last_name
        FROM appointments a
        JOIN therapists t ON a.therapist_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE a.user_id = $1`;
      
      const params = [userId];

      if (status) {
        query += ' AND a.status = $2';
        params.push(status);
      }

      query += ' ORDER BY a.appointment_date DESC';

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get user appointments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching appointments',
      });
    }
  },

  async getTherapistAppointments(req, res) {
    try {
      const therapistResult = await pool.query(
        'SELECT id FROM therapists WHERE user_id = $1',
        [req.user.id]
      );

      if (therapistResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized as therapist',
        });
      }

      const therapistId = therapistResult.rows[0].id;
      const { status } = req.query;

      let query = `
        SELECT a.*, 
               u.first_name as patient_first_name, 
               u.last_name as patient_last_name,
               u.email as patient_email
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        WHERE a.therapist_id = $1`;
      
      const params = [therapistId];

      if (status) {
        query += ' AND a.status = $2';
        params.push(status);
      }

      query += ' ORDER BY a.appointment_date ASC';

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get therapist appointments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching appointments',
      });
    }
  },

  async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
        });
      }

      const result = await pool.query(
        `UPDATE appointments 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating appointment',
      });
    }
  },

  async deleteAppointment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await pool.query(
        'DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found or not authorized',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
      });
    } catch (error) {
      console.error('Delete appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling appointment',
      });
    }
  },
};

module.exports = appointmentController;