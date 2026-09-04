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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── POST /api/payment/create-order ──────────────────────────────────────────
// Brand calls this when they click "Pay Now" on a payment request message
const createOrder = async (req, res) => {
  const { messageId, conversationId } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.type !== 'payment_request') return res.status(400).json({ message: 'Not a payment request' });
    if (message.paymentRequest.status !== 'pending') return res.status(400).json({ message: 'Payment already processed' });

    const amount = message.paymentRequest.amount;
    const platformFee = Math.round(amount * 0.15); // 15% platform fee
    const creatorAmount = amount - platformFee;

    // create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise
      currency: 'INR',
      receipt: `order_${messageId}`,
      notes: {
        messageId: messageId.toString(),
        conversationId: conversationId.toString(),
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
      messageId,
      conversationId,
      description: 'GoodCreator collab payment',
      creatorAmount,
      platformFee,
    });
  } catch (error) {
    console.error('[PAYMENT] createOrder error:', error.message);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

// ─── POST /api/payment/verify ─────────────────────────────────────────────────
// Called after Razorpay payment is completed to verify and update DB
const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    messageId,
    conversationId,
  } = req.body;
  try {
    // verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    if (expectedSignature !== razorpay_signature) {
      console.error('[PAYMENT] Signature mismatch');
      return res.status(400).json({ message: 'Payment verification failed' });
    }
    console.log('[PAYMENT] Signature verified for payment:', razorpay_payment_id);

    // generate this collab's unique reference ID now that payment is real
    const collabId = await generateCollabId();

    // fetch the original payment_request BEFORE updating it, so we have
    // its amount/deliverables/deadline in hand for the Collaboration
    // record below — these values don't actually change during this
    // update, but fetching once and reusing avoids a redundant query
    const originalPaymentMsg = await Message.findById(messageId);

    // update message payment status
    await Message.findByIdAndUpdate(messageId, {
      'paymentRequest.status': 'paid',
      'paymentRequest.razorpayOrderId': razorpay_order_id,
      'paymentRequest.razorpayPaymentId': razorpay_payment_id,
      'paymentRequest.paidAt': new Date(),
      'paymentRequest.deliveryStatus': 'awaiting_delivery',
      collabId,
    });

    // fetch conversation once, reused below for both the Collaboration
    // record and the unread-count update
    const conversation = await Conversation.findById(conversationId);

    // create the durable Collaboration record — this is the one moment a
    // Collaboration document comes into existence, matching exactly when
    // a Collab genuinely becomes a real, paid engagement (not before)
    await Collaboration.create({
      collabId,
      creatorId: conversation.creatorId,
      brandId: conversation.brandId,
      conversationId,
      amount: originalPaymentMsg.paymentRequest.amount,
      deliverables: originalPaymentMsg.paymentRequest.deliverables,
      deadline: originalPaymentMsg.paymentRequest.deadline,
      status: 'pending',
      paidAt: new Date(),
    });

    // send payment confirmed message in chat
    const paymentMessage = await Message.create({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      type: 'payment_confirmed',
      text: `Payment of ₹${req.body.amount ? (req.body.amount / 100).toLocaleString('en-IN') : ''} received! Money is held securely. Complete the deliverable to release payment.`,
      collabId,
    });

    // update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: '✅ Payment confirmed',
      lastMessageAt: new Date(),
      lastMessageBy: req.user.role,
      unreadByCreator: (conversation?.unreadByCreator || 0) + 1,
    });

    // emit via socket
    // emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', paymentMessage);
      io.to(`conversation_${conversationId}`).emit('payment_confirmed', { messageId });
    }

    // notify the creator — payment received, collab now active
    if (conversation?.creatorUserId) {
      createNotification({
        userId: conversation.creatorUserId,
        type: 'application',
        title: 'Payment received 💰',
        message: `A brand paid for your collab (${collabId}). Complete the deliverable to release payment.`,
        actionPath: `/messages/${conversationId}`,
      });
    }

    res.json({ success: true, paymentMessage });
  } catch (error) {
    console.error('[PAYMENT] verifyPayment error:', error.message);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// ─── POST /api/payment/release ────────────────────────────────────────────────
// Called when brand approves delivery — marks payout as processing
const releasePayment = async (req, res) => {
  const { conversationId, deliveryMessageId } = req.body;

  try {
    // find the delivery message first — we need its collabId to look up
    // the EXACT right payment request, not just "any paid one in this
    // conversation" (a conversation can have several over time)
    const deliveryMsg = await Message.findById(deliveryMessageId);
    if (!deliveryMsg) {
      return res.status(404).json({ message: 'Delivery message not found' });
    }
    if (!deliveryMsg.collabId) {
      return res.status(400).json({ message: 'This delivery has no linked collab ID — cannot determine payout amount' });
    }

    // find the SPECIFIC payment request this delivery is fulfilling,
    // matched by collabId — this is the actual fix for the old bug where
    // findOne() with no filter could grab an unrelated paid request from
    // the same conversation
    const paymentMsg = await Message.findOne({
      conversationId,
      type: 'payment_request',
      collabId: deliveryMsg.collabId,
      'paymentRequest.status': 'paid',
    });
    if (!paymentMsg) {
      return res.status(404).json({ message: 'Could not find the payment request for this collab' });
    }

    // update delivery status — payoutStatus starts as 'pending' the moment
    // delivery is approved, since that's the exact trigger for the admin's
    // 48-hour manual payout window
    await Message.findByIdAndUpdate(deliveryMessageId, {
      'delivery.status': 'approved',
      'delivery.approvedAt': new Date(),
      payoutStatus: 'pending',
    });

    // mark this specific collab as fully approved — permanently removed
    // from the "available for delivery" dropdown from this point on
    await Message.findByIdAndUpdate(paymentMsg._id, {
      'paymentRequest.deliveryStatus': 'approved',
    });

    const amount = paymentMsg.paymentRequest?.amount || 0;
    const platformFee = Math.round(amount * 0.15);
    const creatorAmount = amount - platformFee;

    // get creator bank details
    const conversation = await Conversation.findById(conversationId);
    const creator = await Creator.findById(conversation.creatorId)
      .select('name bankDetails instagram userId');

    // send payment released message
    const releaseMessage = await Message.create({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      type: 'payment_released',
      collabId: deliveryMsg.collabId,
      text: `🎉 Delivery approved! ₹${creatorAmount.toLocaleString('en-IN')} will be credited to ${creator?.name || 'creator'}'s bank account within 48 hours.`,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: '🎉 Payment released',
      lastMessageAt: new Date(),
      lastMessageBy: req.user.role,
      unreadByCreator: (conversation?.unreadByCreator || 0) + 1,
    });

    // emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', releaseMessage);
    }

    console.log('[PAYMENT] Payment release initiated for creator:', creator?.name, 'amount:', creatorAmount);
    // TODO: Integrate Razorpay Payouts API here when business account is ready
    // For now, admin manually processes the payout

    // notify the creator — delivery approved, payout on its way
   
    if (creator?.userId) {
      createNotification({
        userId: creator.userId,
        type: 'application',
        title: 'Delivery approved 🎉',
        message: `Your delivery was approved. ₹${creatorAmount.toLocaleString('en-IN')} will be credited within 48 hours.`,
        actionPath: `/messages/${conversationId}`,
      });
    }

    res.json({ success: true, releaseMessage, creatorAmount, platformFee });
  } catch (error) {
    console.error('[PAYMENT] releasePayment error:', error.message);
    res.status(500).json({ message: 'Failed to release payment' });
  }
};

// ─── GET /api/payment/available-collabs/:conversationId ─────────────────────
// Returns paid collabs in this conversation that are awaiting delivery —
// i.e. NOT already submitted for review, and NOT already approved. This
// is exactly the dropdown list a creator should see when submitting a
// new delivery, per the state machine: a collabId becomes unavailable
// the moment a delivery is submitted for it (pending_review), and stays
// unavailable permanently once approved. If a delivery is rejected, the
// collab reverts to awaiting_delivery and becomes selectable again.
const getAvailableCollabs = async (req, res) => {
  try {
    const collabs = await Message.find({
      conversationId: req.params.conversationId,
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
  const { conversationId, deliveryMessageId, reason } = req.body;

  try {
    const deliveryMsg = await Message.findById(deliveryMessageId);
    if (!deliveryMsg) {
      return res.status(404).json({ message: 'Delivery message not found' });
    }

    await Message.findByIdAndUpdate(deliveryMessageId, {
      'delivery.status': 'revision_requested',
    });

    // revert the collab back to awaiting_delivery so it reappears in
    // the dropdown for a fresh delivery submission
    if (deliveryMsg.collabId) {
      await Message.findOneAndUpdate(
        {
          conversationId,
          type: 'payment_request',
          collabId: deliveryMsg.collabId,
        },
        { 'paymentRequest.deliveryStatus': 'awaiting_delivery' }
      );
    }

    const releaseMessage = await Message.create({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      type: 'text',
      text: reason
        ? `Delivery needs revision: ${reason}`
        : 'Delivery needs revision. Please resubmit.',
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', releaseMessage);
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
    }).select('conversationId senderId paymentRequest createdAt');

    const conversationIds = paidRequests.map((r) => r.conversationId);

    // approved deliveries for those same conversations — one query instead
    // of one-per-conversation, then matched up in memory below
    const approvedDeliveries = await Message.find({
      type: 'delivery',
      'delivery.status': 'approved',
      conversationId: { $in: conversationIds },
    }).select('conversationId delivery payoutStatus payoutCompletedAt createdAt');

    // map conversationId -> its approved delivery (if any), for quick lookup.
    // if a conversation somehow has more than one approved delivery, this
    // takes the most recently created one, which is the practically correct
    // choice (e.g. a revision that was re-approved later)
    const deliveryByConversation = {};
    approvedDeliveries.forEach((d) => {
      const key = d.conversationId.toString();
      if (!deliveryByConversation[key] || d.createdAt > deliveryByConversation[key].createdAt) {
        deliveryByConversation[key] = d;
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

      const delivery = deliveryByConversation[paymentReq.conversationId.toString()];

      if (!delivery) {
        commissionUpcoming += commission;
        activeCollaborations.push({
          conversationId: paymentReq.conversationId,
          creatorUserId: paymentReq.senderId,
          amount,
          commission,
          creatorAmount,
          description: paymentReq.paymentRequest?.description || '',
          requestedAt: paymentReq.createdAt,
        });
        continue;
      }

      commissionRealized += commission;

      const entry = {
        conversationId: paymentReq.conversationId,
        creatorUserId: paymentReq.senderId,
        amount,
        commission,
        creatorAmount,
        description: paymentReq.paymentRequest?.description || '',
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

    // attach creator name/handle to payout queue + completed payouts, since
    // the admin needs to know WHO to pay, not just a raw ObjectId
    const allCreatorUserIds = [...payoutQueue, ...completedPayouts].map((e) => e.creatorUserId);
    const creators = await Creator.find({ userId: { $in: allCreatorUserIds } })
      .select('userId name profilePhoto bankDetails instagram.handle');
    const creatorByUserId = {};
    creators.forEach((c) => { creatorByUserId[c.userId.toString()] = c; });

    const attachCreator = (entry) => {
      const creator = creatorByUserId[entry.creatorUserId.toString()];
      return {
        ...entry,
        creatorName: creator?.name || 'Unknown creator',
        creatorHandle: creator?.instagram?.handle || '',
        hasBankDetails: !!(creator?.bankDetails?.accountNumber),
        bankDetails: creator?.bankDetails || null,
      };
    };

    res.json({
      totalCollected,
      commissionRealized,
      commissionUpcoming,
      activeCollaborations: activeCollaborations.sort((a, b) => b.requestedAt - a.requestedAt),
      payoutQueue: payoutQueue.map(attachCreator).sort((a, b) => a.approvedAt - b.approvedAt),
      completedPayouts: completedPayouts.map(attachCreator).sort((a, b) => b.payoutCompletedAt - a.payoutCompletedAt),
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

};
