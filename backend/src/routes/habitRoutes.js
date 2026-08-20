const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(habitController.getHabits).post(habitController.createHabit);
router.post('/:id/toggle', habitController.toggleHabitLog);
router.delete('/:id', habitController.deleteHabit);

module.exports = router;
