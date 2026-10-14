const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يرجى إدخال اسم العلامة التجارية'],
      trim: true,
      unique: true
    },
    nameAr: {
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
    logo: {
      type: String,
      default: ''
    },
    logoPublicId: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: 'ألمانيا'
    },
    website: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
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

brandSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\u0621-\u064A\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
