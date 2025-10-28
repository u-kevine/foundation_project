const Message = require('../models/Message');
const pool = require('../config/database');

const messageController = {
  async sendPrivateMessage(req, res) {
    try {
      const { receiver_id, content } = req.body;
      const senderId = req.user.id;

      if (senderId === receiver_id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot send message to yourself',
        });
      }

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
  },

  async getPrivateMessages(req, res) {
    try {
      const userId = req.user.id;
      const { other_user_id, limit = 50, offset = 0 } = req.query;

      if (!other_user_id) {
        return res.status(400).json({
          success: false,
          message: 'other_user_id is required',
        });
      }

      const result = await pool.query(
        `SELECT pm.*, 
                sender.first_name as sender_first_name, 
                sender.last_name as sender_last_name,
                sender.profile_picture as sender_profile_picture,
                receiver.first_name as receiver_first_name, 
                receiver.last_name as receiver_last_name,
                receiver.profile_picture as receiver_profile_picture
         FROM private_messages pm
         JOIN users sender ON pm.sender_id = sender.id
         JOIN users receiver ON pm.receiver_id = receiver.id
         WHERE (pm.sender_id = $1 AND pm.receiver_id = $2) 
            OR (pm.sender_id = $2 AND pm.receiver_id = $1)
         ORDER BY pm.created_at ASC
         LIMIT $3 OFFSET $4`,
        [userId, other_user_id, limit, offset]
      );

      // Mark messages as read
      await pool.query(
        `UPDATE private_messages 
         SET is_read = true 
         WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false`,
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
  },

  async getConversations(req, res) {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `WITH latest_messages AS (
          SELECT DISTINCT ON (
            CASE 
              WHEN sender_id = $1 THEN receiver_id 
              ELSE sender_id 
            END
          )
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END as other_user_id,
          content as last_message,
          created_at as last_message_time,
          sender_id,
          receiver_id
          FROM private_messages
          WHERE sender_id = $1 OR receiver_id = $1
          ORDER BY 
            CASE 
              WHEN sender_id = $1 THEN receiver_id 
              ELSE sender_id 
            END,
            created_at DESC
        )
        SELECT 
          lm.other_user_id,
          u.first_name, 
          u.last_name, 
          u.profile_picture,
          lm.last_message,
          lm.last_message_time,
          (SELECT COUNT(*) 
           FROM private_messages 
           WHERE receiver_id = $1 
           AND sender_id = lm.other_user_id 
           AND is_read = false) as unread_count
        FROM latest_messages lm
        JOIN users u ON lm.other_user_id = u.id
        ORDER BY lm.last_message_time DESC`,
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
  },

  async markAsRead(req, res) {
    try {
      const { sender_id } = req.body;
      const receiverId = req.user.id;

      await pool.query(
        `UPDATE private_messages 
         SET is_read = true 
         WHERE receiver_id = $1 AND sender_id = $2`,
        [receiverId, sender_id]
      );

      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Error marking messages as read',
      });
    }
  },

  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await pool.query(
        'DELETE FROM private_messages WHERE id = $1 AND sender_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Message not found or not authorized',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting message',
      });
    }
  },

  async getChatRoomMessages(req, res) {
    try {
      const { chatRoomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await Message.getByChatRoom(chatRoomId, limit, offset);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error('Get chat room messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching messages',
      });
    }
  },

  async flagMessage(req, res) {
    try {
      const { id } = req.params;

      const message = await Message.flag(id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Message flagged successfully',
        data: message,
      });
    } catch (error) {
      console.error('Flag message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error flagging message',
      });
    }
  },
};

module.exports = messageController;