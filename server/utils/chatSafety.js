// utils/chatSafety.js
//
// Two jobs, both about keeping chat safe:
//   1. loadConversationForUser  - only the brand or creator who is IN a
//      conversation may read it or write to it.
//   2. buildMessageContent      - the server decides what a message may
//      contain. The browser can only ask for a plain text message, or (for
//      creators) a payment request / delivery; anything about payment status,
//      Razorpay ids, approvals etc. is always set by the server, never copied
//      from the request.

const Conversation = require('../models/Conversation');
const Brand = require('../models/Brand');
const { isBrandVerified, effectiveStatus, NOT_VERIFIED_CODE, NOT_VERIFIED_MESSAGE } = require('./brandVerification');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const MAX_TEXT = 5000;
const MAX_FIELD = 500;
const MAX_NOTE = 1000;
const MAX_PAYMENT_RUPEES = 1000000; // Rs 10 lakh per payment request - change if you need more
const PAYMENT_REQUEST_MINUTES = 10; // a payment request can only be paid for this long, then the creator must send a new one

// 404 (not 403) on purpose, so nobody can probe which conversation ids exist
const NOT_FOUND = { error: { status: 404, message: 'Conversation not found' } };

// Pass { allowUnverifiedBrand: true } only for things that must keep working for
// a brand an admin has since un-verified (finishing a collab that was already
// paid for: release, reject, review). Everything else - reading or sending
// messages, opening live chat, starting a payment - needs a verified brand.
const loadConversationForUser = async (conversationId, user, { allowUnverifiedBrand = false } = {}) => {
  const id = String(conversationId || '');
  if (!OBJECT_ID.test(id)) return NOT_FOUND;

  const conversation = await Conversation.findById(id);
  if (!conversation) return NOT_FOUND;

  const userId = String(user._id || user.id);
  let role = null;
  if (String(conversation.brandUserId) === userId) role = 'brand';
  else if (String(conversation.creatorUserId) === userId) role = 'creator';
  if (!role) return NOT_FOUND;

  // the BRAND in a chat must be verified. (A creator keeps access to the chat
  // so they can still hand in work that was already paid for; sendMessage stops
  // them from starting anything new with an unverified brand.)
  const brand = await Brand.findById(conversation.brandId).select('verification');
  const brandVerified = isBrandVerified(brand);
  if (role === 'brand' && !brandVerified && !allowUnverifiedBrand) {
    return {
      error: {
        status: 403,
        code: NOT_VERIFIED_CODE,
        message: NOT_VERIFIED_MESSAGE,
        verificationStatus: effectiveStatus(brand),
      },
    };
  }

  return { conversation, role, brandVerified };
};

// the reply body for an { error } returned by loadConversationForUser
const accessErrorBody = (error) => ({
  message: error.message,
  ...(error.code ? { code: error.code, verificationStatus: error.verificationStatus } : {}),
});

const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const count = (value) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 0;
};

// returns { error } or the cleaned pieces: { text, paymentRequest, delivery, collabId }
const buildMessageContent = (type, body, role) => {
  if (type === 'text') {
    const text = str(body.text, MAX_TEXT);
    if (!text) return { error: 'Message cannot be empty' };
    return { text };
  }

  if (type === 'payment_request') {
    if (role !== 'creator') return { error: 'Only creators can send payment requests' };

    const pr = body.paymentRequest && typeof body.paymentRequest === 'object' ? body.paymentRequest : {};
    const amount = Math.round(Number(pr.amount));
    if (!Number.isFinite(amount) || amount < 1 || amount > MAX_PAYMENT_RUPEES) {
      return { error: `Enter an amount between 1 and ${MAX_PAYMENT_RUPEES.toLocaleString('en-IN')} rupees` };
    }

    const d = pr.deliverables && typeof pr.deliverables === 'object' ? pr.deliverables : {};
    const deadline = pr.deadline ? new Date(pr.deadline) : null;

    return {
      text: '',
      paymentRequest: {
        amount,
        deliverables: { reels: count(d.reels), posts: count(d.posts), stories: count(d.stories), ugc: count(d.ugc) },
        deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
        agreedToTerms: pr.agreedToTerms === true,
        status: 'pending', // always starts pending - only a verified payment can change it
        expiresAt: new Date(Date.now() + PAYMENT_REQUEST_MINUTES * 60 * 1000),
      },
    };
  }

  if (type === 'delivery') {
    if (role !== 'creator') return { error: 'Only creators can submit a delivery' };
    if (typeof body.collabId !== 'string' || !body.collabId.trim()) {
      return { error: 'Please select which collab this delivery is for' };
    }

    const d = body.delivery && typeof body.delivery === 'object' ? body.delivery : {};
    return {
      text: '',
      collabId: body.collabId.trim().slice(0, 50),
      delivery: {
        instagramLink: str(d.instagramLink, MAX_FIELD),
        whatsappNumber: str(d.whatsappNumber, MAX_FIELD),
        email: str(d.email, MAX_FIELD),
        otherMedium: str(d.otherMedium, MAX_FIELD),
        note: str(d.note, MAX_NOTE),
        status: 'pending', // approval is done by the brand through its own endpoint
      },
    };
  }

  return { error: 'Unsupported message type' };
};

// when a payment request stops being payable (older requests without a saved
// time count from the moment they were sent)
const paymentRequestExpiry = (message) => {
  const saved = message.paymentRequest && message.paymentRequest.expiresAt;
  if (saved) return new Date(saved);
  return new Date(new Date(message.createdAt).getTime() + PAYMENT_REQUEST_MINUTES * 60 * 1000);
};

module.exports = { loadConversationForUser, accessErrorBody, buildMessageContent, paymentRequestExpiry, PAYMENT_REQUEST_MINUTES };