const mongoose = require('mongoose');

const eventStoreSchema = new mongoose.Schema(
  {
    aggregateId: {
      type: String,
      required: true,
      index: true,
    },
    aggregateType: {
      type: String,
      required: true,
      enum: ['Order', 'Product', 'Inventory', 'Payment', 'User'],
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      userId: String,
      ip: String,
      idempotencyKey: String,
      correlationId: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable events
  }
);

// Append-only compound index for linear event playback
eventStoreSchema.index({ aggregateId: 1, version: 1 }, { unique: true });
eventStoreSchema.index({ aggregateType: 1, createdAt: -1 });

module.exports = mongoose.model('EventStore', eventStoreSchema);
