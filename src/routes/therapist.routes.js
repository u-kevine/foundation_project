const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const therapistController = require('../controllers/therapist.controller');
const { validate, validationRules } = require('../utils/validation');

// Register as therapist
router.post('/register',
  authMiddleware,
  validate(validationRules.therapistRegister),
  therapistController.register
);

// Get all therapists
router.get('/', authMiddleware, therapistController.getAll);

// Get therapist by ID
router.get('/:id',
  authMiddleware,
  validate(validationRules.idParam),
  therapistController.getById
);

// Get my therapist profile
router.get('/profile/me',
  authMiddleware,
  roleCheck('therapist'),
  therapistController.getMyProfile
);

// Update therapist profile
router.put('/profile',
  authMiddleware,
  roleCheck('therapist'),
  validate(validationRules.therapistRegister),
  therapistController.updateProfile
);

// Verify therapist (admin only)
router.put('/:id/verify',
  authMiddleware,
  roleCheck('admin'),
  validate(validationRules.idParam),
  therapistController.verifyTherapist
);

module.exports = router;