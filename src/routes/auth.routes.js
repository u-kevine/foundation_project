const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const { validate, validators } = require('../middleware/validator');

router.post('/register', validate(validators.register), authController.register);
router.post('/login', validate(validators.login), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;