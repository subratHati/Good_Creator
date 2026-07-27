const axios = require('axios');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const { encryptToken, decryptToken } = require('../services/instagram.service');

const calculateEngagementRate = (metrics, followersCount) => {
  if (!followersCount) return 0;
  return parseFloat((
    ((metrics.avgLikes + metrics.avgComments + metrics.avgSaved + metrics.avgShares) / followersCount) * 100
  ).toFixed(2));
};

const calculateReelMetrics = async (igUserId, accessToken) => {
  try {
    console.log('[METRICS] Fetching media for igUserId:', igUserId);
    const mediaRes = await axios.get(
      `https://graph.instagram.com/v21.0/me/media`,
      { params: { fields: 'id,media_type,like_count,comments_count,timestamp', limit: 50, access_token: accessToken } }
    );
    const allMedia = mediaRes.data.data || [];
    console.log('[METRICS] Total media fetched:', allMedia.length);
    console.log('[METRICS] Media types:', allMedia.map(p => p.media_type));
    const reelsOnly = allMedia.filter(p => p.media_type === 'REEL' || p.media_type === 'VIDEO');
    console.log('[METRICS] Reels only:', reelsOnly.length);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const eligibleReels = reelsOnly.filter(p => new Date(p.timestamp) < fortyEightHoursAgo);
    const reelsToAnalyse = eligibleReels.slice(0, 20);
    console.log(`[METRICS] Eligible: ${eligibleReels.length}, Analysing: ${reelsToAnalyse.length}`);
    if (reelsToAnalyse.length === 0) {
      return { avgLikes: 0, avgComments: 0, avgReach: 0, avgViews: 0, avgSaved: 0, avgShares: 0, reelsAnalysed: 0 };
    }
    const insightPromises = reelsToAnalyse.map(async (post) => {
      try {
        const insightRes = await axios.get(
          `https://graph.instagram.com/v21.0/${post.id}/insights`,
          { params: { metric: 'reach,saved,shares,views', access_token: accessToken } }
        );
        const insights = {};
        insightRes.data.data.forEach(item => {
          insights[item.name] = item.values?.[0]?.value || item.total_value?.value || 0;
        });
        console.log(`[METRICS] Reel ${post.id}:`, insights);
        return { ...post, reach: insights.reach || 0, saved: insights.saved || 0, shares: insights.shares || 0, views: insights.views || 0 };
      } catch (err) {
        console.error(`[METRICS] Insight failed ${post.id}:`, err.response?.data || err.message);
        return { ...post, reach: 0, saved: 0, shares: 0, views: 0 };
      }
    });
    const reelsWithInsights = await Promise.all(insightPromises);
    let tL = 0, tC = 0, tR = 0, tV = 0, tS = 0, tSh = 0;
    reelsWithInsights.forEach(p => { tL += p.like_count || 0; tC += p.comments_count || 0; tR += p.reach || 0; tV += p.views || 0; tS += p.saved || 0; tSh += p.shares || 0; });
    const count = reelsWithInsights.length;
    const metrics = {
      avgLikes: Math.round(tL / count), avgComments: Math.round(tC / count),
      avgReach: Math.round(tR / count), avgViews: Math.round(tV / count),
      avgSaved: Math.round(tS / count), avgShares: Math.round(tSh / count),
      reelsAnalysed: count,
    };
    console.log('[METRICS] Final:', metrics);
    return metrics;
  } catch (err) {
    console.error('[METRICS] Failed:', err.response?.data || err.message);
    return { avgLikes: 0, avgComments: 0, avgReach: 0, avgViews: 0, avgSaved: 0, avgShares: 0, reelsAnalysed: 0 };
  }
};

const getAuthUrl = (req, res) => {
  const scope = ['instagram_business_basic', 'instagram_business_manage_insights'].join(',');
  const authUrl =
    `https://www.instagram.com/oauth/authorize` +
    `?client_id=${process.env.INSTAGRAM_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${scope}`;
  res.json({ url: authUrl });
};

const connectInstagram = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Authorization code is required' });
  try {
    console.log('[CONNECT] Exchanging code...');
    const tokenRes = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('[CONNECT] Token response:', JSON.stringify(tokenRes.data));
    const tokenData = Array.isArray(tokenRes.data.data) ? tokenRes.data.data[0] : tokenRes.data;
    const shortToken = tokenData.access_token;
    const igUserId = String(tokenData.user_id);
    console.log('[CONNECT] Short token received, igUserId:', igUserId);

    let longToken = shortToken;

    // try long-lived token exchange
    try {
      const longTokenRes = await axios.get(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortToken}`
      );
      longToken = longTokenRes.data.access_token || shortToken;
      console.log('[CONNECT] Long-lived token received');
    } catch (err) {
      console.log('[CONNECT] Long token failed, using short token:', err.response?.data?.error?.message);
    }

    // get profile using Bearer token in URL directly
    const profileRes = await axios.get(
      `https://graph.instagram.com/v21.0/me?fields=id,username,followers_count,profile_picture_url&access_token=${longToken}`
    );

    const profile = profileRes.data;
    console.log('[CONNECT] Profile:', profile.username, 'followers:', profile.followers_count);
    const encryptedToken = encryptToken(longToken);
    const metrics = await calculateReelMetrics(igUserId, longToken);
    const engagementRate = calculateEngagementRate(metrics, profile.followers_count || 0);

    console.log('[CONNECT] Engagement rate:', engagementRate);

    if (req.user.role === 'creator') {

      const updated = await Creator.findOneAndUpdate(
        { userId: req.user.id },
        {
          'instagram.handle': profile.username,
          'instagram.userId': String(igUserId),
          'instagram.accessToken': encryptedToken,
          'instagram.followersCount': profile.followers_count || 0,
          'instagram.avgLikes': metrics.avgLikes,
          'instagram.avgComments': metrics.avgComments,
          'instagram.avgReach': metrics.avgReach,
          'instagram.avgViews': metrics.avgViews,
          'instagram.avgSaved': metrics.avgSaved,
          'instagram.avgShares': metrics.avgShares,
          'instagram.engagementRate': engagementRate,
          'instagram.isConnected': true,
          'instagram.lastSynced': new Date(),
          'instagram.tokenRefreshedAt': new Date(),
          ...(profile.profile_picture_url ? { profilePhoto: profile.profile_picture_url } : {}),
        },
        { new: true }
      );
      console.log('[CONNECT] Saved — avgViews:', updated?.instagram?.avgViews, 'engagementRate:', updated?.instagram?.engagementRate);
    } else if (req.user.role === 'brand') {
      await Brand.findOneAndUpdate(
        { userId: req.user.id },
        {
          'instagram.handle': profile.username,
          'instagram.userId': String(igUserId),
          'instagram.accessToken': encryptedToken,
          'instagram.followersCount': profile.followers_count || 0,
          'instagram.profilePicUrl': profile.profile_picture_url || '',
          'instagram.isVerified': true,
          'instagram.tokenRefreshedAt': new Date(),
        },
        { new: true }
      );
    }
    return res.json({
      message: 'Instagram connected successfully',
      requiresSelection: false,
      instagram: { handle: profile.username, followersCount: profile.followers_count || 0, engagementRate },
    });
  } catch (error) {
    console.error('[CONNECT] Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to connect Instagram' });
  }
};

const addManualStats = async (req, res) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ message: 'Only creators can add manual Instagram stats' });
  }

  const { followersCount, reelViews } = req.body;

  if (followersCount === undefined || followersCount === null) {
    return res.status(400).json({ message: 'Followers count is required' });
  }
  if (!Number.isFinite(Number(followersCount)) || Number(followersCount) < 0) {
    return res.status(400).json({ message: 'Followers count must be a valid positive number' });
  }

  if (!Array.isArray(reelViews) || reelViews.length !== 5) {
    return res.status(400).json({ message: 'Please provide view counts for exactly 5 reels' });
  }

  const parsedViews = reelViews.map(v => Number(v));
  if (parsedViews.some(v => !Number.isFinite(v) || v < 0)) {
    return res.status(400).json({ message: 'All reel view counts must be valid positive numbers' });
  }

  const avgViews = Math.round(parsedViews.reduce((sum, v) => sum + v, 0) / parsedViews.length);

  try {
    const updated = await Creator.findOneAndUpdate(
      { userId: req.user.id },
      {
        'instagram.followersCount': Number(followersCount),
        'instagram.avgViews': avgViews,
        'instagram.isManuallyAdded': true,
        'instagram.isConnected': false,
        'instagram.lastSynced': new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Creator profile not found' });
    }

    res.json({
      message: 'Instagram stats added successfully',
      instagram: {
        followersCount: updated.instagram.followersCount,
        avgViews: updated.instagram.avgViews,
        isManuallyAdded: updated.instagram.isManuallyAdded,
      },
    });
  } catch (error) {
    console.error('[MANUAL STATS] Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const syncInstagram = async (req, res) => {
  try {
    if (req.user.role === 'creator') {
      const creator = await Creator.findOne({ userId: req.user.id });
      if (!creator?.instagram?.isConnected) return res.status(400).json({ message: 'Instagram not connected' });
      const accessToken = decryptToken(creator.instagram.accessToken);
      const igUserId = creator.instagram.userId;
      console.log('[SYNC] Syncing igUserId:', igUserId);
      let freshToken = accessToken;
      try {
        const refreshRes = await axios.get('https://graph.instagram.com/refresh_access_token', {
          params: { grant_type: 'ig_refresh_token', access_token: accessToken }
        });
        freshToken = refreshRes.data.access_token || accessToken;
        console.log('[SYNC] Token refreshed');
      } catch { console.log('[SYNC] Token refresh failed, using existing'); }
      const profileRes = await axios.get(`https://graph.instagram.com/v21.0/me`, {
        params: { fields: 'followers_count', access_token: freshToken }
      });
      const followersCount = profileRes.data.followers_count || 0;
      const metrics = await calculateReelMetrics(igUserId, freshToken);
      const engagementRate = calculateEngagementRate(metrics, followersCount);
      const updated = await Creator.findOneAndUpdate(
        { userId: req.user.id },
        {
          'instagram.accessToken': encryptToken(freshToken),
          'instagram.followersCount': followersCount,
          'instagram.avgLikes': metrics.avgLikes,
          'instagram.avgComments': metrics.avgComments,
          'instagram.avgReach': metrics.avgReach,
          'instagram.avgViews': metrics.avgViews,
          'instagram.avgSaved': metrics.avgSaved,
          'instagram.avgShares': metrics.avgShares,
          'instagram.engagementRate': engagementRate,
          'instagram.lastSynced': new Date(),
          'instagram.tokenRefreshedAt': new Date(),
        },
        { new: true }
      );
      console.log('[SYNC] Done — avgViews:', updated?.instagram?.avgViews, 'engagementRate:', updated?.instagram?.engagementRate);
      return res.json({ message: 'Instagram synced successfully' });
    }
    if (req.user.role === 'brand') {
      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand?.instagram?.isVerified) return res.status(400).json({ message: 'Instagram not connected' });
      const accessToken = decryptToken(brand.instagram.accessToken);
      const profileRes = await axios.get(`https://graph.instagram.com/v21.0/${brand.instagram.userId}`, {
        params: { fields: 'username,followers_count,profile_picture_url', access_token: accessToken }
      });
      await Brand.findOneAndUpdate({ userId: req.user.id }, {
        'instagram.followersCount': profileRes.data.followers_count || 0,
        'instagram.profilePicUrl': profileRes.data.profile_picture_url || '',
      });
      return res.json({ message: 'Instagram synced successfully' });
    }
  } catch (error) {
    console.error('[SYNC] Error:', error.message);
    res.status(500).json({ message: 'Failed to sync Instagram' });
  }
};

const disconnectInstagram = async (req, res) => {
  try {
    if (req.user.role === 'creator') {
      await Creator.findOneAndUpdate({ userId: req.user.id }, {
        'instagram.accessToken': '',
        'instagram.isConnected': false,
        'instagram.userId': '',
        'instagram.handle': '',
        'instagram.followersCount': 0,
        'instagram.engagementRate': null,
        'instagram.avgViews': 0,
        'instagram.avgLikes': 0,
        'instagram.avgComments': 0,
        'instagram.avgShares': 0,
        'instagram.avgReach': 0,
        'profilePhoto': '',
      });
    } else if (req.user.role === 'brand') {
      await Brand.findOneAndUpdate({ userId: req.user.id }, {
        'instagram.accessToken': '',
        'instagram.isVerified': false,
        'instagram.userId': '',
        'instagram.handle': '',
        'instagram.followersCount': 0,
      });
    }
    res.json({ message: 'Instagram disconnected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAuthUrl, connectInstagram, addManualStats, syncInstagram, disconnectInstagram };