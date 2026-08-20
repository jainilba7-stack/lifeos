const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);

router
  .route('/')
  .put(upload.single('profileImage'), profileController.updateProfile)
  .delete(profileController.deleteAccount);

router.put('/change-password', profileController.changePassword);

module.exports = router;
