const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const chatroomController = require('../controllers/chatroom.controller');

router.post('/', authMiddleware, chatroomController.createChatRoom);
router.get('/', authMiddleware, chatroomController.getAllChatRooms);
router.get('/:id', authMiddleware, chatroomController.getChatRoomById);
router.post('/:id/join', authMiddleware, chatroomController.joinChatRoom);
router.post('/:id/leave', authMiddleware, chatroomController.leaveChatRoom);
router.get('/:id/messages', authMiddleware, chatroomController.getChatRoomMessages);

module.exports = router;