const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');

router.post('/private', authMiddleware, async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    const senderId = req.user.id;

    const result = await pool.query(
      `INSERT INTO private_messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [senderId, receiver_id, content]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
    });
  }
});

router.get('/private', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { other_user_id } = req.query;

    const result = await pool.query(
      `SELECT pm.*, 
              sender.first_name as sender_first_name, 
              sender.last_name as sender_last_name,
              receiver.first_name as receiver_first_name, 
              receiver.last_name as receiver_last_name
       FROM private_messages pm
       JOIN users sender ON pm.sender_id = sender.id
       JOIN users receiver ON pm.receiver_id = receiver.id
       WHERE (pm.sender_id = $1 AND pm.receiver_id = $2) 
          OR (pm.sender_id = $2 AND pm.receiver_id = $1)
       ORDER BY pm.created_at ASC`,
      [userId, other_user_id]
    );

    await pool.query(
      `UPDATE private_messages 
       SET is_read = true 
       WHERE receiver_id = $1 AND sender_id = $2`,
      [userId, other_user_id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
    });
  }
});

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
              CASE 
                WHEN sender_id = $1 THEN receiver_id 
                ELSE sender_id 
              END as other_user_id,
              u.first_name, u.last_name, u.profile_picture,
              pm.content as last_message,
              pm.created_at as last_message_time,
              (SELECT COUNT(*) FROM private_messages 
               WHERE receiver_id = $1 AND sender_id = other_user_id AND is_read = false) as unread_count
       FROM private_messages pm
       JOIN users u ON (CASE 
                         WHEN pm.sender_id = $1 THEN pm.receiver_id 
                         ELSE pm.sender_id 
                       END) = u.id
       WHERE sender_id = $1 OR receiver_id = $1
       ORDER BY other_user_id, pm.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
    });
  }
});

module.exports = router;