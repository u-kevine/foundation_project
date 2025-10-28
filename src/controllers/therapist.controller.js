const Therapist = require('../models/Therapist');
const User = require('../models/User');

const therapistController = {
  async register(req, res) {
    try {
      const { license_number, specialization, bio, years_experience, availability } = req.body;
      const userId = req.user.id;

      const existingTherapist = await Therapist.findByUserId(userId);
      if (existingTherapist) {
        return res.status(409).json({
          success: false,
          message: 'Therapist profile already exists',
        });
      }

      const existingLicense = await Therapist.findByLicenseNumber(license_number);
      if (existingLicense) {
        return res.status(409).json({
          success: false,
          message: 'License number already registered',
        });
      }

      const therapist = await Therapist.create({
        user_id: userId,
        license_number,
        specialization,
        bio,
        years_experience,
        availability,
      });

      await User.update(userId, { role: 'therapist' });

      res.status(201).json({
        success: true,
        message: 'Therapist profile created successfully. Pending verification.',
        data: therapist,
      });
    } catch (error) {
      console.error('Register therapist error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering therapist',
      });
    }
  },

  async getAll(req, res) {
    try {
      const { specialization, is_verified = true } = req.query;
      
      const therapists = await Therapist.getAll({ specialization, is_verified });

      res.status(200).json({
        success: true,
        data: therapists,
      });
    } catch (error) {
      console.error('Get therapists error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching therapists',
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const therapist = await Therapist.findById(id);

      if (!therapist) {
        return res.status(404).json({
          success: false,
          message: 'Therapist not found',
        });
      }

      res.status(200).json({
        success: true,
        data: therapist,
      });
    } catch (error) {
      console.error('Get therapist error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching therapist',
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const { specialization, bio, years_experience, availability } = req.body;
      
      const therapist = await Therapist.findByUserId(req.user.id);
      
      if (!therapist) {
        return res.status(404).json({
          success: false,
          message: 'Therapist profile not found',
        });
      }

      const updated = await Therapist.update(therapist.id, {
        specialization,
        bio,
        years_experience,
        availability,
      });

      res.status(200).json({
        success: true,
        message: 'Therapist profile updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Update therapist error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating therapist profile',
      });
    }
  },

  async verifyTherapist(req, res) {
    try {
      const { id } = req.params;
      
      const therapist = await Therapist.verify(id);

      if (!therapist) {
        return res.status(404).json({
          success: false,
          message: 'Therapist not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Therapist verified successfully',
        data: therapist,
      });
    } catch (error) {
      console.error('Verify therapist error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying therapist',
      });
    }
  },

  async getMyProfile(req, res) {
    try {
      const therapist = await Therapist.findByUserId(req.user.id);

      if (!therapist) {
        return res.status(404).json({
          success: false,
          message: 'Therapist profile not found',
        });
      }

      res.status(200).json({
        success: true,
        data: therapist,
      });
    } catch (error) {
      console.error('Get therapist profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching therapist profile',
      });
    }
  },
};

module.exports = therapistController;