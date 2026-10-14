const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      populate: { path: 'category brand', select: 'name slug logo' }
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      data: wishlist.products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle item in wishlist (add if not exists, remove if exists)
// @route   POST /api/wishlist/toggle
// @access  Private
exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.indexOf(productId);
    let isAdded = false;

    if (index > -1) {
      wishlist.products.splice(index, 1);
      isAdded = false;
    } else {
      wishlist.products.push(productId);
      isAdded = true;
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: isAdded ? 'تمت إضافة المنتج إلى المفضلة' : 'تمت إزالة المنتج من المفضلة',
      isAdded,
      data: wishlist.products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (id) => id.toString() !== productId.toString()
      );
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'تمت إزالة المنتج من المفضلة',
      data: wishlist ? wishlist.products : []
    });
  } catch (error) {
    next(error);
  }
};
