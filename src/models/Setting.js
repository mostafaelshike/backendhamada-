const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'سوق طبي - Medical Market'
    },
    storeDescription: {
      type: String,
      default: 'المنصة الرائدة لتوريد الأجهزة والمستلزمات الطبية المعتمدة'
    },
    email: {
      type: String,
      default: 'support@medicalmarket.com'
    },
    phone: {
      type: String,
      default: '+966 50 123 4567'
    },
    address: {
      type: String,
      default: 'طريق الملك فهد، الرياض، المملكة العربية السعودية'
    },
    currency: {
      type: String,
      default: 'ر.س'
    },
    currencyCode: {
      type: String,
      default: 'SAR'
    },
    taxRate: {
      type: Number,
      default: 15
    },
    shippingFee: {
      type: Number,
      default: 35
    },
    freeShippingThreshold: {
      type: Number,
      default: 500
    },
    socialLinks: {
      facebook: { type: String, default: 'https://facebook.com' },
      twitter: { type: String, default: 'https://twitter.com' },
      instagram: { type: String, default: 'https://instagram.com' },
      linkedin: { type: String, default: 'https://linkedin.com' },
      whatsapp: { type: String, default: '+966501234567' }
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Setting', settingSchema);
