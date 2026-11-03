const Razorpay = require('razorpay');
const crypto = require('crypto');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const Review = require('../models/Review');
const generateCollabId = require('../utils/generateCollabId');
const calculateQualityScore = require('../utils/calculateQualityScore');
const Collaboration = require('../models/Collaboration');
const { createNotification } = require('./notification.controller');
const { loadConversationForUser, paymentRequestExpiry } = require('../utils/chatSafety');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── helpers shared by the payment actions below ─────────────────────────────
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const isId = (value) => typeof value === 'string' && OBJECT_ID.test(value);

// Confirms the logged-in user is the BRAND inside this conversation. When they
// are not, it sends the error reply itself and returns null.
const requireBrandInConversation = async (req, res, conversationId) => {
  const access = await loadConversationForUser(conversationId, req.user);
  if (access.error) {
    res.status(access.error.status).json({ message: access.error.message });
    return null;
  }
  if (access.role !== 'brand') {
    res.status(403).json({ message: 'Only the brand in this conversation can do this' });
    return null;
  }
  return access.conversation;
};

// ─── POST /api/payment/create-order ──────────────────────────────────────────
// Brand calls this when they click "Pay Now" on a payment request message
const createOrder = async (req, res) => {
  const { messageId, conversationId } = req.body;

  try {
    if (!isId(messageId)) return res.status(400).json({ message: 'Invalid payment request' });

    const conversation = await requireBrandInConversation(req, res, conversationId);
    if (!conversation) return;

    // the payment request must live inside THIS conversation
    const message = await Message.findOne({ _id: messageId, conversationId: conversation._id });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.type !== 'payment_request') return res.status(400).json({ message: 'Not a payment request' });
    if (message.paymentRequest.status !== 'pending') return res.status(400).json({ message: 'Payment already processed' });

    // a payment request can only be paid for a short time - after that the creator must send a new one
    if (paymentRequestExpiry(message) <= new Date()) {
      return res.status(410).json({ message: 'This payment request has expired. Please ask the creator to send a new one.', expired: true });
    }

    const amount = message.paymentRequest.amount;
    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ message: 'This payment request has an invalid amount' });
    }
    const platformFee = Math.round(amount * 0.15); // 15% platform fee
    const creatorAmount = amount - platformFee;

    // create Razorpay order - the notes tie this order to exactly this message,
    // and verifyPayment checks them again before accepting any payment
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay uses paise
      currency: 'INR',
      receipt: `order_${message._id}`,
      notes: {
        messageId: String(message._id),
        conversationId: String(conversation._id),
        creatorAmount: creatorAmount.toString(),
        platformFee: platformFee.toString(),
      },
    });

    console.log('[PAYMENT] Order created:', order.id, 'amount:', amount);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      messageId: String(message._id),
      conversationId: String(conversation._id),
      description: 'GoodCreator collab payment',
      creatorAmount,
      platformFee,
    });
  } catch (error) {
    console.error('[PAYMENT] createOrder error:', error.message);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// ─── shared: turn a real Razorpay payment into a paid collab ─────────────────
// Used by BOTH the brand's browser (verifyPayment) and Razorpay's own server
// call (razorpayWebhook), so the rules are identical and a payment still counts
// only once even if both arrive at the same moment.
// Asks Razorpay itself whether this order + payment belong to THIS payment
// request, for the right amount, and are actually paid.
// result: 'paid' (we just recorded it) | 'already' (this same payment was
// recorded before) | 'conflict' (a DIFFERENT payment already paid it) |
// 'closed' (request is cancelled etc.) | 'rejected' (Razorpay data doesn't match)
const settlePayment = async ({ paymentMsg, conversation, orderId, paymentId, io }) => {
  const pr = paymentMsg.paymentRequest;
  if (pr.status === 'paid') {
    return { result: pr.razorpayPaymentId === paymentId ? 'already' : 'conflict' };
  }
  if (pr.status !== 'pending') return { result: 'closed' };

  const [order, payment] = await Promise.all([
    razorpay.orders.fetch(orderId),
    razorpay.payments.fetch(paymentId),
  ]);
  const expectedPaise = Math.round(pr.amount * 100);
  const orderOk = !!order
    && !!order.notes
    && String(order.notes.messageId) === String(paymentMsg._id)
    && order.amount === expectedPaise
    && order.currency === 'INR';
  const paymentOk = !!payment
    && payment.order_id === orderId
    && payment.amount === expectedPaise
    && ['captured', 'authorized'].includes(payment.status);
  if (!orderOk || !paymentOk) {
    console.error('[PAYMENT] Razorpay data does not match this payment request', {
      messageId: String(paymentMsg._id), orderOk, paymentOk, paymentStatus: payment && payment.status,
    });
    return { result: 'rejected' };
  }

  // mark it paid - only ONE caller can win this switch from pending to paid
  const collabId = await generateCollabId();
  const claimed = await Message.findOneAndUpdate(
    { _id: paymentMsg._id, 'paymentRequest.status': 'pending' },
    {
      'paymentRequest.status': 'paid',
      'paymentRequest.razorpayOrderId': orderId,
      'paymentRequest.razorpayPaymentId': paymentId,
      'paymentRequest.paidAt': new Date(),
      'paymentRequest.deliveryStatus': 'awaiting_delivery',
      collabId,
    }
  );
  if (!claimed) {
    // someone else switched it a moment ago - was it this very payment?
    const fresh = await Message.findById(paymentMsg._id);
    const same = !!fresh && fresh.paymentRequest.status === 'paid' && fresh.paymentRequest.razorpayPaymentId === paymentId;
    return { result: same ? 'already' : 'conflict' };
  }
  console.log('[PAYMENT] Verified with Razorpay:', paymentId, 'for message', String(paymentMsg._id));

  // create the durable Collaboration record - only now that payment is real
  await Collaboration.create({
    collabId,
    creatorId: conversation.creatorId,
    brandId: conversation.brandId,
    conversationId: conversation._id,
    amount: pr.amount,
    deliverables: pr.deliverables,
    deadline: pr.deadline,
    status: 'pending',
    paidAt: new Date(),
  });

  // send payment confirmed message in chat (amount comes from our own record)
  const paymentMessage = await Message.create({
    conversationId: conversation._id,
    senderId: conversation.brandUserId,
    senderRole: 'brand',
    type: 'payment_confirmed',
    text: `Payment of ₹${pr.amount.toLocaleString('en-IN')} received! Money is held securely. Complete the deliverable to release payment.`,
    collabId,
  });

  // update conversation
  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: '✅ Payment confirmed',
    lastMessageAt: new Date(),
    lastMessageBy: 'brand',
    unreadByCreator: (conversation.unreadByCreator || 0) + 1,
  });

  // emit via socket
  if (io) {
    io.to(`conversation_${conversation._id}`).emit('new_message', paymentMessage);
    io.to(`conversation_${conversation._id}`).emit('payment_confirmed', { messageId: String(paymentMsg._id) });
  }

  // notify the creator - payment received, collab now active
  if (conversation.creatorUserId) {
    createNotification({
      userId: conversation.creatorUserId,
      type: 'application',
      title: 'Payment received 💰',
      message: `A brand paid for your collab (${collabId}). Complete the deliverable to release payment.`,
      actionPath: `/messages/${conversation._id}`,
    });
  }

  return { result: 'paid', paymentMessage };
};

// ─── POST /api/payment/verify ────────────────────────────────────────────────
// Called by the brand's browser after Razorpay says the payment went through.
// The browser is never trusted: we check the signature, then ask Razorpay
// itself whether this order + payment really belong to THIS payment request,
// for the right amount, and are actually paid. A payment can only ever be
// used once.
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, messageId, conversationId } = req.body;

  try {
    const looksRight = [razorpay_order_id, razorpay_payment_id, razorpay_signature]
      .every((v) => typeof v === 'string' && v.length > 0 && v.length < 100);
    if (!looksRight || !isId(messageId)) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const conversation = await requireBrandInConversation(req, res, conversationId);
    if (!conversation) return;

    // 1. the signature must be genuine
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const expected = Buffer.from(expectedSignature);
    const given = Buffer.from(razorpay_signature);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
      console.error('[PAYMENT] Signature mismatch');
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // 2. the payment request must be in this conversation
    const paymentMsg = await Message.findOne({
      _id: messageId,
      conversationId: conversation._id,
      type: 'payment_request',
    });
    if (!paymentMsg) return res.status(404).json({ message: 'Payment request not found' });

    // 3. check with Razorpay and mark it paid (same code the webhook uses)
    const { result, paymentMessage } = await settlePayment({
      paymentMsg,
      conversation,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      io: req.app.get('io'),
    });

    if (result === 'paid') return res.json({ success: true, paymentMessage });
    // same payment sent twice (browser retry, or the webhook got there first) is fine
    if (result === 'already') return res.json({ success: true, alreadyProcessed: true });
    if (result === 'conflict') return res.status(409).json({ message: 'This payment request has already been paid' });
    if (result === 'closed') return res.status(400).json({ message: 'This payment request can no longer be paid' });
    return res.status(400).json({ message: 'Payment verification failed' });
  } catch (error) {
    console.error('[PAYMENT] verifyPayment error:', error.message);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// ─── POST /api/payment/webhook ───────────────────────────────────────────────
// Razorpay calls THIS directly (not the brand's browser) when a payment
// succeeds. It is what saves the day when the brand pays and then closes the
// tab / loses signal before the browser could tell us. Nobody is logged in
// here, so the ONLY proof is Razorpay's signature on the exact bytes it sent
// (made with the webhook secret that only we and Razorpay know).
// Reply codes matter: a 2xx tells Razorpay "done, stop"; a 5xx makes Razorpay
// try again later (for up to a day) - so we only answer 5xx when a retry can help.
const razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not set - cannot accept webhooks');
    return res.status(503).json({ message: 'Webhook not configured' });
  }

  const signature = req.get('x-razorpay-signature');
  const raw = req.rawBody;
  if (typeof signature !== 'string' || !signature || !Buffer.isBuffer(raw)) {
    return res.status(400).json({ message: 'Invalid webhook' });
  }
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(raw).digest('hex'));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    console.error('[WEBHOOK] Signature mismatch - ignored');
    return res.status(400).json({ message: 'Invalid webhook' });
  }

  // from here on the call is genuinely from Razorpay
  const body = req.body || {};
  if (body.event !== 'order.paid' && body.event !== 'payment.captured') {
    return res.json({ ignored: true });
  }
  const entity = body.payload && body.payload.payment && body.payload.payment.entity;
  const paymentId = entity && entity.id;
  const orderId = entity && entity.order_id;
  if (typeof paymentId !== 'string' || typeof orderId !== 'string') {
    return res.json({ ignored: true });
  }

  try {
    // our own orders carry the payment request id in their notes
    const order = await razorpay.orders.fetch(orderId);
    const messageId = order && order.notes && order.notes.messageId;
    if (!isId(messageId)) return res.json({ ignored: true }); // not a collab payment

    const paymentMsg = await Message.findOne({ _id: messageId, type: 'payment_request' });
    if (!paymentMsg || String(paymentMsg.conversationId) !== String(order.notes.conversationId)) {
      console.error('[WEBHOOK] No matching payment request for order', orderId);
      return res.json({ ignored: true });
    }
    const conversation = await Conversation.findById(paymentMsg.conversationId);
    if (!conversation) return res.json({ ignored: true });

    const { result } = await settlePayment({
      paymentMsg, conversation, orderId, paymentId, io: req.app.get('io'),
    });

    if (result === 'conflict') {
      // the brand paid TWICE for one request - the second payment needs a manual refund
      console.error('[WEBHOOK] NEEDS ATTENTION: extra payment', paymentId, 'for already-paid request', String(paymentMsg._id), '- refund it in Razorpay');
    } else if (result === 'rejected') {
      console.error('[WEBHOOK] NEEDS ATTENTION: payment', paymentId, 'did not match its payment request', String(paymentMsg._id));
    } else {
      console.log('[WEBHOOK]', body.event, paymentId, '->', result);
    }
    // 2xx for every outcome we have understood - retrying would not change it
    return res.json({ ok: true, result });
  } catch (error) {
    // Razorpay says the order/payment does not exist (a test-mode or foreign id): nothing to retry
    if (error && error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
      console.error('[WEBHOOK] Razorpay does not know', orderId, '- ignored');
      return res.json({ ignored: true });
    }
    console.error('[WEBHOOK] error:', error && (error.message || error.error?.description));
    return res.status(500).json({ message: 'Failed - please retry' }); // Razorpay will try again
  }
};

// ─── POST /api/payment/release ────────────────────────────────────────────────
// Called when brand approves delivery - marks payout as processing
const releasePayment = async (req, res) => {
  const { conversationId, deliveryMessageId } = req.body;

  try {
    if (!isId(deliveryMessageId)) return res.status(400).json({ message: 'Invalid delivery' });

    const conversation = await requireBrandInConversation(req, res, conversationId);
    if (!conversation) return;

    // the delivery must be a real delivery message inside THIS conversation
    const deliveryMsg = await Message.findOne({
      _id: deliveryMessageId,
      conversationId: conversation._id,
      type: 'delivery',
    });
    if (!deliveryMsg) {
      return res.status(404).json({ message: 'Delivery message not found' });
    }
    if (!deliveryMsg.collabId) {
      return res.status(400).json({ message: 'This delivery has no linked collab ID — cannot determine payout amount' });
    }
    if (!deliveryMsg.delivery || deliveryMsg.delivery.status !== 'pending') {
      return res.status(409).json({ message: 'This delivery was already approved or sent back for revision' });
    }

    // find the SPECIFIC paid payment request this delivery is fulfilling, and
    // switch it to approved in the same step - so a delivery can only ever be
    // released once, even if the button is pressed twice
    const paymentMsg = await Message.findOneAndUpdate(
      {
        conversationId: conversation._id,
        type: 'payment_request',
        collabId: deliveryMsg.collabId,
        'paymentRequest.status': 'paid',
        'paymentRequest.deliveryStatus': { $ne: 'approved' },
      },
      { 'paymentRequest.deliveryStatus': 'approved' }
    );
    if (!paymentMsg) {
      return res.status(404).json({ message: 'Could not find the payment request for this collab (it may already be released)' });
    }

    // update delivery status - payoutStatus starts as 'pending' the moment
    // delivery is approved, since that's the exact trigger for the admin's
    // 48-hour manual payout window
    await Message.findByIdAndUpdate(deliveryMsg._id, {
      'delivery.status': 'approved',
      'delivery.approvedAt': new Date(),
      payoutStatus: 'pending',
    });

    // move the Collaboration record itself to 'delivered'
    await Collaboration.findOneAndUpdate(
      { collabId: deliveryMsg.collabId },
      { status: 'delivered', deliveredAt: new Date() }
    );

    const amount = paymentMsg.paymentRequest?.amount || 0;
    const platformFee = Math.round(amount * 0.15);
    const creatorAmount = amount - platformFee;

    const creator = await Creator.findById(conversation.creatorId).select('name userId');

    // send payment released message
    const releaseMessage = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.id,
      senderRole: 'brand',
      type: 'payment_released',
      collabId: deliveryMsg.collabId,
      text: `🎉 Delivery approved! ₹${creatorAmount.toLocaleString('en-IN')} will be credited to ${creator?.name || 'creator'}'s bank account within 48 hours.`,
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: '🎉 Payment released',
      lastMessageAt: new Date(),
      lastMessageBy: 'brand',
      unreadByCreator: (conversation.unreadByCreator || 0) + 1,
    });

    // emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversation._id}`).emit('new_message', releaseMessage);
    }

    console.log('[PAYMENT] Payment release initiated for creator:', creator?.name, 'amount:', creatorAmount);
    // TODO: Integrate Razorpay Payouts API here when business account is ready
    // For now, admin manually processes the payout

    // notify the creator - delivery approved, payout on its way
    if (creator?.userId) {
      createNotification({
        userId: creator.userId,
        type: 'application',
        title: 'Delivery approved 🎉',
        message: `Your delivery was approved. ₹${creatorAmount.toLocaleString('en-IN')} will be credited within 48 hours.`,
        actionPath: `/messages/${conversation._id}`,
      });
    }

    res.json({ success: true, releaseMessage, creatorAmount, platformFee });
  } catch (error) {
    console.error('[PAYMENT] releasePayment error:', error.message);
    res.status(500).json({ message: 'Failed to release payment' });
  }
};

// ─── GET /api/payment/available-collabs/:conversationId ─────────────────────
// Returns paid collabs in this conversation that are awaiting delivery -
// i.e. NOT already submitted for review, and NOT already approved. This
// is exactly the dropdown list a creator should see when submitting a
// new delivery, per the state machine: a collabId becomes unavailable
// the moment a delivery is submitted for it (pending_review), and stays
// unavailable permanently once approved. If a delivery is rejected, the
// collab reverts to awaiting_delivery and becomes selectable again.
const getAvailableCollabs = async (req, res) => {
  try {
    const access = await loadConversationForUser(req.params.conversationId, req.user);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    if (access.role !== 'creator') {
      return res.status(403).json({ message: 'Only the creator in this conversation can do this' });
    }

    const collabs = await Message.find({
      conversationId: access.conversation._id,
      type: 'payment_request',
      'paymentRequest.status': 'paid',
      'paymentRequest.deliveryStatus': 'awaiting_delivery',
    })
      .select('collabId paymentRequest.amount paymentRequest.deliverables paymentRequest.deadline createdAt')
      .sort({ createdAt: -1 });

    res.json({ collabs });
  } catch (error) {
    console.error('getAvailableCollabs error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/payment/reject-delivery ───────────────────────────────────────
// Brand rejects a delivery submission (e.g. wrong content, doesn't match
// what was agreed). This reverts the collab back to 'awaiting_delivery',
// making it selectable again in the creator's delivery-submission dropdown.
const rejectDelivery = async (req, res) => {
  const { conversationId, deliveryMessageId } = req.body;
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';

  try {
    if (!isId(deliveryMessageId)) return res.status(400).json({ message: 'Invalid delivery' });

    const conversation = await requireBrandInConversation(req, res, conversationId);
    if (!conversation) return;

    // switch pending -> revision_requested in ONE step, so a double click (or two
    // tabs) can only ever send it back once
    const deliveryMsg = await Message.findOneAndUpdate(
      {
        _id: deliveryMessageId,
        conversationId: conversation._id,
        type: 'delivery',
        'delivery.status': 'pending',
      },
      { 'delivery.status': 'revision_requested' }
    );
    if (!deliveryMsg) {
      const exists = await Message.findOne({ _id: deliveryMessageId, conversationId: conversation._id, type: 'delivery' });
      if (!exists) return res.status(404).json({ message: 'Delivery message not found' });
      return res.status(409).json({ message: 'This delivery was already approved or sent back for revision' });
    }

    // revert the collab back to awaiting_delivery so it reappears in
    // the dropdown for a fresh delivery submission (never un-approve one
    // that was already released)
    if (deliveryMsg.collabId) {
      await Message.findOneAndUpdate(
        {
          conversationId: conversation._id,
          type: 'payment_request',
          collabId: deliveryMsg.collabId,
          'paymentRequest.status': 'paid',
          'paymentRequest.deliveryStatus': { $ne: 'approved' },
        },
        { 'paymentRequest.deliveryStatus': 'awaiting_delivery' }
      );
    }

    const releaseMessage = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.id,
      senderRole: 'brand',
      type: 'text',
      text: reason
        ? `Delivery needs revision: ${reason}`
        : 'Delivery needs revision. Please resubmit.',
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversation._id}`).emit('new_message', releaseMessage);
    }

    res.json({ success: true, releaseMessage });
  } catch (error) {
    console.error('rejectDelivery error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/payment/creator-bank ───────────────────────────────────────────
const getCreatorBankDetails = async (req, res) => {
  try {
    const creator = await Creator.findOne({ userId: req.user.id }).select('bankDetails');
    res.json({ bankDetails: creator?.bankDetails || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── PUT /api/payment/creator-bank ───────────────────────────────────────────
const saveCreatorBankDetails = async (req, res) => {
  const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

  if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
    return res.status(400).json({ message: 'All bank details are required' });
  }

  try {
    await Creator.findOneAndUpdate(
      { userId: req.user.id },
      { bankDetails: { accountHolderName, accountNumber, ifscCode, bankName, isVerified: false } }
    );
    res.json({ message: 'Bank details saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/payment/admin/overview ─────────────────────────────────────────
// Single endpoint computing everything the admin payment dashboard needs.
// Built around the fact that paymentRequest and delivery live on SEPARATE
// Message documents, correlated only by conversationId — there is no single
// document that says "this payment is paid AND delivered". So this function
// first finds all paid payment requests, then checks each one's conversation
// for an approved delivery, and buckets accordingly.
const getAdminPaymentOverview = async (req, res) => {
  try {
    // all paid payment requests — the base set everything else is derived from
    const paidRequests = await Message.find({
      type: 'payment_request',
      'paymentRequest.status': 'paid',
    }).select('conversationId senderId paymentRequest collabId createdAt');

    // fetch conversations up front so we have brandId/creatorId for every
    // paid request — needed to attach creator/brand names to all three
    // sections below, not just payoutQueue/completedPayouts
    const conversationIdsForLookup = paidRequests.map((r) => r.conversationId);
    const conversations = await Conversation.find({ _id: { $in: conversationIdsForLookup } })
      .select('creatorId brandId');
    const conversationById = {};
    conversations.forEach((c) => { conversationById[c._id.toString()] = c; });

    const conversationIds = paidRequests.map((r) => r.conversationId);

    // approved deliveries for those same conversations — one query instead
    // of one-per-conversation, then matched up in memory below
    const approvedDeliveries = await Message.find({
      type: 'delivery',
      'delivery.status': 'approved',
      conversationId: { $in: conversationIds },
    }).select('conversationId collabId delivery payoutStatus payoutCompletedAt createdAt');

    // keyed by collabId, not conversationId — a single conversation can have
    // several collabs over time (each with its own payment_request/delivery
    // pair), so matching by conversationId alone would incorrectly attach
    // one collab's approved delivery to a DIFFERENT collab in the same chat
    const deliveryByCollabId = {};
    approvedDeliveries.forEach((d) => {
      if (!d.collabId) return; // old deliveries predating collabId can't be safely matched
      if (!deliveryByCollabId[d.collabId] || d.createdAt > deliveryByCollabId[d.collabId].createdAt) {
        deliveryByCollabId[d.collabId] = d;
      }
    });

    const PLATFORM_FEE_RATE = 0.15;

    let totalCollected = 0;
    let commissionRealized = 0;
    let commissionUpcoming = 0;
    const activeCollaborations = []; // paid, no approved delivery yet
    const payoutQueue = []; // approved delivery, payout still pending
    const completedPayouts = []; // approved delivery, payout already completed

    for (const paymentReq of paidRequests) {
      const amount = paymentReq.paymentRequest?.amount || 0;
      const commission = Math.round(amount * PLATFORM_FEE_RATE);
      const creatorAmount = amount - commission;
      totalCollected += amount;

      const delivery = paymentReq.collabId ? deliveryByCollabId[paymentReq.collabId] : undefined;
      const conv = conversationById[paymentReq.conversationId.toString()];

      if (!delivery) {
        commissionUpcoming += commission;
        activeCollaborations.push({
          conversationId: paymentReq.conversationId,
          creatorUserId: paymentReq.senderId,
          creatorId: conv?.creatorId || null,
          brandId: conv?.brandId || null,
          amount,
          commission,
          creatorAmount,
          description: paymentReq.paymentRequest?.description || '',
          deadline: paymentReq.paymentRequest?.deadline || null,
          collabId: paymentReq.collabId || null,
          requestedAt: paymentReq.createdAt,
        });
        continue;
      }

      commissionRealized += commission;

      const entry = {
        conversationId: paymentReq.conversationId,
        creatorUserId: paymentReq.senderId,
        creatorId: conv?.creatorId || null,
        brandId: conv?.brandId || null,
        amount,
        commission,
        creatorAmount,
        description: paymentReq.paymentRequest?.description || '',
        deadline: paymentReq.paymentRequest?.deadline || null,
        collabId: paymentReq.collabId || null,
        approvedAt: delivery.delivery?.approvedAt || null,
        payoutCompletedAt: delivery.payoutCompletedAt || null,
        deliveryMessageId: delivery._id,
      };

      if (delivery.payoutStatus === 'completed') {
        completedPayouts.push(entry);
      } else {
        payoutQueue.push(entry);
      }
    }

    // attach creator name/handle AND brand name to all three sections —
    // the admin needs to know who's on both sides of every entry, not
    // just a raw ObjectId, in every bucket including activeCollaborations
    const allEntries = [...activeCollaborations, ...payoutQueue, ...completedPayouts];
    const allCreatorIds = [...new Set(allEntries.map((e) => e.creatorId?.toString()).filter(Boolean))];
    const allBrandIds = [...new Set(allEntries.map((e) => e.brandId?.toString()).filter(Boolean))];

    const [creators, brands] = await Promise.all([
      Creator.find({ _id: { $in: allCreatorIds } })
        .select('name profilePhoto bankDetails instagram.handle'),
      Brand.find({ _id: { $in: allBrandIds } })
        .select('brandName logo'),
    ]);
    const creatorById = {};
    creators.forEach((c) => { creatorById[c._id.toString()] = c; });
    const brandById = {};
    brands.forEach((b) => { brandById[b._id.toString()] = b; });

    const attachNames = (entry) => {
      const creator = entry.creatorId ? creatorById[entry.creatorId.toString()] : null;
      const brand = entry.brandId ? brandById[entry.brandId.toString()] : null;
      return {
        ...entry,
        creatorName: creator?.name || 'Unknown creator',
        creatorHandle: creator?.instagram?.handle || '',
        brandName: brand?.brandName || 'Unknown brand',
        hasBankDetails: !!(creator?.bankDetails?.accountNumber),
        bankDetails: creator?.bankDetails || null,
      };
    };

    res.json({
      totalCollected,
      commissionRealized,
      commissionUpcoming,
      activeCollaborations: activeCollaborations.map(attachNames).sort((a, b) => b.requestedAt - a.requestedAt),
      payoutQueue: payoutQueue.map(attachNames).sort((a, b) => a.approvedAt - b.approvedAt),
      completedPayouts: completedPayouts.map(attachNames).sort((a, b) => b.payoutCompletedAt - a.payoutCompletedAt),
    });
  } catch (error) {
    console.error('getAdminPaymentOverview error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/payment/admin/mark-paid ───────────────────────────────────────
// Admin marks a payout as actually completed, after manually transferring
// the money. This is the only place payoutStatus ever moves from 'pending'
// to 'completed' — there is no automatic payout yet (see the TODO in
// releasePayment), so this is a deliberate, manual confirmation step.
const markPayoutCompleted = async (req, res) => {
  const { deliveryMessageId } = req.body;
  if (!deliveryMessageId) {
    return res.status(400).json({ message: 'deliveryMessageId is required' });
  }
  try {
    const updated = await Message.findOneAndUpdate(
      { _id: deliveryMessageId, type: 'delivery', 'delivery.status': 'approved' },
      { payoutStatus: 'completed', payoutCompletedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Approved delivery message not found' });
    }

    // transition the Collaboration record to 'completed' — the admin has
    // confirmed the actual bank transfer to the creator happened
    if (updated.collabId) {
      await Collaboration.findOneAndUpdate(
        { collabId: updated.collabId },
        { status: 'completed', completedAt: new Date() }
      );
    }

    res.json({ message: 'Payout marked as completed', deliveryMessageId: updated._id });
  } catch (error) {
    console.error('markPayoutCompleted error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitCreatorReview = async (req, res) => {
  const { creatorId, rating, reviewText, conversationId } = req.body;

  if (!creatorId) {
    return res.status(400).json({ message: 'creatorId is required' });
  }
  if (!rating || rating < 1 || rating > 10) {
    return res.status(400).json({ message: 'Rating must be between 1 and 10' });
  }

  try {
    const brand = await Brand.findOne({ userId: req.user.id }).select('brandName');
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    await Review.create({
      creatorId,
      brandName: brand.brandName,
      rating: Number(rating),
      reviewText: reviewText || '',
      conversationId: conversationId || null,
    });

    // recalculate both quality score and the cached avgRating now that a
    // new review exists — avgRating is stored directly on Creator (rather
    // than computed live from the Review collection) so it's cheap to
    // display on every card in a browse list without an extra query per card
    const creator = await Creator.findById(creatorId);
    if (creator) {
      const newScore = await calculateQualityScore(creator);

      const allReviews = await Review.find({ creatorId }).select('rating');
      const newAvgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;
      await Creator.findByIdAndUpdate(creatorId, {
        qualityScore: newScore,
        avgRating: Math.round(newAvgRating * 100) / 100,
        reviewCount: allReviews.length,
      });
    }

    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('submitCreatorReview error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  releasePayment,
  getCreatorBankDetails,
  saveCreatorBankDetails,
  getAdminPaymentOverview,
  markPayoutCompleted,
  submitCreatorReview,
  getAvailableCollabs,
  rejectDelivery,
  razorpayWebhook,

};
