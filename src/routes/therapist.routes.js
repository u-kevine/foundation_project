const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const pool = require('../config/database');

router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { license_number, specialization, bio, years_experience, availability } = req.body;
    const userId = req.user.id;

    const existingTherapist = await pool.query(
      'SELECT id FROM therapists WHERE user_id = $1',
      [userId]
    );

    if (existingTherapist.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Therapist profile already exists',
      });
    }

    const result = await pool.query(
      `INSERT INTO therapists (user_id, license_number, specialization, bio, years_experience, availability) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, license_number, specialization, bio, years_experience, JSON.stringify(availability)]
    );

    await pool.query(
      "UPDATE users SET role = 'therapist' WHERE id = $1",
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Therapist profile created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Register therapist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering therapist',
    });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { specialization, is_verified = true } = req.query;

    let query = `
      SELECT t.*, u.first_name, u.last_name, u.email, u.profile_picture
      FROM therapists t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_verified = $1`;
    
    const params = [is_verified];

    if (specialization) {
      query += ' AND $2 = ANY(t.specialization)';
      params.push(specialization);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get therapists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching therapists',
    });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*, u.first_name, u.last_name, u.email, u.profile_picture
       FROM therapists t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get therapist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching therapist',
    });
  }
});

router.put('/profile', authMiddleware, roleCheck('therapist'), async (req, res) => {
  try {
    const { specialization, bio, years_experience, availability } = req.body;
    
    const result = await pool.query(
      `UPDATE therapists 
       SET specialization = $1, bio = $2, years_experience = $3, 
           availability = $4, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5 
       RETURNING *`,
      [specialization, bio, years_experience, JSON.stringify(availability), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Therapist profile updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update therapist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating therapist profile',
    });
  }
});

module.exports = router;