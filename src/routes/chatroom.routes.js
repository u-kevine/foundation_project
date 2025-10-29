const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const chatroomController = require('../controllers/chatroom.controller');
const { validate, validationRules } = require('../utils/validation');

// Create chat room
router.post('/',
  authMiddleware,
  validate(validationRules.createChatRoom),
  chatroomController.createChatRoom
);

// Get all chat rooms
router.get('/',
  authMiddleware,
  validate(validationRules.pagination),
  chatroomController.getAllChatRooms
);

// Get chat room by ID
router.get('/:id',
  authMiddleware,
  validate(validationRules.idParam),
  chatroomController.getChatRoomById
);

// Join chat room
router.post('/:id/join',
  authMiddleware,
  validate(validationRules.idParam),
  chatroomController.joinChatRoom
);

// Leave chat room
router.post('/:id/leave',
  authMiddleware,
  validate(validationRules.idParam),
  chatroomController.leaveChatRoom
);

// Get chat room messages
router.get('/:id/messages',
  authMiddleware,
  validate([
    ...validationRules.idParam,
    ...validationRules.pagination,
  ]),
  chatroomController.getChatRoomMessages
);

module.exports = router;
