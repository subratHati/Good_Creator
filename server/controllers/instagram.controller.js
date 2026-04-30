// const axios = require('axios');
// const Creator = require('../models/Creator');
// const Brand = require('../models/Brand');
// const {
//   encryptToken,
//   decryptToken,
//   getBasicProfile,
//   getCreatorInsights,
// } = require('../services/instagram.service');

// // GET /api/instagram/auth-url
// const getAuthUrl = (req, res) => {
//   const scope = [
//     'instagram_basic',
//     'instagram_manage_insights',
//     'pages_show_list',
//     'pages_read_engagement',
//   ].join(',');

//   const extras = JSON.stringify({ setup: { channel: 'IG_API_ONBOARDING' } });

//   const authUrl =
//     `https://www.facebook.com/dialog/oauth` +
//     `?client_id=${process.env.INSTAGRAM_APP_ID}` +
//     `&display=page` +
//     `&extras=${encodeURIComponent(extras)}` +
//     `&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}` +
//     `&response_type=token` +
//     `&scope=${scope}`;

//   res.json({ url: authUrl });
// };

// // POST /api/instagram/connect
// // called after frontend completes OAuth and sends the code
// // const connectInstagram = async (req, res) => {
// //   const { code } = req.body;

// //   if (!code) {
// //     return res.status(400).json({ message: 'Authorization code is required' });
// //   }

// //   try {
// //     // step 1 — exchange code for short-lived token
// //     const tokenRes = await axios.post(
// //       'https://api.instagram.com/oauth/access_token',
// //       new URLSearchParams({
// //         client_id: process.env.INSTAGRAM_APP_ID,
// //         client_secret: process.env.INSTAGRAM_APP_SECRET,
// //         grant_type: 'authorization_code',
// //         redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
// //         code,
// //       }),
// //       { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
// //     );

// //     const shortToken = tokenRes.data.access_token;
// //     const igUserId = tokenRes.data.user_id;

// //     // step 2 — exchange short-lived for long-lived token (60 days)
// //     const longTokenRes = await axios.get(
// //       'https://graph.instagram.com/access_token',
// //       {
// //         params: {
// //           grant_type: 'ig_exchange_token',
// //           client_secret: process.env.INSTAGRAM_APP_SECRET,
// //           access_token: shortToken,
// //         },
// //       }
// //     );

// //     const longToken = longTokenRes.data.access_token;
// //     const encryptedToken = encryptToken(longToken);

// //     // step 3 — get basic profile info
// //     const profile = await getBasicProfile(longToken);

// //     // step 4 — save to correct model based on role
// //     if (req.user.role === 'creator') {
// //       // get full insights for creators
// //       const insights = await getCreatorInsights(longToken, igUserId);

// //       await Creator.findOneAndUpdate(
// //         { userId: req.user.id },
// //         {
// //           'instagram.handle': profile.username,
// //           'instagram.userId': igUserId,
// //           'instagram.accessToken': encryptedToken,
// //           'instagram.followersCount': insights.followersCount,
// //           'instagram.avgLikes': insights.avgLikes,
// //           'instagram.avgViews': insights.avgViews,
// //           'instagram.avgReach': insights.avgReach,
// //           'instagram.engagementRate': insights.engagementRate,
// //           'instagram.isConnected': true,
// //           'instagram.lastSynced': new Date(),
// //           'instagram.tokenRefreshedAt': new Date(),
// //         },
// //         { new: true }
// //       );
// //     } else if (req.user.role === 'brand') {
// //       // only basic profile for brands
// //       await Brand.findOneAndUpdate(
// //         { userId: req.user.id },
// //         {
// //           'instagram.handle': profile.username,
// //           'instagram.userId': igUserId,
// //           'instagram.accessToken': encryptedToken,
// //           'instagram.followersCount': profile.followersCount,
// //           'instagram.profilePicUrl': profile.profilePicUrl,
// //           'instagram.isVerified': true,
// //           'instagram.tokenRefreshedAt': new Date(),
// //         },
// //         { new: true }
// //       );
// //     }

// //     res.json({
// //       message: 'Instagram connected successfully',
// //       instagram: {
// //         handle: profile.username,
// //         followersCount: profile.followersCount,
// //       },
// //     });
// //   } catch (error) {
// //     console.error('connectInstagram error:', error.response?.data || error.message);
// //     res.status(500).json({ message: 'Failed to connect Instagram' });
// //   }
// // };
// const connectInstagram = async (req, res) => {
//   const { code } = req.body;

//   if (!code) {
//     return res.status(400).json({ message: 'Authorization code is required' });
//   }

//   try {
//     // exchange code for short-lived token
//     const tokenRes = await axios.post(
//       'https://api.instagram.com/oauth/access_token',
//       new URLSearchParams({
//         client_id: process.env.INSTAGRAM_APP_ID,
//         client_secret: process.env.INSTAGRAM_APP_SECRET,
//         grant_type: 'authorization_code',
//         redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
//         code,
//       }),
//       { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
//     );

//     const shortToken = tokenRes.data.access_token;
//     const igUserId = tokenRes.data.user_id;

//     console.log('Short token received, user id:', igUserId);

//     // exchange for long-lived token
//     const longTokenRes = await axios.get(
//       'https://graph.instagram.com/access_token',
//       {
//         params: {
//           grant_type: 'ig_exchange_token',
//           client_secret: process.env.INSTAGRAM_APP_SECRET,
//           access_token: shortToken,
//         },
//       }
//     );

//     const longToken = longTokenRes.data.access_token;
//     const encryptedToken = encryptToken(longToken);

//     // get profile
//     const profileRes = await axios.get(
//       `https://graph.instagram.com/${igUserId}`,
//       {
//         params: {
//           fields: 'id,username,followers_count,profile_picture_url',
//           access_token: longToken,
//         },
//       }
//     );

//     const profile = profileRes.data;
//     console.log('Profile:', profile);

//     // get insights
//     const insights = await getCreatorInsights(longToken, igUserId);

//     if (req.user.role === 'creator') {
//       await Creator.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.handle': profile.username,
//           'instagram.userId': igUserId,
//           'instagram.accessToken': encryptedToken,
//           'instagram.followersCount': insights.followersCount,
//           'instagram.avgLikes': insights.avgLikes,
//           'instagram.avgViews': insights.avgViews,
//           'instagram.avgReach': insights.avgReach,
//           'instagram.engagementRate': insights.engagementRate,
//           'instagram.isConnected': true,
//           'instagram.lastSynced': new Date(),
//           'instagram.tokenRefreshedAt': new Date(),
//         },
//         { new: true }
//       );
//     } else if (req.user.role === 'brand') {
//       await Brand.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.handle': profile.username,
//           'instagram.userId': String(igUserId),
//           'instagram.accessToken': encryptedToken,
//           'instagram.followersCount': profile.followers_count || 0,
//           'instagram.profilePicUrl': profile.profile_picture_url || '',
//           'instagram.isVerified': true,
//           'instagram.tokenRefreshedAt': new Date(),
//         },
//         { new: true }
//       );
//     }

//     res.json({
//       message: 'Instagram connected successfully',
//       instagram: {
//         handle: profile.username,
//         followersCount: profile.followers_count,
//       },
//     });
//   } catch (error) {
//     console.error('connectInstagram error:', error.response?.data || error.message);
//     res.status(500).json({ message: 'Failed to connect Instagram' });
//   }
// };

// // POST /api/instagram/sync
// // manually trigger a re-sync of Instagram data
// const syncInstagram = async (req, res) => {
//   try {
//     if (req.user.role === 'creator') {
//       const creator = await Creator.findOne({ userId: req.user.id });

//       if (!creator || !creator.instagram.isConnected) {
//         return res.status(400).json({ message: 'Instagram not connected' });
//       }

//       const accessToken = decryptToken(creator.instagram.accessToken);
//       const insights = await getCreatorInsights(
//         accessToken,
//         creator.instagram.userId
//       );

//       await Creator.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.followersCount': insights.followersCount,
//           'instagram.avgLikes': insights.avgLikes,
//           'instagram.avgViews': insights.avgViews,
//           'instagram.avgReach': insights.avgReach,
//           'instagram.engagementRate': insights.engagementRate,
//           'instagram.lastSynced': new Date(),
//         }
//       );

//       return res.json({ message: 'Instagram synced successfully', insights });
//     }

//     if (req.user.role === 'brand') {
//       const brand = await Brand.findOne({ userId: req.user.id });

//       if (!brand || !brand.instagram.isVerified) {
//         return res.status(400).json({ message: 'Instagram not connected' });
//       }

//       const accessToken = decryptToken(brand.instagram.accessToken);
//       const profile = await getBasicProfile(accessToken);

//       await Brand.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.followersCount': profile.followersCount,
//           'instagram.profilePicUrl': profile.profilePicUrl,
//         }
//       );

//       return res.json({ message: 'Instagram synced successfully', profile });
//     }
//   } catch (error) {
//     console.error('syncInstagram error:', error.message);
//     res.status(500).json({ message: 'Failed to sync Instagram' });
//   }
// };

// // POST /api/instagram/disconnect
// const disconnectInstagram = async (req, res) => {
//   try {
//     if (req.user.role === 'creator') {
//       await Creator.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.accessToken': '',
//           'instagram.isConnected': false,
//           'instagram.userId': '',
//         }
//       );
//     } else if (req.user.role === 'brand') {
//       await Brand.findOneAndUpdate(
//         { userId: req.user.id },
//         {
//           'instagram.accessToken': '',
//           'instagram.isVerified': false,
//           'instagram.userId': '',
//         }
//       );
//     }

//     res.json({ message: 'Instagram disconnected' });
//   } catch (error) {
//     console.error('disconnectInstagram error:', error.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// module.exports = { getAuthUrl, connectInstagram, syncInstagram, disconnectInstagram };



const axios = require('axios');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const { encryptToken, decryptToken } = require('../services/instagram.service');

// GET /api/instagram/auth-url
const getAuthUrl = (req, res) => {
  const scope = [
    'instagram_basic',
    'pages_show_list',
    'pages_read_engagement',
    'business_management',
  ].join(',');

  const authUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}` +
    `&scope=${scope}` +
    `&response_type=code`;

  res.json({ url: authUrl });
};

// POST /api/instagram/connect
const connectInstagram = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    // step 1 — exchange code for short-lived token
    const tokenResponse = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
          code,
        },
      }
    );

    const shortLivedToken = tokenResponse.data.access_token;
    console.log('Short lived token received');

    // step 2 — exchange for long-lived token
    const longTokenResponse = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      }
    );

    const longLivedToken = longTokenResponse.data.access_token;
    console.log('Long lived token received');

    // step 3 — get facebook pages
    const pagesResponse = await axios.get(
      'https://graph.facebook.com/v19.0/me/accounts',
      {
        params: { access_token: longLivedToken },
      }
    );

    const pages = pagesResponse.data.data || [];
    console.log('Pages found:', pages.length);

    if (pages.length === 0) {
      return res.status(400).json({
        message: 'No Facebook Pages found. Please create a Facebook Page and connect your Instagram to it.',
      });
    }

    // step 4 — find page with connected instagram
    const pagePromises = pages.map(async (page) => {
      try {
        const pageRes = await axios.get(
          `https://graph.facebook.com/v19.0/${page.id}`,
          {
            params: {
              fields: 'instagram_business_account,name',
              access_token: page.access_token,
            },
          }
        );

        const igData = pageRes.data.instagram_business_account;
        console.log(`Page: ${pageRes.data.name}, IG connected: ${!!igData}`);

        if (igData) {
          const igDetails = await axios.get(
            `https://graph.facebook.com/v19.0/${igData.id}`,
            {
              params: {
                fields: 'id,username,biography,profile_picture_url,followers_count,media_count',
                access_token: page.access_token,
              },
            }
          );

          return {
            pageId: page.id,
            pageName: pageRes.data.name,
            instagramId: igData.id,
            username: igDetails.data.username,
            profilePicture: igDetails.data.profile_picture_url || '',
            followersCount: igDetails.data.followers_count || 0,
            pageAccessToken: page.access_token,
          };
        }
      } catch (err) {
        console.log(`Error for page ${page.id}:`, err.message);
      }
      return null;
    });

    const results = await Promise.all(pagePromises);
    const validAccounts = results.filter((a) => a !== null);

    if (validAccounts.length === 0) {
      return res.status(400).json({
        message: 'No Instagram Business account found connected to your Facebook Page.',
      });
    }

    // use first valid account
    // if only one account — auto connect
    if (validAccounts.length === 1) {
      const igAccount = validAccounts[0];

      const mediaRes = await axios.get(
        `https://graph.facebook.com/v19.0/${igAccount.instagramId}/media`,
        {
          params: {
            fields: 'id,media_type,like_count,comments_count',
            limit: 20,
            access_token: igAccount.pageAccessToken,
          },
        }
      );

      const media = mediaRes.data.data || [];
      let totalLikes = 0;
      media.forEach((post) => { totalLikes += post.like_count || 0; });
      const avgLikes = media.length ? Math.round(totalLikes / media.length) : 0;
      const engagementRate = igAccount.followersCount > 0
        ? parseFloat(((avgLikes / igAccount.followersCount) * 100).toFixed(2))
        : 0;

      const encryptedToken = encryptToken(igAccount.pageAccessToken);

      if (req.user.role === 'creator') {
        await Creator.findOneAndUpdate(
          { userId: req.user.id },
          {
            'instagram.handle': igAccount.username,
            'instagram.userId': igAccount.instagramId,
            'instagram.accessToken': encryptedToken,
            'instagram.followersCount': igAccount.followersCount,
            'instagram.avgLikes': avgLikes,
            'instagram.avgViews': 0,
            'instagram.avgReach': 0,
            'instagram.engagementRate': engagementRate,
            'instagram.isConnected': true,
            'instagram.lastSynced': new Date(),
            'instagram.tokenRefreshedAt': new Date(),
          },
          { new: true }
        );
      } else if (req.user.role === 'brand') {
        await Brand.findOneAndUpdate(
          { userId: req.user.id },
          {
            'instagram.handle': igAccount.username,
            'instagram.userId': igAccount.instagramId,
            'instagram.accessToken': encryptedToken,
            'instagram.followersCount': igAccount.followersCount,
            'instagram.profilePicUrl': igAccount.profilePicture,
            'instagram.isVerified': true,
            'instagram.tokenRefreshedAt': new Date(),
          },
          { new: true }
        );
      }

      return res.json({
        message: 'Instagram connected successfully',
        requiresSelection: false,
        instagram: {
          handle: igAccount.username,
          followersCount: igAccount.followersCount,
          engagementRate,
        },
      });
    }

    // multiple accounts — let user choose
    return res.json({
      requiresSelection: true,
      accounts: validAccounts.map((a) => ({
        instagramId: a.instagramId,
        username: a.username,
        profilePicture: a.profilePicture,
        followersCount: a.followersCount,
        pageAccessToken: a.pageAccessToken,
        pageName: a.pageName,
      })),
    });
  } catch (error) {
    console.error('connectInstagram error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to connect Instagram' });
  }
};

// POST /api/instagram/sync
const syncInstagram = async (req, res) => {
  try {
    if (req.user.role === 'creator') {
      const creator = await Creator.findOne({ userId: req.user.id });
      if (!creator?.instagram?.isConnected) {
        return res.status(400).json({ message: 'Instagram not connected' });
      }

      const accessToken = decryptToken(creator.instagram.accessToken);
      const igUserId = creator.instagram.userId;

      const [profileRes, mediaRes] = await Promise.all([
        axios.get(`https://graph.facebook.com/v19.0/${igUserId}`, {
          params: { fields: 'followers_count', access_token: accessToken },
        }),
        axios.get(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
          params: { fields: 'like_count,media_type', limit: 20, access_token: accessToken },
        }),
      ]);

      const followersCount = profileRes.data.followers_count || 0;
      const media = mediaRes.data.data || [];
      let totalLikes = 0;
      media.forEach((m) => { totalLikes += m.like_count || 0; });
      const avgLikes = media.length ? Math.round(totalLikes / media.length) : 0;
      const engagementRate = followersCount > 0
        ? parseFloat(((avgLikes / followersCount) * 100).toFixed(2))
        : 0;

      await Creator.findOneAndUpdate(
        { userId: req.user.id },
        {
          'instagram.followersCount': followersCount,
          'instagram.avgLikes': avgLikes,
          'instagram.engagementRate': engagementRate,
          'instagram.lastSynced': new Date(),
        }
      );

      return res.json({ message: 'Instagram synced successfully' });
    }

    if (req.user.role === 'brand') {
      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand?.instagram?.isVerified) {
        return res.status(400).json({ message: 'Instagram not connected' });
      }

      const accessToken = decryptToken(brand.instagram.accessToken);
      const profileRes = await axios.get(
        `https://graph.facebook.com/v19.0/${brand.instagram.userId}`,
        {
          params: {
            fields: 'username,followers_count,profile_picture_url',
            access_token: accessToken,
          },
        }
      );

      await Brand.findOneAndUpdate(
        { userId: req.user.id },
        {
          'instagram.followersCount': profileRes.data.followers_count || 0,
          'instagram.profilePicUrl': profileRes.data.profile_picture_url || '',
        }
      );

      return res.json({ message: 'Instagram synced successfully' });
    }
  } catch (error) {
    console.error('syncInstagram error:', error.message);
    res.status(500).json({ message: 'Failed to sync Instagram' });
  }
};

// POST /api/instagram/disconnect
const disconnectInstagram = async (req, res) => {
  try {
    if (req.user.role === 'creator') {
      await Creator.findOneAndUpdate(
        { userId: req.user.id },
        { 'instagram.accessToken': '', 'instagram.isConnected': false, 'instagram.userId': '' }
      );
    } else if (req.user.role === 'brand') {
      await Brand.findOneAndUpdate(
        { userId: req.user.id },
        { 'instagram.accessToken': '', 'instagram.isVerified': false, 'instagram.userId': '' }
      );
    }
    res.json({ message: 'Instagram disconnected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/instagram/select-account
const selectInstagramAccount = async (req, res) => {
  const { instagramId, username, profilePicture, followersCount, pageAccessToken } = req.body;

  if (!instagramId || !pageAccessToken) {
    return res.status(400).json({ message: 'Instagram account data is required' });
  }

  try {
    // get media for avg likes calculation
    const mediaRes = await axios.get(
      `https://graph.facebook.com/v19.0/${instagramId}/media`,
      {
        params: {
          fields: 'id,media_type,like_count,comments_count',
          limit: 20,
          access_token: pageAccessToken,
        },
      }
    );

    const media = mediaRes.data.data || [];
    let totalLikes = 0;
    media.forEach((post) => { totalLikes += post.like_count || 0; });
    const avgLikes = media.length ? Math.round(totalLikes / media.length) : 0;
    const engagementRate = followersCount > 0
      ? parseFloat(((avgLikes / followersCount) * 100).toFixed(2))
      : 0;

    const encryptedToken = encryptToken(pageAccessToken);

    if (req.user.role === 'creator') {
      await Creator.findOneAndUpdate(
        { userId: req.user.id },
        {
          'instagram.handle': username,
          'instagram.userId': instagramId,
          'instagram.accessToken': encryptedToken,
          'instagram.followersCount': followersCount,
          'instagram.avgLikes': avgLikes,
          'instagram.avgViews': 0,
          'instagram.avgReach': 0,
          'instagram.engagementRate': engagementRate,
          'instagram.isConnected': true,
          'instagram.lastSynced': new Date(),
          'instagram.tokenRefreshedAt': new Date(),
        },
        { new: true }
      );
    } else if (req.user.role === 'brand') {
      await Brand.findOneAndUpdate(
        { userId: req.user.id },
        {
          'instagram.handle': username,
          'instagram.userId': instagramId,
          'instagram.accessToken': encryptedToken,
          'instagram.followersCount': followersCount,
          'instagram.profilePicUrl': profilePicture || '',
          'instagram.isVerified': true,
          'instagram.tokenRefreshedAt': new Date(),
        },
        { new: true }
      );
    }

    res.json({
      message: 'Instagram connected successfully',
      instagram: { handle: username, followersCount, engagementRate },
    });
  } catch (error) {
    console.error('selectInstagramAccount error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to connect Instagram account' });
  }
};

module.exports = { getAuthUrl, connectInstagram, syncInstagram, disconnectInstagram, selectInstagramAccount };