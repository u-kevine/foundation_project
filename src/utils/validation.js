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