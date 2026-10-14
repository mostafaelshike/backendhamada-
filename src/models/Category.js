const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يرجى إدخال اسم القسم'],
      trim: true,
      unique: true
    },
    nameEn: {
      type: String,
      trim: true,
      default: ''
    },
    code: {
      type: String,
      trim: true,
      default: ''
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    imagePublicId: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'bi-heart-pulse'
    },
    active: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    productCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Auto slug generation if not provided
categorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\u0621-\u064A\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
