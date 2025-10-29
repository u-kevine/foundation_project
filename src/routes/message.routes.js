const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const messageController = require('../controllers/message.controller');
const { validate, validationRules } = require('../utils/validation');
const { body, query } = require('express-validator');

// Send private message
router.post('/private',
  authMiddleware,
  validate([
    body('receiver_id').isInt({ min: 1 }),
    body('content').trim().isLength({ min: 1, max: 2000 }),
  ]),
  messageController.sendPrivateMessage
);

// Get private messages with another user
router.get('/private',
  authMiddleware,
  validate([
    query('other_user_id').isInt({ min: 1 }),
    ...validationRules.pagination,
  ]),
  messageController.getPrivateMessages
);

// Get all conversations
router.get('/conversations',
  authMiddleware,
  messageController.getConversations
);

// Mark messages as read
router.put('/mark-read',
  authMiddleware,
  validate([
    body('sender_id').isInt({ min: 1 }),
  ]),
  messageController.markAsRead
);

// Delete private message
router.delete('/:id',
  authMiddleware,
  validate(validationRules.idParam),
  messageController.deleteMessage
);

// Flag message (report)
router.put('/:id/flag',
  authMiddleware,
  validate(validationRules.idParam),
  messageController.flagMessage
);

module.exports = router;