const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(emergencyController.getEmergencyProfile).put(emergencyController.updateEmergencyProfile);
router.get('/qr', emergencyController.getEmergencyQR);

module.exports = router;
