const express = require('express');
const router = express.Router();
const { uploadImage, uploadMultipleImages, deleteImage } = require('../controllers/uploadController');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/', protect, uploadSingle, uploadImage);
router.post('/multiple', protect, uploadMultiple, uploadMultipleImages);
router.delete('/:publicId', protect, deleteImage);

module.exports = router;
