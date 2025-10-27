const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const therapistRoutes = require('./routes/therapist.routes');
const chatroomRoutes = require('./routes/chatroom.routes');
const messageRoutes = require('./routes/message.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running' 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/chatrooms', chatroomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;