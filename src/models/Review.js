const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userAvatar: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      required: [true, 'يرجى تحديد التقييم بين 1 و 5'],
      min: 1,
      max: 5
    },
    title: {
      type: String,
      default: ''
    },
    comment: {
      type: String,
      required: [true, 'يرجى كتابة نص التقييم'],
      trim: true
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate reviews by same user for same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
