require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'mindconnect',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    connectionString: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL) || 3600,
  },

  // JWT Configuration (Fallback)
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Auth0 Configuration
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGNING_ALG || 'RS256',
    managementClientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
    managementClientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
  },

  // Google Gemini AI Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 500,
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
  },

  // Socket.IO Configuration
  socketio: {
    corsOrigin: process.env.SOCKETIO_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    path: process.env.SOCKETIO_PATH || '/socket.io',
    pingTimeout: parseInt(process.env.SOCKETIO_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKETIO_PING_INTERVAL) || 25000,
  },

  // Twilio Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  },

  // Google Calendar API Configuration
  googleCalendar: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
    apiKey: process.env.GOOGLE_CALENDAR_API_KEY || '',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    serviceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@mindconnect.com',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ],
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // Crisis Keywords
  crisis: {
    keywords: [
      'suicide', 'kill myself', 'end my life', 'want to die',
      'hurt myself', 'self harm', 'overdose', 'no reason to live'
    ],
    hotline: process.env.CRISIS_HOTLINE_NUMBER || '988',
    textLine: process.env.CRISIS_TEXT_LINE || '741741',
    emergency: process.env.EMERGENCY_NUMBER || '911',
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-session-secret',
  },

  // Webhooks
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
  },

  // Cloudinary (Optional)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Stripe (Optional)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
};

// Validation function
const validateConfig = () => {
  const required = [];

  // Check critical configurations
  if (config.server.nodeEnv === 'production') {
    if (!config.gemini.apiKey) required.push('GEMINI_API_KEY');
    if (!config.database.password) required.push('DB_PASSWORD');
    if (config.jwt.secret.includes('change-this')) required.push('JWT_SECRET');
  }

  if (required.length > 0) {
    console.error('❌ Missing required environment variables:');
    required.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease check your .env file');
    if (config.server.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

validateConfig();

module.exports = config;