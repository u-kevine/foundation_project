const axios = require('axios');
const pool = require('../config/database');

const aiController = {
  async chat(req, res) {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user.id;

      let conversation;
      
      if (conversationId) {
        const result = await pool.query(
          'SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2',
          [conversationId, userId]
        );
        conversation = result.rows[0];
      }

      const conversationHistory = conversation?.conversation_history || [];
      conversationHistory.push({ role: 'user', content: message });

      const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself'];
      const isCrisis = crisisKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );

      let aiResponse;
      
      if (isCrisis) {
        aiResponse = `I'm really concerned about what you're sharing. Please know that you're not alone, and there are people who want to help you right now.

Please contact emergency services immediately:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

Would you like me to connect you with a professional therapist on our platform right away?`;
        
        await pool.query(
          `INSERT INTO ai_conversations (user_id, conversation_history, crisis_detected) 
           VALUES ($1, $2, true) 
           ON CONFLICT (id) DO UPDATE SET crisis_detected = true`,
          [userId, JSON.stringify(conversationHistory)]
        );
      } else {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are a compassionate mental health support assistant. Provide empathetic, 
                supportive responses while encouraging professional help when needed. Never provide 
                medical diagnoses or prescribe medication. Focus on active listening, validation, 
                and suggesting coping strategies.`
              },
              ...conversationHistory
            ],
            max_tokens: 500,
            temperature: 0.7,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        aiResponse = response.data.choices[0].message.content;
      }

      conversationHistory.push({ role: 'assistant', content: aiResponse });

      const saveResult = await pool.query(
        `INSERT INTO ai_conversations (user_id, conversation_history, crisis_detected) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (id) DO UPDATE 
         SET conversation_history = $2, updated_at = CURRENT_TIMESTAMP, crisis_detected = $3
         RETURNING id`,
        [userId, JSON.stringify(conversationHistory), isCrisis]
      );

      res.status(200).json({
        success: true,
        data: {
          message: aiResponse,
          conversationId: conversationId || saveResult.rows[0].id,
          crisisDetected: isCrisis,
        },
      });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing AI request',
      });
    }
  },

  async getConversationHistory(req, res) {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;

      const result = await pool.query(
        'SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching conversation',
      });
    }
  },

  async getAllConversations(req, res) {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `SELECT id, crisis_detected, created_at, updated_at 
         FROM ai_conversations 
         WHERE user_id = $1 
         ORDER BY updated_at DESC`,
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
};

module.exports = aiController;