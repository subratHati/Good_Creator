// controllers/collaborationHistory.controller.js
const Collaboration = require('../models/Collaboration');
const Message = require('../models/Message');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');

const getStage = (paymentMsg, deliveryMsg) => {
  if (!deliveryMsg) return 'initiated';
  if (deliveryMsg.delivery?.status !== 'approved') return 'submitted';
  if (deliveryMsg.payoutStatus !== 'completed') return 'approved';
  return 'paid_out';
};

const buildCollabList = async ({ creatorId, brandId }) => {
  const filter = creatorId ? { creatorId } : { brandId };
  const collabs = await Collaboration.find(filter).sort({ paidAt: -1 });
  if (collabs.length === 0) return [];

  const collabIds = collabs.map((c) => c.collabId);

  const [paymentMsgs, deliveryMsgs] = await Promise.all([
    Message.find({ type: 'payment_request', collabId: { $in: collabIds } })
      .select('collabId paymentRequest'),
    Message.find({ type: 'delivery', collabId: { $in: collabIds } })
      .select('collabId delivery payoutStatus')
      .sort({ createdAt: -1 }),
  ]);

  const paymentByCollab = {};
  paymentMsgs.forEach((m) => { paymentByCollab[m.collabId] = m; });
  const deliveryByCollab = {};
  deliveryMsgs.forEach((m) => {
    if (!deliveryByCollab[m.collabId]) deliveryByCollab[m.collabId] = m;
  });

  const otherIds = creatorId
    ? [...new Set(collabs.map((c) => c.brandId.toString()))]
    : [...new Set(collabs.map((c) => c.creatorId.toString()))];
  const otherParties = creatorId
    ? await Brand.find({ _id: { $in: otherIds } }).select('brandName logo')
    : await Creator.find({ _id: { $in: otherIds } }).select('name profilePhoto');
  const otherById = {};
  otherParties.forEach((p) => { otherById[p._id.toString()] = p; });

  return collabs.map((c) => {
    const paymentMsg = paymentByCollab[c.collabId];
    const deliveryMsg = deliveryByCollab[c.collabId];
    const other = creatorId ? otherById[c.brandId.toString()] : otherById[c.creatorId.toString()];
    return {
      collabId: c.collabId,
      conversationId: c.conversationId,
      amount: c.amount,
      deadline: c.deadline,
      paidAt: c.paidAt,
      status: c.status,
      stage: getStage(paymentMsg, deliveryMsg),
      otherPartyName: creatorId ? (other?.brandName || 'Brand') : (other?.name || 'Creator'),
      otherPartyImage: creatorId ? (other?.logo || '') : (other?.profilePhoto || ''),
    };
  });
};

// ─── GET /api/collaboration-history/mine ─────────────────────────────────────
const getMyCollabHistory = async (req, res) => {
  try {
    let list;
    if (req.user.role === 'creator') {
      const creator = await Creator.findOne({ userId: req.user.id });
      if (!creator) return res.json({ active: [], completed: [] });
      list = await buildCollabList({ creatorId: creator._id });
    } else if (req.user.role === 'brand') {
      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand) return res.json({ active: [], completed: [] });
      list = await buildCollabList({ brandId: brand._id });
    } else {
      return res.json({ active: [], completed: [] });
    }

    const active = list.filter((c) => c.stage !== 'paid_out');
    const completed = list.filter((c) => c.stage === 'paid_out');

    res.json({ active, completed });
  } catch (error) {
    console.error('getMyCollabHistory error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMyCollabHistory };
