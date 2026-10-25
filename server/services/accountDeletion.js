const crypto = require('crypto');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const Opening = require('../models/Opening');
const Application = require('../models/Application');
const Collaboration = require('../models/Collaboration');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const AssistantConversation = require('../models/AssistantConversation');
const AssistantMessage = require('../models/AssistantMessage');
const AdminConversation = require('../models/AdminConversation');
const AdminMessage = require('../models/AdminMessage');
const DeletedAccount = require('../models/DeletedAccount');
const profilePhoto = require('../utils/profilePhoto');

const DELETED_EMAIL_DOMAIN = 'deleted.invalid';

const maskEmail = (email = '') => {
    const [local, domain] = String(email).split('@');
    if (!local || !domain) return '';
    return `${local.slice(0, 1)}***@${domain}`;
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// ---------- 1. what is blocking deletion? ----------
async function getBlockers(role, profile) {
    const isCreator = role === 'creator';
    const side = isCreator ? { creatorId: profile._id } : { brandId: profile._id };
    const blockers = [];

    const [inProgress, delivered, convIds] = await Promise.all([
        Collaboration.countDocuments({ ...side, status: 'pending' }),
        Collaboration.countDocuments({ ...side, status: 'delivered' }),
        Conversation.find(side).distinct('_id'),
    ]);

    let openRequests = 0;
    let payoutPendingMsgs = 0;
    if (convIds.length) {
        [openRequests, payoutPendingMsgs] = await Promise.all([
            Message.countDocuments({
                conversationId: { $in: convIds },
                type: 'payment_request',
                'paymentRequest.status': 'pending',
            }),
            Message.countDocuments({
                conversationId: { $in: convIds },
                payoutStatus: 'pending',
            }),
        ]);
    }

    if (inProgress) {
        blockers.push({
            code: 'collaboration_in_progress',
            count: inProgress,
            message: isCreator
                ? `${plural(inProgress, 'paid collaboration')} still in progress. Finish the delivery and get it approved first.`
                : `${plural(inProgress, 'collaboration')} still in progress. Review and approve the delivery first.`,
        });
    }

    const payoutCount = Math.max(delivered, payoutPendingMsgs);
    if (payoutCount) {
        blockers.push({
            code: 'payout_pending',
            count: payoutCount,
            message: isCreator
                ? `${plural(payoutCount, 'collaboration')} approved, but your payout is not completed yet.`
                : `${plural(payoutCount, 'collaboration')} where the creator's payout is still being processed.`,
        });
    }

    if (openRequests) {
        blockers.push({
            code: 'open_payment_request',
            count: openRequests,
            message: `${plural(openRequests, 'open payment request')} in your chats. Wait until each one is paid or cancelled.`,
        });
    }

    if (!isCreator) {
        const now = new Date();
        const activeCampaigns = await Opening.countDocuments({
            brandId: profile._id,
            status: 'active',
            $or: [{ deadline: null }, { deadline: { $gte: now } }],
        });
        if (activeCampaigns) {
            blockers.push({
                code: 'active_campaign',
                count: activeCampaigns,
                message: `${plural(activeCampaigns, 'active campaign')}. Close ${activeCampaigns === 1 ? 'it' : 'them'} from your campaigns page first.`,
            });
        }
    }

    return blockers;
}

// ---------- helpers for the cleanup ----------
// Safety net: only use a filter if every field in it really exists in that
// model's schema. (A filter on an unknown field can be silently dropped by
// Mongoose, and a dropped filter inside a delete can match EVERYTHING.)
const usable = (Model, clauses) =>
    clauses.filter((c) => Object.keys(c).every((k) => Model.schema.path(k)));

const deleteWhere = async (Model, clauses) => {
    const ok = usable(Model, clauses);
    if (!ok.length) return 0;
    const res = await Model.deleteMany(ok.length === 1 ? ok[0] : { $or: ok });
    return res.deletedCount;
};

const cloudinaryPublicId = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
    const m = url.split('?')[0].match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return m ? m[1] : null;
};

const destroyImage = async (url) => {
    const publicId = cloudinaryPublicId(url);
    if (!publicId) return 0;
    if (typeof profilePhoto.getUploader !== 'function') {
        throw new Error('getUploader is not exported from utils/profilePhoto');
    }
    const uploader = await profilePhoto.getUploader();
    const res = await uploader.destroy(publicId, { invalidate: true });
    return res && res.result === 'ok' ? 1 : 0;
};

const blankInstagram = (extra = {}) => ({
    handle: '', userId: '', accessToken: '', followersCount: 0,
    isConnected: false, isManuallyAdded: false, lastSynced: null,
    ...extra,
});

// ---------- 2. the deletion itself ----------
async function deleteAccount({ user, profile, reasonCategory, reasonText }) {
    const role = user.role;
    const isCreator = role === 'creator';
    const userId = user._id;
    const profileId = profile._id;

    const name = isCreator ? profile.name : profile.brandName;
    const photoUrl = isCreator ? profile.profilePhoto : profile.logo;
    const screenshotUrl = isCreator ? profile.insightScreenshot : '';

    const record = await DeletedAccount.create({
        role, name, maskedEmail: maskEmail(user.email),
        reasonCategory, reasonText, userId, profileId,
    });

    // lock the login first, so the person is out immediately
    try {
        user.email = `deleted-${userId}@${DELETED_EMAIL_DOMAIN}`;
        user.password = crypto.randomBytes(32).toString('hex'); // hashed by the model's pre-save hook
        user.isActive = false;
        user.isEmailVerified = false;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save({ validateBeforeSave: false });
    } catch (err) {
        await DeletedAccount.deleteOne({ _id: record._id }).catch(() => { });
        throw err;
    }

    const report = {};
    const failed = [];
    const step = async (label, fn) => {
        try {
            report[label] = await fn();
        } catch (err) {
            report[label] = `ERROR: ${err.message}`;
            failed.push(label);
            console.error(`[DELETE ACCOUNT] step "${label}" failed:`, err.message);
        }
    };

    const convFilter = isCreator ? { creatorId: profileId } : { brandId: profileId };
    const convIds = await Conversation.find(convFilter).distinct('_id');

    // --- data removed for everyone ---
    await step('notifications', () => deleteWhere(Notification, [{ userId }]));
    await step('pushSubscriptions', () => deleteWhere(PushSubscription, [{ userId }]));

    await step('assistantChat', async () => {
        const ids = await AssistantConversation.find({ userId }).distinct('_id');
        const msgs = await deleteWhere(AssistantMessage, [{ conversationId: { $in: ids } }, { userId }]);
        const convs = await deleteWhere(AssistantConversation, [{ userId }]);
        return { messages: msgs, conversations: convs };
    });

    await step('adminSupportChat', async () => {
        const ids = await AdminConversation.find({ userId }).distinct('_id');
        const msgs = await deleteWhere(AdminMessage, [
            { conversationId: { $in: ids } },
            { senderId: userId },
            { userId },
            ...(isCreator ? [{ creatorId: profileId }] : []),
        ]);
        const convs = await deleteWhere(AdminConversation, [{ userId }]);
        return { messages: msgs, conversations: convs };
    });

    await step('images', async () => {
        const a = await destroyImage(photoUrl).catch((e) => { throw e; });
        const b = await destroyImage(screenshotUrl);
        return a + b;
    });

    // --- role-specific ---
    if (isCreator) {
        await step('applications', () => deleteWhere(Application, [{ creatorId: profileId }]));
        await step('reviewsAboutCreator', () => deleteWhere(Review, [{ creatorId: profileId }]));
        await step('removedFromBrandSavedLists', async () => {
            const r = await Brand.updateMany({ savedCreators: profileId }, { $pull: { savedCreators: profileId } });
            return r.modifiedCount;
        });
        await step('deliveryContactDetails', async () => {
            const r = await Message.updateMany(
                { senderId: userId, type: 'delivery' },
                { $set: { 'delivery.whatsappNumber': '', 'delivery.email': '' } }
            );
            return r.modifiedCount;
        });
        await step('anonymiseCreatorProfile', async () => {
            await Creator.updateOne({ _id: profileId }, {
                $set: {
                    name: 'Deleted user',
                    profilePhoto: '',
                    bio: '',
                    location: { city: '', state: '' },
                    categories: [],
                    languages: [],
                    instagram: blankInstagram({
                        avgReach: 0, avgLikes: 0, avgViews: 0, avgComments: 0,
                        avgSaved: 0, avgShares: 0, engagementRate: 0, tokenRefreshedAt: new Date(),
                    }),
                    pricing: { reel: 0, post: 0, story: 0, ugcCollab: 0, ugcNonCollab: 0 },
                    barterEnabled: false,
                    isOpenForCollab: false,
                    insightScreenshot: '',
                    isAdminVerified: false,
                    sampleContentLinks: [],
                    bankDetails: { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', isVerified: false },
                    qualityScore: 0,
                    avgRating: 0,
                    reviewCount: 0,
                },
                $unset: { gender: '' },
            });
            return 1;
        });
    } else {
        await step('closeCampaigns', async () => {
            const r = await Opening.updateMany({ brandId: profileId, status: { $ne: 'closed' } }, { $set: { status: 'closed' } });
            return r.modifiedCount;
        });
        await step('reviewsWrittenByBrand', async () => {
            if (!convIds.length) return 0;
            const r = await Review.updateMany({ conversationId: { $in: convIds } }, { $set: { brandName: 'Deleted brand' } });
            return r.modifiedCount;
        });
        await step('anonymiseBrandProfile', async () => {
            await Brand.updateOne({ _id: profileId }, {
                $set: {
                    brandName: 'Deleted brand',
                    logo: '',
                    website: '',
                    description: '',
                    category: 'other',
                    location: { city: '', state: '' },
                    instagram: blankInstagram({ profilePicUrl: '', isVerified: false }),
                    savedCreators: [],
                },
            });
            return 1;
        });
    }

    await DeletedAccount.updateOne({ _id: record._id }, { $set: { cleanupLog: report, cleanupFailed: failed } });
    console.log(`[DELETE ACCOUNT] ${role} ${userId} deleted. Failed steps: ${failed.length ? failed.join(', ') : 'none'}`);

    return { ok: failed.length === 0, failed };
}

module.exports = { getBlockers, deleteAccount, maskEmail, DELETED_EMAIL_DOMAIN };