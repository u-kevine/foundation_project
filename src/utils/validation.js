const { body, param, query, validationResult } = require('express-validator');

const validationRules = {
  // Authentication validations
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('first_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('First name must be between 2-100 characters'),
    body('last_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Last name must be between 2-100 characters'),
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  // Therapist validations
  therapistRegister: [
    body('license_number')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('License number is required'),
    body('specialization')
      .isArray({ min: 1 })
      .withMessage('At least one specialization is required'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Bio must be less than 1000 characters'),
    body('years_experience')
      .isInt({ min: 0, max: 70 })
      .withMessage('Years of experience must be between 0-70'),
  ],

  // Chat room validations
  createChatRoom: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Chat room name must be between 3-100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('topic')
      .trim()
      .notEmpty()
      .withMessage('Topic is required'),
  ],

  // Message validations
  sendMessage: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1-2000 characters'),
  ],

  // Appointment validations
  createAppointment: [
    body('therapist_id')
      .isInt({ min: 1 })
      .withMessage('Valid therapist ID is required'),
    body('appointment_date')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 180 })
      .withMessage('Duration must be between 15-180 minutes'),
  ],

  // AI chat validations
  aiChat: [
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1-1000 characters'),
    body('conversationId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid conversation ID'),
  ],

  // Parameter validations
  idParam: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid ID is required'),
  ],

  // Query validations
  pagination: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1-100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be non-negative'),
  ],
};

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  };
};

module.exports = { validationRules, validate };

// ==================== src/utils/helpers.js ====================
const crypto = require('crypto');

const helpers = {
  // Generate random code
  generateCode(length = 6) {
    return crypto.randomInt(100000, 999999).toString();
  },

  // Generate random token
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  },

  // Paginate results
  paginate(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return { limit, offset };
  },

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Sanitize user input
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  },

  // Calculate age from date of birth
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Check if date is in the past
  isDatePast(date) {
    return new Date(date) < new Date();
  },

  // Check if date is in the future
  isDateFuture(date) {
    return new Date(date) > new Date();
  },

  // Format error response
  formatError(error) {
    return {
      success: false,
      message: error.message || 'An error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };
  },

  // Format success response
  formatSuccess(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
    };
  },

  // Mask sensitive data
  maskEmail(email) {
    const [username, domain] = email.split('@');
    const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  },

  maskPhone(phone) {
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  },

  // Generate slug
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Validate phone number
  isValidPhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  },

  // Generate appointment time slots
  generateTimeSlots(startTime, endTime, duration = 60) {
    const slots = [];
    let current = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);

    while (current < end) {
      slots.push(current.toTimeString().substring(0, 5));
      current.setMinutes(current.getMinutes() + duration);
    }

    return slots;
  },

  // Calculate response time
  calculateResponseTime(startTime) {
    return Date.now() - startTime;
  },

  // Deep clone object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Remove undefined values from object
  removeUndefined(obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
  },
};

module.exports = helpers;