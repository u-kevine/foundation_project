const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const appointmentController = require('../controllers/appointment.controller');

router.post('/', authMiddleware, appointmentController.createAppointment);
router.get('/user', authMiddleware, appointmentController.getUserAppointments);
router.get('/therapist', authMiddleware, appointmentController.getTherapistAppointments);
router.put('/:id/status', authMiddleware, appointmentController.updateAppointmentStatus);
router.delete('/:id', authMiddleware, appointmentController.deleteAppointment);

module.exports = router;