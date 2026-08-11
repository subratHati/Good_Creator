const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');

// ─── GET /api/chat/conversations ─────────────────────────────────────────────
const getConversations = async (req, res) => {
  try {
    let conversations;

    if (req.user.role === 'creator') {
      const creator = await Creator.findOne({ userId: req.user.id });
      if (!creator) return res.json({ conversations: [] });

      conversations = await Conversation.find({ creatorId: creator._id })
        .populate('brandId', 'brandName logo category')
        .sort({ lastMessageAt: -1 });

      conversations = conversations.map(c => ({
        ...c.toObject(),
        unreadCount: c.unreadByCreator,
      }));
    } else {
      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand) return res.json({ conversations: [] });

      conversations = await Conversation.find({ brandId: brand._id })
        .populate('creatorId', 'name profilePhoto instagram categories')
        .sort({ lastMessageAt: -1 });

      conversations = conversations.map(c => ({
        ...c.toObject(),
        unreadCount: c.unreadByBrand,
      }));
    }

    res.json({ conversations });
  } catch (error) {
    console.error('getConversations error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/chat/conversations ────────────────────────────────────────────
const getOrCreateConversation = async (req, res) => {
  const { targetId } = req.body; // creatorId if brand, brandId if creator

  try {
    let brandId, creatorId, brandUserId, creatorUserId;

    if (req.user.role === 'brand') {
      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand) return res.status(404).json({ message: 'Brand profile not found' });
      const creator = await Creator.findById(targetId);
      if (!creator) return res.status(404).json({ message: 'Creator not found' });

      brandId = brand._id;
      creatorId = creator._id;
      brandUserId = req.user.id;
      creatorUserId = creator.userId;
    } else {
      const creator = await Creator.findOne({ userId: req.user.id });
      if (!creator) return res.status(404).json({ message: 'Creator profile not found' });
      const brand = await Brand.findById(targetId);
      if (!brand) return res.status(404).json({ message: 'Brand not found' });

      brandId = brand._id;
      creatorId = creator._id;
      brandUserId = brand.userId;
      creatorUserId = req.user.id;
    }

    let conversation = await Conversation.findOne({ brandId, creatorId });

    if (!conversation) {
      conversation = await Conversation.create({
        brandId, creatorId, brandUserId, creatorUserId,
      });
    }

    // populate for response
    conversation = await Conversation.findById(conversation._id)
      .populate('brandId', 'brandName logo category')
      .populate('creatorId', 'name profilePhoto instagram categories');

    res.json({ conversation });
  } catch (error) {
    console.error('getOrCreateConversation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/chat/conversations/:id/messages ─────────────────────────────────
const getMessages = async (req, res) => {
  const { id } = req.params;
  try {
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 });

    // mark messages as seen
    if (req.user.role === 'creator') {
      await Conversation.findByIdAndUpdate(id, { unreadByCreator: 0 });
      await Message.updateMany(
        { conversationId: id, senderRole: 'brand', seen: false },
        { seen: true }
      );
    } else {
      await Conversation.findByIdAndUpdate(id, { unreadByBrand: 0 });
      await Message.updateMany(
        { conversationId: id, senderRole: 'creator', seen: false },
        { seen: true }
      );
    }

    res.json({ messages });
  } catch (error) {
    console.error('getMessages error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/chat/conversations/:id/messages ────────────────────────────────
const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { text, type, enquiry, paymentRequest, delivery, collabId } = req.body;

  try {
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    // delivery messages need extra validation + a state transition on
    // the collab they're fulfilling — handled before creating the message
    // itself, so a failed validation never creates a half-valid delivery
    if (type === 'delivery') {
      if (!collabId) {
        return res.status(400).json({ message: 'Please select which collab this delivery is for' });
      }

      const hasAtLeastOneMedium = !!(
        delivery?.instagramLink || delivery?.whatsappNumber || delivery?.email || delivery?.otherMedium
      );
      if (!hasAtLeastOneMedium) {
        return res.status(400).json({ message: 'Please provide at least one way to access the content' });
      }

      // confirm this collabId is genuinely still awaiting delivery —
      // re-checked here server-side, not just trusted from the frontend
      // dropdown, in case of a race condition (e.g. two tabs open)
      const targetCollab = await Message.findOne({
        conversationId: id,
        type: 'payment_request',
        collabId,
        'paymentRequest.status': 'paid',
        'paymentRequest.deliveryStatus': 'awaiting_delivery',
      });
      if (!targetCollab) {
        return res.status(400).json({ message: 'This collab is no longer available for delivery submission' });
      }

      // flip the collab's state so it disappears from the dropdown until
      // this delivery is approved or rejected
      await Message.findByIdAndUpdate(targetCollab._id, {
        'paymentRequest.deliveryStatus': 'pending_review',
      });
    }

    const message = await Message.create({
      conversationId: id,
      senderId: req.user.id,
      senderRole: req.user.role,
      type: type || 'text',
      text: text || '',
      enquiry,
      paymentRequest,
      delivery,
      collabId: type === 'delivery' ? collabId : undefined,
    });

    // update conversation last message
    const lastMessageText = type === 'enquiry' ? '📋 Enquiry about opening'
      : type === 'payment_request' ? `💰 Payment request ₹${paymentRequest?.amount}`
        : type === 'delivery' ? '📦 Delivery submitted'
          : text;

    const unreadUpdate = req.user.role === 'brand'
      ? { unreadByCreator: conversation.unreadByCreator + 1 }
      : { unreadByBrand: conversation.unreadByBrand + 1 };

    await Conversation.findByIdAndUpdate(id, {
      lastMessage: lastMessageText,
      lastMessageAt: new Date(),
      lastMessageBy: req.user.role,
      ...unreadUpdate,
    });

    // emit via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${id}`).emit('new_message', message);
      // notify the other user
      const otherUserId = req.user.role === 'brand'
        ? conversation.creatorUserId.toString()
        : conversation.brandUserId.toString();
      io.to(`user_${otherUserId}`).emit('conversation_updated', {
        conversationId: id,
        lastMessage: lastMessageText,
        lastMessageAt: new Date(),
      });
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/chat/unread ─────────────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    let totalUnread = 0;

    if (req.user.role === 'creator') {
      const creator = await Creator.findOne({ userId: req.user.id });
      if (creator) {
        const result = await Conversation.aggregate([
          { $match: { creatorId: creator._id } },
          { $group: { _id: null, total: { $sum: '$unreadByCreator' } } },
        ]);
        totalUnread = result[0]?.total || 0;
      }
    } else {
      const brand = await Brand.findOne({ userId: req.user.id });
      if (brand) {
        const result = await Conversation.aggregate([
          { $match: { brandId: brand._id } },
          { $group: { _id: null, total: { $sum: '$unreadByBrand' } } },
        ]);
        totalUnread = result[0]?.total || 0;
      }
    }

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('brandId', 'brandName logo')
      .populate('creatorId', 'name profilePhoto');
    if (!conversation) return res.status(404).json({ message: 'Not found' });
    res.json({ conversation });
  } catch (error) {
    console.error('getConversationById error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
  getConversationById,
};
