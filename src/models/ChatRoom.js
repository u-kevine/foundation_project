const pool = require('../config/database');

class ChatRoom {
  static async create({ name, description, topic, created_by }) {
    const result = await pool.query(
      `INSERT INTO chat_rooms (name, description, topic, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, description, topic, created_by]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT cr.*, u.first_name, u.last_name,
       (SELECT COUNT(*) FROM chat_room_members WHERE chat_room_id = cr.id) as member_count,
       (SELECT COUNT(*) FROM messages WHERE chat_room_id = cr.id) as message_count
       FROM chat_rooms cr 
       LEFT JOIN users u ON cr.created_by = u.id 
       WHERE cr.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT cr.*, u.first_name, u.last_name,
      (SELECT COUNT(*) FROM chat_room_members WHERE chat_room_id = cr.id) as member_count
      FROM chat_rooms cr 
      LEFT JOIN users u ON cr.created_by = u.id 
      WHERE 1=1`;
    
    const values = [];
    let paramCount = 1;

    if (filters.topic) {
      query += ` AND cr.topic = $${paramCount}`;
      values.push(filters.topic);
      paramCount++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND cr.is_active = $${paramCount}`;
      values.push(filters.is_active);
      paramCount++;
    }

    query += ' ORDER BY cr.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
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
    const query = `UPDATE chat_rooms SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM chat_rooms WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async addMember(chatRoomId, userId) {
    const result = await pool.query(
      `INSERT INTO chat_room_members (chat_room_id, user_id) 
       VALUES ($1, $2) 
       ON CONFLICT (chat_room_id, user_id) DO NOTHING
       RETURNING *`,
      [chatRoomId, userId]
    );
    return result.rows[0];
  }

  static async removeMember(chatRoomId, userId) {
    const result = await pool.query(
      'DELETE FROM chat_room_members WHERE chat_room_id = $1 AND user_id = $2 RETURNING *',
      [chatRoomId, userId]
    );
    return result.rows[0];
  }

  static async getMembers(chatRoomId) {
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.profile_picture, crm.joined_at
       FROM chat_room_members crm
       JOIN users u ON crm.user_id = u.id
       WHERE crm.chat_room_id = $1
       ORDER BY crm.joined_at DESC`,
      [chatRoomId]
    );
    return result.rows;
  }
}

module.exports = ChatRoom;