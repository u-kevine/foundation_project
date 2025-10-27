const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const redisClient = require('../config/redis');

const authController = {
  async register(req, res) {
    const client = await pool.connect();
    try {
      const { email, password, first_name, last_name, role = 'user' } = req.body;

      await client.query('BEGIN');

      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const result = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, hashedPassword, first_name, last_name, role]
      );

      await client.query('COMMIT');

      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user, token },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user',
      });
    } finally {
      client.release();
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      await redisClient.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

      delete user.password_hash;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in',
      });
    }
  },

  async logout(req, res) {
    try {
      await redisClient.del(`refresh_token:${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging out',
      });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required',
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);

      if (storedToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      const result = await pool.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = result.rows[0];
      const newToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(200).json({
        success: true,
        data: { token: newToken },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
  },
};

module.exports = authController;