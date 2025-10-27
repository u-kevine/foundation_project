const pool = require('../config/database');

const chatroomController = {
  async createChatRoom(req, res) {
    try {
      const { name, description, topic } = req.body;
      const createdBy = req.user.id;

      const result = await pool.query(
        `INSERT INTO chat_rooms (name, description, topic, created_by) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, description, topic, createdBy]
      );

      res.status(201).json({
        success: true,
        message: 'Chat room created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Create chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating chat room',
      });
    }
  },

  async getAllChatRooms(req, res) {
    try {
      const { topic, is_active = true } = req.query;
      
      let query = 'SELECT cr.*, u.first_name, u.last_name FROM chat_rooms cr LEFT JOIN users u ON cr.created_by = u.id WHERE cr.is_active = $1';
      const params = [is_active];

      if (topic) {
        query += ' AND cr.topic = $2';
        params.push(topic);
      }

      query += ' ORDER BY cr.created_at DESC';

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get chat rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chat rooms',
      });
    }
  },

  async getChatRoomById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT cr.*, u.first_name, u.last_name,
         (SELECT COUNT(*) FROM chat_room_members WHERE chat_room_id = cr.id) as member_count
         FROM chat_rooms cr 
         LEFT JOIN users u ON cr.created_by = u.id 
         WHERE cr.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found',
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Get chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chat room',
      });
    }
  },

  async joinChatRoom(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const checkRoom = await pool.query(
        'SELECT id FROM chat_rooms WHERE id = $1 AND is_active = true',
        [id]
      );

      if (checkRoom.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found or inactive',
        });
      }

      await pool.query(
        `INSERT INTO chat_room_members (chat_room_id, user_id) 
         VALUES ($1, $2) 
         ON CONFLICT (chat_room_id, user_id) DO NOTHING`,
        [id, userId]
      );

      res.status(200).json({
        success: true,
        message: 'Joined chat room successfully',
      });
    } catch (error) {
      console.error('Join chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Error joining chat room',
      });
    }
  },

  async leaveChatRoom(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await pool.query(
        'DELETE FROM chat_room_members WHERE chat_room_id = $1 AND user_id = $2',
        [id, userId]
      );

      res.status(200).json({
        success: true,
        message: 'Left chat room successfully',
      });
    } catch (error) {
      console.error('Leave chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Error leaving chat room',
      });
    }
  },

  async getChatRoomMessages(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const result = await pool.query(
        `SELECT m.*, u.first_name, u.last_name, u.profile_picture
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.chat_room_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      res.status(200).json({
        success: true,
        data: result.rows.reverse(),
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching messages',
      });
    }
  },
};

module.exports = chatroomController;