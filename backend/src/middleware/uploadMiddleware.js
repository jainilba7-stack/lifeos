const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Ensure local upload directory exists if local storage fallback is used
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage engine for local fallback
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types: pdf, images, docx, txt
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName || mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png) and documents (pdf, doc, docx, txt) are allowed!'));
  }
};

const upload = multer({
  storage: localStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// Helper function to handle upload process & return URL
const processFileUpload = async (file, hostUrl) => {
  if (!file) return null;

  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'lifeos_vault',
        resource_type: 'auto'
      });
      // Delete temporary local file after Cloudinary upload
      fs.unlinkSync(file.path);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        size: file.size,
        mimeType: file.mimetype
      };
    } catch (err) {
      console.warn('[Upload] Cloudinary upload failed, falling back to local file URL:', err.message);
    }
  }

  // Local storage URL
  const relativePath = `/uploads/${file.filename}`;
  const fullUrl = `${hostUrl}${relativePath}`;
  return {
    url: fullUrl,
    publicId: file.filename,
    size: file.size,
    mimeType: file.mimetype
  };
};

module.exports = { upload, processFileUpload };
