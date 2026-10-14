const Category = require('../models/Category');
const Product = require('../models/Product');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const features = new APIFeatures(Category.find(), req.query)
      .search(['name', 'nameEn', 'code', 'description'])
      .filter()
      .sort()
      .paginate();

    const categories = await features.query;
    const countFeatures = new APIFeatures(Category.find(), req.query)
      .search(['name', 'nameEn', 'code', 'description'])
      .filter();
    const total = await countFeatures.query.countDocuments();
    const activeTotal = await Category.countDocuments({ active: true });
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      activeTotal,
      totalProducts,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by id or slug
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const category = isObjectId
      ? await Category.findById(req.params.id)
      : await Category.findOne({ slug: req.params.id });

    if (!category) {
      return res.status(404).json({ success: false, message: 'القسم المطلوب غير موجود' });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء القسم بنجاح',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'القسم غير موجود' });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث القسم بنجاح',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'القسم غير موجود' });
    }

    // Check if any product belongs to this category
    const productsCount = await Product.countDocuments({ category: category._id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن حذف هذا القسم لأنه يحتوي على ${productsCount} منتج مرتبط به`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'تم حذف القسم بنجاح'
    });
  } catch (error) {
    next(error);
  }
};
