
// const axios = require('axios');
// const Creator = require('../models/Creator');
// const Brand = require('../models/Brand');
// const { encryptToken, decryptToken } = require('../services/instagram.service');

// const getAuthUrl = (req, res) => {
//   const scope = [
//     'instagram_basic',
//     'pages_show_list',
//     'pages_read_engagement',
//     'business_management',
//   ].join(',');

//   const authUrl =
//     `https://www.facebook.com/v19.0/dialog/oauth` +
//     `?client_id=${process.env.FACEBOOK_APP_ID}` +
//     `&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}` +
//     `&scope=${scope}` +
//     `&response_type=code`;

//   res.json({ url: authUrl });
// };

// const calculateReelMetrics = async (igUserId, pageAccessToken) => {
//   try {
//     console.log('[METRICS] Fetching media for igUserId:', igUserId);

//     const mediaRes = await axios.get(
//       `https://graph.facebook.com/v19.0/${igUserId}/media`,
//       {
//         params: {
//           fields: 'id,media_type,like_count,comments_count,timestamp',
//           limit: 50,
//           access_token: pageAccessToken,
//         },
//       }
//     );

//     const allMedia = mediaRes.data.data || [];
//     console.log('[METRICS] Total media fetched:', allMedia.length);
//     console.log('[METRICS] Media types:', allMedia.map(p => p.media_type));

//     const reelsOnly = allMedia.filter((post) => 
//   post.media_type === 'REEL' || post.media_type === 'VIDEO'
// );
//     console.log('[METRICS] Reels only:', reelsOnly.length);

//     const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
//     const eligibleReels = reelsOnly.filter(
//       (post) => new Date(post.timestamp) < fortyEightHoursAgo
//     );
//     console.log('[METRICS] Eligible reels (>48h old):', eligibleReels.length);

//     const reelsToAnalyse = eligibleReels.slice(0, 20);
//     console.log('[METRICS] Reels to analyse:', reelsToAnalyse.length);

//     if (reelsToAnalyse.length === 0) {
//       console.log('[METRICS] No eligible reels — returning zeros');
//       return {
//         avgLikes: 0, avgComments: 0, avgReach: 0,
//         avgViews: 0, avgSaved: 0, avgShares: 0,
//         reelsAnalysed: 0,
//       };
//     }

//     const insightPromises = reelsToAnalyse.map(async (post) => {
//       try {
//         const insightRes = await axios.get(
//           `https://graph.facebook.com/v19.0/${post.id}/insights`,
//           {
//             params: {
//               metric: 'reach,saved,shares,views',
//               access_token: pageAccessToken,
//             },
//           }
//         );

//         console.log(`[METRICS] Reel ${post.id} raw insights:`, JSON.stringify(insightRes.data.data));

//         const insights = {};
//         insightRes.data.data.forEach((item) => {
//           insights[item.name] = item.values[0]?.value || 0;
//         });

//         console.log(`[METRICS] Reel ${post.id} parsed:`, insights);

//         return {
//           ...post,
//           reach: insights.reach || 0,
//           saved: insights.saved || 0,
//           shares: insights.shares || 0,
//           views: insights.views || 0,
//         };
//       } catch (err) {
//         console.error(`[METRICS] Insight fetch failed for reel ${post.id}:`, err.response?.data || err.message);
//         return { ...post, reach: 0, saved: 0, shares: 0, views: 0 };
//       }
//     });

//     const reelsWithInsights = await Promise.all(insightPromises);

//     let totalLikes = 0, totalComments = 0, totalReach = 0;
//     let totalViews = 0, totalSaved = 0, totalShares = 0;

//     reelsWithInsights.forEach((post) => {
//       totalLikes += post.like_count || 0;
//       totalComments += post.comments_count || 0;
//       totalReach += post.reach || 0;
//       totalViews += post.views || 0;
//       totalSaved += post.saved || 0;
//       totalShares += post.shares || 0;
//     });

//     const count = reelsWithInsights.length;
//     const avgLikes = Math.round(totalLikes / count);
//     const avgComments = Math.round(totalComments / count);
//     const avgReach = Math.round(totalReach / count);
//     const avgViews = Math.round(totalViews / count);
//     const avgSaved = Math.round(totalSaved / count);
//     const avgShares = Math.round(totalShares / count);

//     console.log('[METRICS] Final averages:', {
//       avgLikes, avgComments, avgReach, avgViews, avgSaved, avgShares, count
//     });

//     return {
//       avgLikes, avgComments, avgReach,
//       avgViews, avgSaved, avgShares,
//       reelsAnalysed: count,
//     };
//   } catch (err) {
//     console.error('[METRICS] calculateReelMetrics failed:', err.response?.data || err.message);
//     return {
//       avgLikes: 0, avgComments: 0, avgReach: 0,
//       avgViews: 0, avgSaved: 0, avgShares: 0,
//       reelsAnalysed: 0,
//     };
//   }
// };

// const calculateEngagementRate = (metrics, followersCount) => {
//   if (!followersCount) return 0;
//   return parseFloat((
//     ((metrics.avgLikes + metrics.avgComments + metrics.avgSaved + metrics.avgShares) / followersCount) * 100
//   ).toFixed(2));
// };

// const connectInstagram = async (req, res) => {
//   const { code } = req.body;

//   if (!code) {
//     return res.status(400).json({ message: 'Authorization code is required' });
//   }

//   try {
//     const tokenResponse = await axios.get(
//       'https://graph.facebook.com/v19.0/oauth/access_token',
//       {
//         params: {
//           client_id: process.env.FACEBOOK_APP_ID,
//           client_secret: process.env.FACEBOOK_APP_SECRET,
//           redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
//           code,
//         },
//       }
//     );

//     const shortLivedToken = tokenResponse.data.access_token;
//     console.log('[CONNECT] Short lived token received');

//     const longTokenResponse = await axios.get(
//       'https://graph.facebook.com/v19.0/oauth/access_token',
//       {
//         params: {
//           grant_type: 'fb_exchange_token',
//           client_id: process.env.FACEBOOK_APP_ID,
//           client_secret: process.env.FACEBOOK_APP_SECRET,
//           fb_exchange_token: shortLivedToken,
//         },
//       }
//     );

//     const longLivedToken = longTokenResponse.data.access_token;
//     console.log('[CONNECT] Long lived token received');

//     const pagesResponse = await axios.get(
//       'https://graph.facebook.com/v19.0/me/accounts',
//       { params: { access_token: longLivedToken } }
//     );

//     const pages = pagesResponse.data.data || [];
//     console.log('[CONNECT] Pages found:', pages.length);

//     if (pages.length === 0) {
//       return res.status(400).json({
//         message: 'No Facebook Pages found. Please create a Facebook Page and connect your Instagram to it.',
//       });
//     }

//     const pagePromises = pages.map(async (page) => {
//       try {
//         const pageRes = await axios.get(
//           `https://graph.facebook.com/v19.0/${page.id}`,
//           {
//             params: {
//               fields: 'instagram_business_account,name',
//               access_token: page.access_token,
//             },
//           }
//         );

//         const igData = pageRes.data.instagram_business_account;
//         console.log(`[CONNECT] Page: ${pageRes.data.name}, IG connected: ${!!igData}`);

//         if (igData) {
//           const igDetails = await axios.get(
//             `https://graph.facebook.com/v19.0/${igData.id}`,
//             {
//               params: {
//                 fields: 'id,username,biography,profile_picture_url,followers_count,media_count',
//                 access_token: page.access_token,
//               },
//             }
//           );

//           return {
//             pageId: page.id,
//             pageName: pageRes.data.name,
//             instagramId: igData.id,
//             username: igDetails.data.username,
//             profilePicture: igDetails.data.profile_picture_url || '',
//             followersCount: igDetails.data.followers_count || 0,
//             pageAccessToken: page.access_token,
//           };
//         }
//       } catch (err) {
//         console.error(`[CONNECT] Error for page ${page.id}:`, err.message);
//       }
//       return null;
//     });

//     const results = await Promise.all(pagePromises);
//     const validAccounts = results.filter((a) => a !== null);

//     if (validAccounts.length === 0) {
//       return res.status(400).json({
//         message: 'No Instagram Business account found connected to your Facebook Page.',
//       });
//     }

//     if (validAccounts.length === 1) {
//       const igAccount = validAccounts[0];
//       console.log('[CONNECT] Single account found:', igAccount.username);

//       const metrics = await calculateReelMetrics(igAccount.instagramId, igAccount.pageAccessToken);
//       console.log('[CONNECT] Metrics returned:', metrics);

//       const engagementRate = calculateEngagementRate(metrics, igAccount.followersCount);
//       console.log('[CONNECT] Engagement rate:', engagementRate);

//       const encryptedToken = encryptToken(igAccount.pageAccessToken);

//       if (req.user.role === 'creator') {
//         const updated = await Creator.findOneAndUpdate(
//           { userId: req.user.id },
//           {
//             'instagram.handle': igAccount.username,
//             'instagram.userId': igAccount.instagramId,
//             'instagram.accessToken': encryptedToken,
//             'instagram.followersCount': igAccount.followersCount,
//             'instagram.avgLikes': metrics.avgLikes,
//             'instagram.avgComments': metrics.avgComments,
//             'instagram.avgReach': metrics.avgReach,
//             'instagram.avgViews': metrics.avgViews,
//             'instagram.avgSaved': metrics.avgSaved,
//             'instagram.avgShares': metrics.avgShares,
//             'instagram.engagementRate': engagementRate,
//             'instagram.isConnected': true,
//             'instagram.lastSynced': new Date(),
//             'instagram.tokenRefreshedAt': new Date(),
//           },
//           { new: true }
//         );
//         console.log('[CONNECT] Saved to DB - avgViews:', updated?.instagram?.avgViews, 'engagementRate:', updated?.instagram?.engagementRate);
//       } else if (req.user.role === 'brand') {
//         await Brand.findOneAndUpdate(
//           { userId: req.user.id },
//           {
//             'instagram.handle': igAccount.username,
//             'instagram.userId': igAccount.instagramId,
//             'instagram.accessToken': encryptedToken,
//             'instagram.followersCount': igAccount.followersCount,
//             'instagram.profilePicUrl': igAccount.profilePicture,
//             'instagram.isVerified': true,
//             'instagram.tokenRefreshedAt': new Date(),
//           },
//           { new: true }
//         );
//       }

//       return res.json({
//         message: 'Instagram connected successfully',
//         requiresSelection: false,
//         instagram: {
//           handle: igAccount.username,
//           followersCount: igAccount.followersCount,
//           engagementRate,
//         },
//       });
//     }

//     return res.json({
//       requiresSelection: true,
//       accounts: validAccounts.map((a) => ({
//         instagramId: a.instagramId,
//         username: a.username,
//         profilePicture: a.profilePicture,
//         followersCount: a.followersCount,
//         pageAccessToken: a.pageAccessToken,
//         pageName: a.pageName,
//       })),
//     });
//   } catch (error) {
//     console.error('[CONNECT] Error:', error.response?.data || error.message);
//     res.status(500).json({ message: 'Failed to connect Instagram' });
//   }
// };

// const syncInstagram = async (req, res) => {
//   try {
//     if (req.user.role === 'creator') {
//       const creator = await Creator.findOne({ userId: req.user.id });
//       if (!creator?.instagram?.isConnected) {
//         return res.status(400).json({ message: 'Instagram not connected' });
//       }

//       const accessToken = decryptToken(creator.instagram.accessToken);
//       const igUserId = creator.instagram.userId;

//       console.log('[SYNC] Syncing creator igUserId:', igUserId);

//       const profileRes = await axios.get(
//         `https://graph.facebook.com/v19.0/${igUserId}`,
//         { params: { fields: 'followers_count', access_token: accessToken } }
//       );
//       const followersCount = profileRes.data.followers_count || 0;
//       console.log('[SYNC] Followers count:', followersCount);

//       const metrics = await calculateReelMetrics(igUserId, accessToken);
//       console.log('[SYNC] Metrics:', metrics);

//       const engagementRate = calculateEngagementRate(metrics, followersCount);
//       console.log('[SYNC] Engagement rate:', engagementRate);

//       const updated = await Creator.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.followersCount': followersCount,
//           'instagram.avgLikes': metrics.avgLikes,
//           'instagram.avgComments': metrics.avgComments,
//           'instagram.avgReach': metrics.avgReach,
//           'instagram.avgViews': metrics.avgViews,
//           'instagram.avgSaved': metrics.avgSaved,
//           'instagram.avgShares': metrics.avgShares,
//           'instagram.engagementRate': engagementRate,
//           'instagram.lastSynced': new Date(),
//         },
//         { new: true }
//       );

//       console.log('[SYNC] Saved - avgViews:', updated?.instagram?.avgViews, 'engagementRate:', updated?.instagram?.engagementRate);

//       return res.json({ message: 'Instagram synced successfully' });
//     }

//     if (req.user.role === 'brand') {
//       const brand = await Brand.findOne({ userId: req.user.id });
//       if (!brand?.instagram?.isVerified) {
//         return res.status(400).json({ message: 'Instagram not connected' });
//       }

//       const accessToken = decryptToken(brand.instagram.accessToken);
//       const profileRes = await axios.get(
//         `https://graph.facebook.com/v19.0/${brand.instagram.userId}`,
//         {
//           params: {
//             fields: 'username,followers_count,profile_picture_url',
//             access_token: accessToken,
//           },
//         }
//       );

//       await Brand.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.followersCount': profileRes.data.followers_count || 0,
//           'instagram.profilePicUrl': profileRes.data.profile_picture_url || '',
//         }
//       );

//       return res.json({ message: 'Instagram synced successfully' });
//     }
//   } catch (error) {
//     console.error('[SYNC] Error:', error.message);
//     res.status(500).json({ message: 'Failed to sync Instagram' });
//   }
// };

// const disconnectInstagram = async (req, res) => {
//   try {
//     if (req.user.role === 'creator') {
//       await Creator.findOneAndUpdate(
//         { userId: req.user.id },
//         { 'instagram.accessToken': '', 'instagram.isConnected': false, 'instagram.userId': '' }
//       );
//     } else if (req.user.role === 'brand') {
//       await Brand.findOneAndUpdate(
//         { userId: req.user.id },
//         { 'instagram.accessToken': '', 'instagram.isVerified': false, 'instagram.userId': '' }
//       );
//     }
//     res.json({ message: 'Instagram disconnected' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// const selectInstagramAccount = async (req, res) => {
//   const { instagramId, username, profilePicture, followersCount, pageAccessToken } = req.body;

//   if (!instagramId || !pageAccessToken) {
//     return res.status(400).json({ message: 'Instagram account data is required' });
//   }

//   try {
//     console.log('[SELECT] Selecting account:', username, 'igId:', instagramId);

//     const metrics = await calculateReelMetrics(instagramId, pageAccessToken);
//     console.log('[SELECT] Metrics:', metrics);

//     const engagementRate = calculateEngagementRate(metrics, followersCount);
//     console.log('[SELECT] Engagement rate:', engagementRate);

//     const encryptedToken = encryptToken(pageAccessToken);

//     if (req.user.role === 'creator') {
//       const updated = await Creator.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.handle': username,
//           'instagram.userId': instagramId,
//           'instagram.accessToken': encryptedToken,
//           'instagram.followersCount': followersCount,
//           'instagram.avgLikes': metrics.avgLikes,
//           'instagram.avgComments': metrics.avgComments,
//           'instagram.avgReach': metrics.avgReach,
//           'instagram.avgViews': metrics.avgViews,
//           'instagram.avgSaved': metrics.avgSaved,
//           'instagram.avgShares': metrics.avgShares,
//           'instagram.engagementRate': engagementRate,
//           'instagram.isConnected': true,
//           'instagram.lastSynced': new Date(),
//           'instagram.tokenRefreshedAt': new Date(),
//         },
//         { new: true }
//       );
//       console.log('[SELECT] Saved - avgViews:', updated?.instagram?.avgViews, 'engagementRate:', updated?.instagram?.engagementRate);
//     } else if (req.user.role === 'brand') {
//       await Brand.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.handle': username,
//           'instagram.userId': instagramId,
//           'instagram.accessToken': encryptedToken,
//           'instagram.followersCount': followersCount,
//           'instagram.profilePicUrl': profilePicture || '',
//           'instagram.isVerified': true,
//           'instagram.tokenRefreshedAt': new Date(),
//         },
//         { new: true }
//       );
//     }

//     res.json({
//       message: 'Instagram connected successfully',
//       instagram: { handle: username, followersCount, engagementRate },
//     });
//   } catch (error) {
//     console.error('[SELECT] Error:', error.response?.data || error.message);
//     res.status(500).json({ message: 'Failed to connect Instagram account' });
//   }
// };

// module.exports = {
//   getAuthUrl,
//   connectInstagram,
//   syncInstagram,
//   disconnectInstagram,
//   selectInstagramAccount,
// };


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
      `https://graph.instagram.com/v21.0/${igUserId}/media`,
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
    let tL=0,tC=0,tR=0,tV=0,tS=0,tSh=0;
    reelsWithInsights.forEach(p => { tL+=p.like_count||0; tC+=p.comments_count||0; tR+=p.reach||0; tV+=p.views||0; tS+=p.saved||0; tSh+=p.shares||0; });
    const count = reelsWithInsights.length;
    const metrics = {
      avgLikes: Math.round(tL/count), avgComments: Math.round(tC/count),
      avgReach: Math.round(tR/count), avgViews: Math.round(tV/count),
      avgSaved: Math.round(tS/count), avgShares: Math.round(tSh/count),
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
    try {
      const longTokenRes = await axios.get('https://graph.instagram.com/access_token', {
        params: { grant_type: 'ig_exchange_token', client_secret: process.env.INSTAGRAM_APP_SECRET, access_token: shortToken }
      });
      longToken = longTokenRes.data.access_token || shortToken;
      console.log('[CONNECT] Long-lived token received');
    } catch (err) {
      console.log('[CONNECT] Long token failed, using short token:', err.response?.data?.error?.message);
    }
    console.log('[CONNECT] Using igUserId for profile fetch:', igUserId, typeof igUserId); //temporary debug line
    const profileRes = await axios.get(`https://graph.instagram.com/v21.0/${igUserId}`, {
      params: { fields: 'id,username,followers_count,profile_picture_url', access_token: longToken }
    });
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
      const profileRes = await axios.get(`https://graph.instagram.com/v21.0/${igUserId}`, {
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
      await Creator.findOneAndUpdate({ userId: req.user.id }, { 'instagram.accessToken': '', 'instagram.isConnected': false, 'instagram.userId': '' });
    } else if (req.user.role === 'brand') {
      await Brand.findOneAndUpdate({ userId: req.user.id }, { 'instagram.accessToken': '', 'instagram.isVerified': false, 'instagram.userId': '' });
    }
    res.json({ message: 'Instagram disconnected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAuthUrl, connectInstagram, syncInstagram, disconnectInstagram };