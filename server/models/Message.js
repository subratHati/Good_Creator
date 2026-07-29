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
    deliverables: {
      reels: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
      stories: { type: Number, default: 0 },
      ugc: { type: Number, default: 0 },
    },
    deadline: Date,
    agreedToTerms: { type: Boolean, default: false },
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

  // tracks whether the admin has actually completed the manual bank
// transfer to the creator after delivery was approved. Separate from
// delivery.status since approval and payout are two different events —
// approval happens automatically when the brand clicks Approve, payout
// happens manually whenever the admin actually sends the money.
payoutStatus: {
    type: String,
    enum: ['not_applicable', 'pending', 'completed'],
    default: 'not_applicable',
},
payoutCompletedAt: {
    type: Date,
    default: null,
},

  seen: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
