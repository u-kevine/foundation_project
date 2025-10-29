const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const appointmentController = require('../controllers/appointment.controller');
const { validate, validationRules } = require('../utils/validation');
const { body } = require('express-validator');

// Create appointment
router.post('/',
  authMiddleware,
  validate(validationRules.createAppointment),
  appointmentController.createAppointment
);

// Get user's appointments
router.get('/user',
  authMiddleware,
  appointmentController.getUserAppointments
);

// Get therapist's appointments
router.get('/therapist',
  authMiddleware,
  roleCheck('therapist'),
  appointmentController.getTherapistAppointments
);

// Get appointment by ID
router.get('/:id',
  authMiddleware,
  validate(validationRules.idParam),
  async (req, res) => {
    try {
      const { id } = req.params;
      const Appointment = require('../models/Appointment');
      
      const appointment = await Appointment.findById(id);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error('Get appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching appointment',
      });
    }
  }
);

// Update appointment status
router.put('/:id/status',
  authMiddleware,
  validate([
    ...validationRules.idParam,
    body('status').isIn(['scheduled', 'completed', 'cancelled', 'no-show']),
  ]),
  appointmentController.updateAppointmentStatus
);

// Update appointment
router.put('/:id',
  authMiddleware,
  validate([
    ...validationRules.idParam,
    body('appointment_date').optional().isISO8601(),
    body('duration').optional().isInt({ min: 15, max: 180 }),
    body('notes').optional().trim(),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const Appointment = require('../models/Appointment');
      
      const appointment = await Appointment.update(id, req.body);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment,
      });
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating appointment',
      });
    }
  }
);

// Cancel/Delete appointment
router.delete('/:id',
  authMiddleware,
  validate(validationRules.idParam),
  appointmentController.deleteAppointment
);

module.exports = router;