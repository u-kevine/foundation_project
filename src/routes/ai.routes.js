const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const aiController = require('../controllers/ai.controller');
const { validate, validationRules } = require('../utils/validation');

// Chat with AI assistant
router.post('/chat',
  authMiddleware,
  validate(validationRules.aiChat),
  aiController.chat
);

// Get all AI conversations
router.get('/conversations',
  authMiddleware,
  aiController.getAllConversations
);

// Get specific conversation history
router.get('/conversations/:conversationId',
  authMiddleware,
  validate([
    ...validationRules.idParam.map(validation => 
      validation.builder.param('conversationId').build()
    ),
  ]),
  aiController.getConversationHistory
);

// Delete conversation
router.delete('/conversations/:conversationId',
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const pool = require('../config/database');

      const result = await pool.query(
        'DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2 RETURNING id',
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
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting conversation',
      });
    }
  }
);

module.exports = router;
