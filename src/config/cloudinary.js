const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Folder in cloudinary e.g. 'medical_market/products'
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadBufferToCloudinary = (buffer, folder = 'medical_market') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete image from Cloudinary by public_id
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary
};
