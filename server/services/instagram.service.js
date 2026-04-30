const axios = require('axios');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// encrypt Instagram token before saving to DB
const encryptToken = (token) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(token),
    cipher.final(),
  ]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// decrypt token before using in API call
const decryptToken = (stored) => {
  const [ivHex, encHex] = stored.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString();
};

// get basic profile — used for brands
const getBasicProfile = async (accessToken) => {
  const res = await axios.get('https://graph.instagram.com/me', {
    params: {
      fields: 'username,followers_count,profile_picture_url',
      access_token: accessToken,
    },
  });
  return {
    username: res.data.username,
    followersCount: res.data.followers_count,
    profilePicUrl: res.data.profile_picture_url || '',
  };
};

// get creator insights — used for creators
const getCreatorInsights = async (accessToken, igUserId) => {
  const base = 'https://graph.instagram.com';

  // get followers count
  const profileRes = await axios.get(`${base}/${igUserId}`, {
    params: {
      fields: 'followers_count',
      access_token: accessToken,
    },
  });

  // get recent 12 media for avg likes
  const mediaRes = await axios.get(`${base}/${igUserId}/media`, {
    params: {
      fields: 'like_count,comments_count,media_type',
      limit: 12,
      access_token: accessToken,
    },
  });

  const media = mediaRes.data.data || [];
  const avgLikes = media.length
    ? Math.round(
        media.reduce((sum, m) => sum + (m.like_count || 0), 0) / media.length
      )
    : 0;

  const followersCount = profileRes.data.followers_count || 0;
  const engagementRate =
    followersCount > 0
      ? parseFloat(((avgLikes / followersCount) * 100).toFixed(2))
      : 0;

  return {
    followersCount,
    avgLikes,
    avgViews: 0,
    avgReach: 0,
    engagementRate,
  };
};

// refresh token before 60 day expiry
const refreshToken = async (accessToken) => {
  const res = await axios.get(
    'https://graph.instagram.com/refresh_access_token',
    {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: accessToken,
      },
    }
  );
  return res.data.access_token;
};

module.exports = {
  encryptToken,
  decryptToken,
  getBasicProfile,
  getCreatorInsights,
  refreshToken,
};