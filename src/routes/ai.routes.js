const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const aiController = require('../controllers/ai.controller');

router.post('/chat', authMiddleware, aiController.chat);
router.get('/conversations', authMiddleware, aiController.getAllConversations);
router.get('/conversations/:conversationId', authMiddleware, aiController.getConversationHistory);

module.exports = router;