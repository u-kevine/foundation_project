const User = require('../models/User');
const bcrypt = require('bcrypt');

const userController = {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching profile',
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const { first_name, last_name, profile_picture } = req.body;
      
      const user = await User.update(req.user.id, {
        first_name,
        last_name,
        profile_picture,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      delete user.password_hash;

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
      });
    }
  },

  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      const user = await User.findById(req.user.id);
      const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      const hashedPassword = await bcrypt.hash(new_password, 12);
      await User.updatePassword(req.user.id, hashedPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password',
      });
    }
  },

  async deleteAccount(req, res) {
    try {
      await User.delete(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting account',
      });
    }
  },

  async getAllUsers(req, res) {
    try {
      const { role, is_verified } = req.query;
      
      const users = await User.getAll({ role, is_verified });

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
      });
    }
  },
};

module.exports = userController;