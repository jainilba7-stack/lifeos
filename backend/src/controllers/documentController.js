const Document = require('../models/Document');
const ApiResponse = require('../utils/apiResponse');
const { processFileUpload } = require('../middleware/uploadMiddleware');

// @desc    Get user documents with filters & search
// @route   GET /api/documents
exports.getDocuments = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { user: req.user.id };

    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const documents = await Document.find(query).sort({ createdAt: -1 });

    // Check expiries
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const expiringSoon = documents.filter(
      (doc) => doc.expiryDate && new Date(doc.expiryDate) >= now && new Date(doc.expiryDate) <= thirtyDaysLater
    );

    return ApiResponse.success(res, 'Documents retrieved successfully', {
      documents,
      count: documents.length,
      expiringSoonCount: expiringSoon.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload new document
// @route   POST /api/documents
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'Please upload a file document', [], 400);
    }

    const hostUrl = `${req.protocol}://${req.get('host')}`;
    const uploadResult = await processFileUpload(req.file, hostUrl);

    const { name, category, expiryDate, description } = req.body;

    const doc = await Document.create({
      user: req.user.id,
      name: name || req.file.originalname,
      category: category || 'Other',
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      fileSize: uploadResult.size,
      fileType: uploadResult.mimeType,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      description
    });

    return ApiResponse.success(res, 'Document uploaded successfully to Document Vault', { document: doc }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!doc) {
      return ApiResponse.error(res, 'Document not found or unauthorized', [], 404);
    }
    return ApiResponse.success(res, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
};
