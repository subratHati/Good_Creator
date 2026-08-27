// controllers/conversationAnalytics.controller.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const getDateRangeStart = (range) => {
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'this_week': {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'this_month': {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    default:
      return null;
  }
};

// ─── GET /api/analytics/conversation-brands ──────────────────────────────────
// Filters: category (brand's category), range (today/this_week/this_month —
// filters by lastActivityAt), sortBy (recent/oldest/most/least)
const getBrandsWithConversations = async (req, res) => {
  try {
    const { category, range, sortBy } = req.query;

    const rangeStart = getDateRangeStart(range);
    const matchStage = {};
    if (rangeStart) matchStage.lastMessageAt = { $gte: rangeStart };

    const pipeline = [
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$brandId',
          conversationCount: { $sum: 1 },
          lastActivityAt: { $max: '$lastMessageAt' },
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: '_id',
          foreignField: '_id',
          as: 'brand',
        },
      },
      { $unwind: '$brand' },
      ...(category ? [{ $match: { 'brand.category': category } }] : []),
      {
        $project: {
          _id: 0,
          brandId: '$_id',
          brandName: '$brand.brandName',
          logo: '$brand.logo',
          category: '$brand.category',
          conversationCount: 1,
          lastActivityAt: 1,
        },
      },
    ];

    const results = await Conversation.aggregate(pipeline);

    const sortFns = {
      recent: (a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt),
      oldest: (a, b) => new Date(a.lastActivityAt) - new Date(b.lastActivityAt),
      most: (a, b) => b.conversationCount - a.conversationCount,
      least: (a, b) => a.conversationCount - b.conversationCount,
    };
    results.sort(sortFns[sortBy] || sortFns.recent);

    res.json({ brands: results });
  } catch (error) {
    console.error('getBrandsWithConversations error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


const formatDate = (date) =>
  date ? new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const formatMessage = (msg, speakerLabel) => {
  const lines = [`[${formatDate(msg.createdAt)}] ${speakerLabel}:`];

  if (msg.type === 'text') {
    lines.push(msg.text || '(empty message)');
  } else if (msg.type === 'enquiry') {
    lines.push(`(Enquiry re: "${msg.enquiry?.openingTitle || 'a campaign'}") ${msg.enquiry?.message || ''}`);
  } else if (msg.type === 'payment_request') {
    const pr = msg.paymentRequest || {};
    const d = pr.deliverables || {};
    const delivStr = [
      d.reels ? `${d.reels} reel(s)` : null,
      d.posts ? `${d.posts} post(s)` : null,
      d.stories ? `${d.stories} stor(y/ies)` : null,
      d.ugc ? `${d.ugc} UGC` : null,
    ].filter(Boolean).join(', ');
    lines.push(
      `[PAYMENT REQUEST] Amount: ₹${pr.amount || 0} | Deliverables: ${delivStr || 'none specified'} | ` +
      `Deadline: ${pr.deadline ? formatDate(pr.deadline) : 'none'} | Status: ${pr.status} | Collab ID: ${msg.collabId || 'n/a'}`
    );
  } else if (msg.type === 'payment_confirmed') {
    lines.push(`[PAYMENT CONFIRMED] Collab ID: ${msg.collabId || 'n/a'} — ${msg.text || ''}`);
  } else if (msg.type === 'delivery') {
    const del = msg.delivery || {};
    const contactMethods = [
      del.instagramLink ? `Instagram: ${del.instagramLink}` : null,
      del.whatsappNumber ? `WhatsApp number shared: ${del.whatsappNumber}` : null,
      del.email ? `Email shared: ${del.email}` : null,
      del.otherMedium ? `Other: ${del.otherMedium}` : null,
    ].filter(Boolean).join(' | ');
    lines.push(
      `[DELIVERY SUBMITTED] ${contactMethods || 'no contact details given'} | Note: ${del.note || 'none'} | Status: ${del.status}`
    );
  } else if (msg.type === 'payment_released') {
    lines.push(`[PAYMENT RELEASED] Collab ID: ${msg.collabId || 'n/a'} — ${msg.text || ''}`);
  }

  return lines.join('\n');
};

// ─── GET /api/analytics/conversation-brands/:brandId/export ─────────────────
const exportBrandConversations = async (req, res) => {
  try {
    const { brandId } = req.params;

    const conversations = await Conversation.find({ brandId })
      .populate('creatorId', 'name')
      .sort({ lastMessageAt: -1 });

    if (conversations.length === 0) {
      return res.json({ conversationCount: 0, text: 'No conversations found for this brand.' });
    }

    const sections = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 });
        const creatorName = conv.creatorId?.name || 'Unknown creator';

        const body = messages
          .map((msg) => formatMessage(msg, msg.senderRole === 'brand' ? 'BRAND' : `CREATOR (${creatorName})`))
          .join('\n\n');

        return (
          `${'='.repeat(60)}\n` +
          `CONVERSATION WITH: ${creatorName}\n` +
          `Started: ${formatDate(conv.createdAt)} | Last activity: ${formatDate(conv.lastMessageAt)}\n` +
          `${'='.repeat(60)}\n\n` +
          (body || '(no messages)')
        );
      })
    );

    const fullText = sections.join('\n\n\n');

    res.json({
      conversationCount: conversations.length,
      text: fullText,
    });
  } catch (error) {
    console.error('exportBrandConversations error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBrandsWithConversations,
  exportBrandConversations,
};
