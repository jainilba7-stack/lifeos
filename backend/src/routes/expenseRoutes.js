const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(expenseController.getExpenses).post(expenseController.createExpense);
router.post('/budget', expenseController.setBudget);
router.route('/:id').put(expenseController.updateExpense).delete(expenseController.deleteExpense);

module.exports = router;
