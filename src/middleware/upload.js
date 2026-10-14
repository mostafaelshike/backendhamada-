const multer = require('multer');

// Configure memory storage for direct Cloudinary streaming
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('الملف المرفوع يجب أن يكون صورة بتنسيق (jpg, jpeg, png, webp, svg)'), false);
  }
};

// Multer upload instances
const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
}).single('image');

const uploadMultiple = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
}).array('images', 10);

module.exports = {
  uploadSingle,
  uploadMultiple
};
