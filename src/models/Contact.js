const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يرجى إدخال الاسم'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'يرجى إدخال البريد الإلكتروني'],
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    subject: {
      type: String,
      required: [true, 'يرجى إدخال الموضوع أو نوع الاستفسار'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'يرجى إدخال نص الرسالة'],
      trim: true
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied', 'archived'],
      default: 'unread'
    },
    reply: {
      type: String,
      default: ''
    },
    repliedAt: Date
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Contact', contactSchema);
