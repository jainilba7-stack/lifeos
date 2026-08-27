//const express = require('express');
//const router = express.Router();
//const documentController = require('../controllers/documentController');
//const { protect } = require('../middleware/authMiddleware');
//const { upload } = require('../middleware/uploadMiddleware');

//router.use(protect);

//router
// .route('/')
//.get(documentController.getDocuments)
//.post(upload.single('file'), documentController.uploadDocument);

//router.delete('/:id', documentController.deleteDocument);

//module.exports = router;
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { upload, processFileUpload } = require('../middleware/uploadMiddleware');

router.use(protect);

router
  .route('/')
  .get(documentController.getDocuments)
  .post(
    upload.single('file'),
    async (req, res, next) => {
      try {
        if (req.file) {
          const hostUrl = `${req.protocol}://${req.get('host')}`;
          const uploadedFile = await processFileUpload(req.file, hostUrl);
          req.body.fileUrl = uploadedFile.url;
        }
        next();
      } catch (err) {
        next(err);
      }
    },
    documentController.uploadDocument
  );

router.delete('/:id', documentController.deleteDocument);

module.exports = router;