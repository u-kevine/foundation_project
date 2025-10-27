const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, profile_picture, 
              is_verified, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, profile_picture } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, profile_picture = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING id, email, first_name, last_name, profile_picture`,
      [first_name, last_name, profile_picture, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
    });
  }
});

module.exports = router;
