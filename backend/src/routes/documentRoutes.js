const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);

router
  .route('/')
  .get(documentController.getDocuments)
  .post(upload.single('file'), documentController.uploadDocument);

router.delete('/:id', documentController.deleteDocument);

module.exports = router;
