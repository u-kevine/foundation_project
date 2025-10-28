# foundation_project
# MindConnect Backend

Mental health platform backend built with Node.js, Express, PostgreSQL, Redis, and Socket.IO.

## Features

-  JWT-based authentication
-  Real-time chat with Socket.IO
-  AI-powered therapy assistant (OpenAI integration)
-  Appointment scheduling system
-  Peer support chat rooms
-  HIPAA-compliant security measures
-  Email notifications
-  Crisis detection and intervention

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Security**: Helmet, bcrypt

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mindconnect-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create PostgreSQL database:
```bash
createdb mindconnect
```

5. Run database migrations:
```sql
psql -d mindconnect -f database/schema.sql
```

6. Start Redis:
```bash
redis-server
```

## Running the Application

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Therapists
- `POST /api/therapists/register` - Register as therapist
- `GET /api/therapists` - Get all therapists
- `GET /api/therapists/:id` - Get therapist by ID
- `PUT /api/therapists/profile` - Update therapist profile

### Chat Rooms
- `POST /api/chatrooms` - Create chat room
- `GET /api/chatrooms` - Get all chat rooms
- `GET /api/chatrooms/:id` - Get chat room by ID
- `POST /api/chatrooms/:id/join` - Join chat room
- `POST /api/chatrooms/:id/leave` - Leave chat room
- `GET /api/chatrooms/:id/messages` - Get chat room messages

### Messages
- `POST /api/messages/private` - Send private message
- `GET /api/messages/private` - Get private messages
- `GET /api/messages/conversations` - Get all conversations

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/user` - Get user appointments
- `GET /api/appointments/therapist` - Get therapist appointments
- `PUT /api/appointments/:id/status` - Update appointment status
- `DELETE /api/appointments/:id` - Cancel appointment

### AI Assistant
- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/conversations` - Get all AI conversations
- `GET /api/ai/conversations/:id` - Get conversation history

## Socket.IO Events

### Client → Server
- `join_chatroom` - Join a chat room
- `leave_chatroom` - Leave a chat room
- `send_message` - Send message to chat room
- `send_private_message` - Send private message
- `typing` - User is typing
- `stop_typing` - User stopped typing

### Server → Client
- `new_message` - New chat room message
- `new_private_message` - New private message
- `user_joined` - User joined chat room
- `user_left` - User left chat room
- `user_typing` - User is typing
- `user_stop_typing` - User stopped typing
- `appointment_reminder` - Appointment reminder
- `error` - Error message

## Database Schema

See `database/schema.sql` for complete database structure.

### Main Tables:
- `users` - User accounts
- `therapists` - Therapist profiles
- `chat_rooms` - Chat rooms
- `messages` - Chat room messages
- `private_messages` - Private messages
- `appointments` - Appointments
- `ai_conversations` - AI chat history
- `chat_room_members` - Chat room memberships

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- HTTP security headers (Helmet)
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- Rate limiting ready
- Encrypted data storage

## Error Handling

All errors are logged using Winston and returned in a consistent format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Optional validation errors
}
```

## Testing

```bash
npm test
```

## Deployment

### Environment Variables for Production:
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Configure production database credentials
- Set up SSL/TLS for database connections
- Configure email and SMS services
- Set proper CORS origins

### Recommended Hosting:
- **Backend**: AWS EC2, DigitalOcean, Heroku
- **Database**: AWS RDS, DigitalOcean Managed Database
- **Redis**: AWS ElastiCache, Redis Cloud

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@mindconnect.com or join our community chat.

## Team

- Backend & Database: Uche Ezette
- Database Architecture: Ingabire Blessing
- Backend Development: Diakite Muheto Mohamed K.

---

**MindConnect** - Bridging the mental health treatment gap through technology