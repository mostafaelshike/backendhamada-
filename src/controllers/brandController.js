const Brand = require('../models/Brand');
const Product = require('../models/Product');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res, next) => {
  try {
    const features = new APIFeatures(Brand.find(), req.query)
      .search(['name', 'nameAr', 'code', 'country', 'description'])
      .filter()
      .sort()
      .paginate();

    const brands = await features.query;
    const countFeatures = new APIFeatures(Brand.find(), req.query)
      .search(['name', 'nameAr', 'code', 'country', 'description'])
      .filter();
    const total = await countFeatures.query.countDocuments();
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      success: true,
      count: brands.length,
      total,
      totalProducts,
      data: brands
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
exports.getBrand = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const brand = isObjectId
      ? await Brand.findById(req.params.id)
      : await Brand.findOne({ slug: req.params.id });

    if (!brand) {
      return res.status(404).json({ success: false, message: 'العلامة التجارية غير موجودة' });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private/Admin
exports.createBrand = async (req, res, next) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({
      success: true,
      message: 'تم إضافة العلامة التجارية بنجاح',
      data: brand
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
exports.updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!brand) {
      return res.status(404).json({ success: false, message: 'العلامة التجارية غير موجودة' });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات العلامة التجارية بنجاح',
      data: brand
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
exports.deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'العلامة التجارية غير موجودة' });
    }

    const productsCount = await Product.countDocuments({ brand: brand._id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن حذف هذه العلامة التجارية لأنها مرتبطة بـ ${productsCount} منتج`
      });
    }

    await Brand.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'تم حذف العلامة التجارية بنجاح'
    });
  } catch (error) {
    next(error);
  }
};
