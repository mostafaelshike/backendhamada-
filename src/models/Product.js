const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يرجى إدخال اسم المنتج'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'يرجى إدخال كود الصنف SKU'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      default: ''
    },
    shortDescription: {
      type: String,
      default: ''
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'يرجى اختيار القسم']
    },
    categoryName: {
      type: String,
      default: ''
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'يرجى اختيار العلامة التجارية']
    },
    brandName: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'يرجى إدخال سعر المنتج'],
      min: [0, 'السعر لا يمكن أن يكون سالباً']
    },
    oldPrice: {
      type: Number,
      default: 0
    },
    costPrice: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 10,
      min: [0, 'المخزون لا يمكن أن يكون سالباً']
    },
    minStockAlert: {
      type: Number,
      default: 5
    },
    image: {
      type: String,
      required: [true, 'يرجى تزويد صورة للمنتج']
    },
    imagePublicId: {
      type: String,
      default: ''
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' }
      }
    ],
    badge: {
      type: String,
      default: ''
    },
    badgePrice: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    medicalCode: {
      type: String,
      default: ''
    },
    sfdaApproved: {
      type: Boolean,
      default: true
    },
    warranty: {
      type: String,
      default: 'ضمان سنتين شامل الوكيل'
    },
    originCountry: {
      type: String,
      default: 'ألمانيا'
    },
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true }
      }
    ],
    tags: [String]
  },
  {
    timestamps: true,
    optimisticConcurrency: true
  }
);

// Compound Indexes adhering strictly to ESR (Equality, Sort, Range)
productSchema.index({ category: 1, isActive: 1, createdAt: -1, price: 1 });
productSchema.index({ brand: 1, isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, price: 1, createdAt: -1 });
productSchema.index({ isActive: 1, rating: -1 });
productSchema.index({ stock: 1, minStockAlert: 1 });

// Full-text index for search
productSchema.index({ name: 'text', description: 'text', sku: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);

