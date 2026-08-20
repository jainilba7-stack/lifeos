const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(medicineController.getMedicines).post(medicineController.createMedicine);
router.route('/:id').put(medicineController.updateMedicine).delete(medicineController.deleteMedicine);
router.post('/:id/log', medicineController.logMedicineStatus);

module.exports = router;
