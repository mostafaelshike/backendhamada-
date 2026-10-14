const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Upload single image to Cloudinary
// @route   POST /api/upload
// @access  Private
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار ملف صورة للرفع'
      });
    }

    const folder = req.body.folder || 'medical_market';

    try {
      const result = await uploadBufferToCloudinary(req.file.buffer, folder);
      return res.status(200).json({
        success: true,
        message: 'تم رفع الصورة بنجاح إلى Cloudinary',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height
        }
      });
    } catch (cloudErr) {
      console.error('Cloudinary image upload failed:', cloudErr.message);
      return res.status(502).json({
        success: false,
        message: 'تعذر رفع الصورة إلى خدمة التخزين. تحقق من إعدادات التخزين وحاول مجدداً.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple images to Cloudinary
// @route   POST /api/upload/multiple
// @access  Private
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار صور للرفع'
      });
    }

    const folder = req.body.folder || 'medical_market';
    let results;
    try {
      results = await Promise.all(
        req.files.map((file) => uploadBufferToCloudinary(file.buffer, folder))
      );
    } catch (uploadError) {
      console.error('Cloudinary multiple-image upload failed:', uploadError.message);
      return res.status(502).json({
        success: false,
        message: 'تعذر رفع الصور إلى خدمة التخزين. تحقق من إعدادات التخزين وحاول مجدداً.'
      });
    }

    const images = results.map((res) => ({
      url: res.secure_url,
      publicId: res.public_id
    }));

    res.status(200).json({
      success: true,
      message: `تم رفع ${images.length} صور بنجاح`,
      data: images
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private/Admin
exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    await deleteFromCloudinary(publicId);

    res.status(200).json({
      success: true,
      message: 'تم حذف الصورة'
    });
  } catch (error) {
    next(error);
  }
};
