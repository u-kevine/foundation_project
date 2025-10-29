const Message = require('../../models/Message');
const redisClient = require('../../config/redis');

const chatHandler = {
  async handleJoinChatroom(socket, data) {
    try {
      const { chatroomId } = data;
      const pool = require('../../config/database');

      // Verify user is a member
      const memberCheck = await pool.query(
        'SELECT id FROM chat_room_members WHERE chat_room_id = $1 AND user_id = $2',
        [chatroomId, socket.user.id]
      );

      if (memberCheck.rows.length === 0) {
        socket.emit('error', { message: 'Not a member of this chat room' });
        return;
      }

      socket.join(`chatroom:${chatroomId}`);
      console.log(`User ${socket.user.id} joined chatroom ${chatroomId}`);

      // Notify others in the room
      socket.to(`chatroom:${chatroomId}`).emit('user_joined', {
        userId: socket.user.id,
        firstName: socket.user.first_name,
        lastName: socket.user.last_name,
      });

      // Send cached messages
      const cachedMessages = await redisClient.lRange(
        `chatroom:${chatroomId}:messages`,
        0,
        49
      );

      if (cachedMessages.length > 0) {
        socket.emit('cached_messages', {
          messages: cachedMessages.map(msg => JSON.parse(msg)),
        });
      }
    } catch (error) {
      console.error('Join chatroom error:', error);
      socket.emit('error', { message: 'Error joining chat room' });
    }
  },

  handleLeaveChatroom(socket, data) {
    const { chatroomId } = data;
    socket.leave(`chatroom:${chatroomId}`);
    
    socket.to(`chatroom:${chatroomId}`).emit('user_left', {
      userId: socket.user.id,
      firstName: socket.user.first_name,
      lastName: socket.user.last_name,
    });
  },

  async handleSendMessage(socket, io, data) {
    try {
      const { chatroomId, content } = data;

      // Save message to database
      const message = await Message.create({
        chat_room_id: chatroomId,
        user_id: socket.user.id,
        content,
      });

      // Broadcast message to chat room
      const messageData = {
        ...message,
        first_name: socket.user.first_name,
        last_name: socket.user.last_name,
        profile_picture: socket.user.profile_picture,
      };

      io.to(`chatroom:${chatroomId}`).emit('new_message', messageData);

      // Cache message in Redis
      await redisClient.lPush(
        `chatroom:${chatroomId}:messages`,
        JSON.stringify(messageData)
      );
      await redisClient.lTrim(`chatroom:${chatroomId}:messages`, 0, 49);

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  },

  async handlePrivateMessage(socket, io, data) {
    try {
      const { receiverId, content } = data;
      const pool = require('../../config/database');

      // Save message to database
      const result = await pool.query(
        `INSERT INTO private_messages (sender_id, receiver_id, content) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [socket.user.id, receiverId, content]
      );

      const message = result.rows[0];

      // Send to receiver if online
      const receiverSocketId = await redisClient.get(`socket:${receiverId}`);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_private_message', {
          ...message,
          sender_first_name: socket.user.first_name,
          sender_last_name: socket.user.last_name,
          sender_profile_picture: socket.user.profile_picture,
        });
      }

      // Confirm to sender
      socket.emit('message_sent', { 
        messageId: message.id,
        success: true,
      });

    } catch (error) {
      console.error('Send private message error:', error);
      socket.emit('error', { message: 'Error sending private message' });
    }
  },

  handleTyping(socket, data) {
    const { chatroomId, receiverId } = data;
    
    if (chatroomId) {
      socket.to(`chatroom:${chatroomId}`).emit('user_typing', {
        userId: socket.user.id,
        firstName: socket.user.first_name,
      });
    } else if (receiverId) {
      socket.to(`user:${receiverId}`).emit('user_typing', {
        userId: socket.user.id,
        firstName: socket.user.first_name,
      });
    }
  },

  handleStopTyping(socket, data) {
    const { chatroomId, receiverId } = data;
    
    if (chatroomId) {
      socket.to(`chatroom:${chatroomId}`).emit('user_stop_typing', {
        userId: socket.user.id,
      });
    } else if (receiverId) {
      socket.to(`user:${receiverId}`).emit('user_stop_typing', {
        userId: socket.user.id,
      });
    }
  },
};

module.exports = chatHandler;