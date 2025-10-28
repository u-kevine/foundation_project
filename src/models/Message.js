const pool = require('../config/database');

class Message {
  static async create({ chat_room_id, user_id, content }) {
    const result = await pool.query(
      `INSERT INTO messages (chat_room_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [chat_room_id, user_id, content]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT m.*, u.first_name, u.last_name, u.profile_picture
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getByChatRoom(chatRoomId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT m.*, u.first_name, u.last_name, u.profile_picture
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.chat_room_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatRoomId, limit, offset]
    );
    return result.rows.reverse();
  }

  static async flag(id) {
    const result = await pool.query(
      'UPDATE messages SET is_flagged = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM messages WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Message;