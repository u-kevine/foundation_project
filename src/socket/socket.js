const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const redisClient = require('../config/redis');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const result = await pool.query(
        'SELECT id, email, role, first_name, last_name FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = result.rows[0];
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} - ${socket.user.first_name}`);

    // Store user socket mapping in Redis
    redisClient.set(`socket:${socket.user.id}`, socket.id);

    // Join user's personal room
    socket.join(`user:${socket.user.id}`);

    // Handle joining chat rooms
    socket.on('join_chatroom', async (data) => {
      try {
        const { chatroomId } = data;

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
      } catch (error) {
        console.error('Join chatroom error:', error);
        socket.emit('error', { message: 'Error joining chat room' });
      }
    });

    // Handle leaving chat rooms
    socket.on('leave_chatroom', (data) => {
      const { chatroomId } = data;
      socket.leave(`chatroom:${chatroomId}`);
      
      socket.to(`chatroom:${chatroomId}`).emit('user_left', {
        userId: socket.user.id,
        firstName: socket.user.first_name,
        lastName: socket.user.last_name,
      });
    });

    // Handle chat room messages
    socket.on('send_message', async (data) => {
      try {
        const { chatroomId, content } = data;

        // Save message to database
        const result = await pool.query(
          `INSERT INTO messages (chat_room_id, user_id, content) 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [chatroomId, socket.user.id, content]
        );

        const message = result.rows[0];

        // Broadcast message to chat room
        io.to(`chatroom:${chatroomId}`).emit('new_message', {
          ...message,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name,
        });

        // Cache recent messages in Redis
        await redisClient.lPush(
          `chatroom:${chatroomId}:messages`,
          JSON.stringify(message)
        );
        await redisClient.lTrim(`chatroom:${chatroomId}:messages`, 0, 49);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle private messages
    socket.on('send_private_message', async (data) => {
      try {
        const { receiverId, content } = data;

        // Save message to database
        const result = await pool.query(
          `INSERT INTO private_messages (sender_id, receiver_id, content) 
           VALUES ($1, $2, $