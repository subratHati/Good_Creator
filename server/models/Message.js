const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['brand', 'creator'], required: true },

  // unique human-readable reference for a paid collaboration, generated
  // once payment is verified. Present on: the payment_request message
  // itself (the canonical record), the payment_confirmed message (so
  // it can be displayed right after payment), and later, on delivery
  // messages (to record which collab that delivery is fulfilling).
  // Top-level rather than nested in paymentRequest, since it's needed
  // across multiple message types, not just payment_request ones.
  collabId: {
    type: String,
    default: null,
  },

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
    // tracks whether this specific paid collab has already had a
    // delivery submitted for it, and what state that's in — this is
    // what releasePayment will use to find the EXACT right payment
    // request instead of guessing via findOne()
    deliveryStatus: {
      type: String,
      enum: ['awaiting_delivery', 'pending_review', 'approved'],
      default: 'awaiting_delivery',
    },
  },

  // for delivery messages
  delivery: {
    // the 4 possible mediums a creator can share content through —
    // at least one must be filled, but multiple can be filled at once
    // (e.g. posted on Instagram AND also sent via WhatsApp)
    instagramLink: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    otherMedium: { type: String, default: '' },
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
// unique only for payment_request-type messages, which is where each
// collabId is originally assigned — payment_confirmed/delivery messages
// that reference the SAME collabId later are intentionally excluded from
// this uniqueness check via the partial filter, since they're expected
// to share an existing ID, not create a new one
messageSchema.index(
  { collabId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { type: 'payment_request' } }
);

module.exports = mongoose.model('Message', messageSchema);
