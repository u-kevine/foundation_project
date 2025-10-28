const pool = require('../config/database');

class AIConversation {
  static async create(userId, conversationHistory, crisisDetected = false) {
    const result = await pool.query(
      `INSERT INTO ai_conversations (user_id, conversation_history, crisis_detected) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userId, JSON.stringify(conversationHistory), crisisDetected]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM ai_conversations WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, conversationHistory, crisisDetected = false) {
    const result = await pool.query(
      `UPDATE ai_conversations 
       SET conversation_history = $1, crisis_detected = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [JSON.stringify(conversationHistory), crisisDetected, id]
    );
    return result.rows[0];
  }

  static async getByUser(userId) {
    const result = await pool.query(
      `SELECT id, crisis_detected, created_at, updated_at 
       FROM ai_conversations 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async getCrisisConversations() {
    const result = await pool.query(
      `SELECT ac.*, u.email, u.first_name, u.last_name
       FROM ai_conversations ac
       JOIN users u ON ac.user_id = u.id
       WHERE ac.crisis_detected = true
       ORDER BY ac.updated_at DESC`
    );
    return result.rows;
  }
}

module.exports = AIConversation;