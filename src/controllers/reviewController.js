const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      isApproved: true
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review for a product
// @route   POST /api/reviews/product/:productId
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment, title } = req.body;
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'لقد قمت بتقييم هذا المنتج مسبقاً' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      rating: Number(rating),
      title: title || '',
      comment
    });

    // Recalculate average rating of product
    const reviews = await Review.find({ product: productId, isApproved: true });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    product.rating = Math.round(avgRating * 10) / 10;
    product.reviewsCount = reviews.length;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة تقييمك بنجاح',
      data: review
    });
  } catch (error) {
    next(error);
  }
};
