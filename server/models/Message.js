const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['brand', 'creator'], required: true },

  // message types
  type: {
    type: String,
    enum: ['text', 'enquiry', 'payment_request', 'payment_confirmed', 'delivery', 'payment_released'],
    default: 'text',
  },

  // for text messages
  text: { type: String, default: '' },

  // for enquiry messages
  enquiry: {
    openingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opening' },
    openingTitle: String,
    message: String,
  },

  // for payment request messages
  paymentRequest: {
    amount: Number,
    description: String,
    contentType: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt: Date,
  },

  // for delivery messages
  delivery: {
    contentLink: String,
    note: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'revision_requested'],
      default: 'pending',
    },
    approvedAt: Date,
  },

  seen: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
