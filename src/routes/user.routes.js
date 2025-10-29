const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user.controller');
const { validate, validationRules } = require('../utils/validation');
const { body } = require('express-validator');

// Get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update user profile
router.put('/profile', 
  authMiddleware,
  validate([
    body('first_name').optional().trim().isLength({ min: 2, max: 100 }),
    body('last_name').optional().trim().isLength({ min: 2, max: 100 }),
    body('profile_picture').optional().isURL(),
  ]),
  userController.updateProfile
);

// Change password
router.put('/change-password',
  authMiddleware,
  validate([
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ]),
  userController.changePassword
);

// Delete account
router.delete('/account', authMiddleware, userController.deleteAccount);

// Get all users (admin only)
router.get('/', authMiddleware, userController.getAllUsers);

module.exports = router