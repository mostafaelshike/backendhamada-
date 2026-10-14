const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      hospitalOrClinic: { type: String, default: '' },
      city: { type: String, required: true },
      address: { type: String, required: true },
      postalCode: { type: String, default: '' },
      notes: { type: String, default: '' }
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: { type: String, required: true },
        image: { type: String, required: true },
        sku: { type: String, default: '' },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true }
      }
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    shippingFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery', 'credit_card', 'bank_transfer', 'mada', 'tabby'],
      default: 'cash_on_delivery'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    medicalVerificationStatus: {
      type: String,
      enum: ['verified', 'pending_check', 'not_required'],
      default: 'verified'
    },
    trackingNumber: {
      type: String,
      default: ''
    },
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String
  },
  {
    timestamps: true
  }
);

// Auto generate orderNumber if not provided
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const random = Math.floor(1000 + Math.random() * 9000);
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    this.orderNumber = `MED-${year}${month}-${random}`;
  }
  next();
});

// High-performance compound indexes for user and admin order searches
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

