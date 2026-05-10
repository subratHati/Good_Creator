const Razorpay = require('razorpay');
const crypto = require('crypto');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Creator = require('../models/Creator');

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
      description: message.paymentRequest.description,
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

    // update message payment status
    await Message.findByIdAndUpdate(messageId, {
      'paymentRequest.status': 'paid',
      'paymentRequest.razorpayOrderId': razorpay_order_id,
      'paymentRequest.razorpayPaymentId': razorpay_payment_id,
      'paymentRequest.paidAt': new Date(),
    });

    // send payment confirmed message in chat
    const conversation = await Conversation.findById(conversationId);
    const paymentMessage = await Message.create({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      type: 'payment_confirmed',
      text: `Payment of ₹${req.body.amount ? (req.body.amount / 100).toLocaleString('en-IN') : ''} received! Money is held securely. Complete the deliverable to release payment.`,
    });

    // update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: '✅ Payment confirmed',
      lastMessageAt: new Date(),
      lastMessageBy: req.user.role,
      unreadByCreator: (conversation?.unreadByCreator || 0) + 1,
    });

    // emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', paymentMessage);
      io.to(`conversation_${conversationId}`).emit('payment_confirmed', { messageId });
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
    // update delivery status
    await Message.findByIdAndUpdate(deliveryMessageId, {
      'delivery.status': 'approved',
      'delivery.approvedAt': new Date(),
    });

    // find the paid payment request in this conversation
    const paymentMsg = await Message.findOne({
      conversationId,
      type: 'payment_request',
      'paymentRequest.status': 'paid',
    });

    const amount = paymentMsg?.paymentRequest?.amount || 0;
    const platformFee = Math.round(amount * 0.15);
    const creatorAmount = amount - platformFee;

    // get creator bank details
    const conversation = await Conversation.findById(conversationId);
    const creator = await Creator.findById(conversation.creatorId)
      .select('name bankDetails instagram');

    // send payment released message
    const releaseMessage = await Message.create({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      type: 'payment_released',
      text: `🎉 Delivery approved! ₹${creatorAmount.toLocaleString('en-IN')} will be credited to ${creator?.name || 'creator'}'s bank account within 24 hours.`,
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

    res.json({ success: true, releaseMessage, creatorAmount, platformFee });
  } catch (error) {
    console.error('[PAYMENT] releasePayment error:', error.message);
    res.status(500).json({ message: 'Failed to release payment' });
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

module.exports = {
  createOrder,
  verifyPayment,
  releasePayment,
  getCreatorBankDetails,
  saveCreatorBankDetails,
};
