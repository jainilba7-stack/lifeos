const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(reminderController.getReminders).post(reminderController.createReminder);
router.route('/:id').put(reminderController.updateReminder).delete(reminderController.deleteReminder);

module.exports = router;
