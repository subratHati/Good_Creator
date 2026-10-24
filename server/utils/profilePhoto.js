const axios = require('axios');
const Creator = require('../models/Creator');
const cloudinaryModule = require('../config/cloudinary');

// works whichever way config/cloudinary.js exports it
const getUploader = () => {
  const c = cloudinaryModule.v2 || cloudinaryModule.cloudinary || cloudinaryModule;
  return c && c.uploader ? c.uploader : null;
};

const isInstagramHost = (url) => /cdninstagram\.com|fbcdn\.net/i.test(String(url || ''));

// true only when the creator has no photo, or just a temporary Instagram link: never overwrite their own photo
const canFillFromInstagram = (current) => !current || isInstagramHost(current);

// a photo that came from Instagram: a temporary Instagram link, or our permanent copy of it
const isInstagramPhoto = (url) => isInstagramHost(url) || /\/goodcreator\/profile\/ig_/.test(String(url || ''));

// copy an Instagram picture into our own storage, so the link never expires
const copyToCloudinary = async (url, creatorId) => {
  const uploader = getUploader();
  if (!uploader || !url) return '';
  const options = {
    folder: 'goodcreator/profile',
    public_id: `ig_${creatorId}`,
    overwrite: true,
    resource_type: 'image',
  };
  try {
    const res = await uploader.upload(url, options);
    return res.secure_url || '';
  } catch (firstErr) {
    // Cloudinary could not fetch the link itself: download it here and upload the bytes
    try {
      const img = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      const mime = String(img.headers['content-type'] || 'image/jpeg').split(';')[0];
      if (!mime.startsWith('image/')) return '';
      const res = await uploader.upload(`data:${mime};base64,${Buffer.from(img.data).toString('base64')}`, options);
      return res.secure_url || '';
    } catch (err) {
      console.error('[PHOTO] copy failed:', err.message);
      return '';
    }
  }
};

// on connect: fill the profile photo ONLY when the creator has none (or only a dead temporary Instagram link)
const photoForConnect = async (userId, igUrl) => {
  if (!igUrl) return {};
  const creator = await Creator.findOne({ userId }).select('_id profilePhoto').lean();
  if (!creator) return {};
  if (!canFillFromInstagram(creator.profilePhoto)) return {}; // keep their own photo
  const permanent = await copyToCloudinary(igUrl, creator._id);
  return permanent ? { profilePhoto: permanent } : {};
};

module.exports = { photoForConnect, copyToCloudinary, getUploader, isInstagramHost, isInstagramPhoto, canFillFromInstagram };