const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(appointmentController.getAppointments).post(appointmentController.createAppointment);
router.route('/:id').put(appointmentController.updateAppointment).delete(appointmentController.deleteAppointment);

module.exports = router;
