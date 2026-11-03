// utils/profileInput.js
//
// The server decides which fields a creator, brand or campaign form may save.
// Only the fields listed here are ever read from the request - everything else
// (verified tick, quality score, rating, follower numbers, Instagram connection,
// bank-verified flag, userId, brandId, ...) is ignored, so nobody can write
// those by adding extra fields to a request.
//
// Each cleaner returns { data } on success or { error: 'message' } on a bad value.
// `data` has the same nested shape as the models; use flatten(data) to turn it
// into dotted keys for a $set update (so saving the city never wipes the state).

const CREATOR_CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'];
const BRAND_CATEGORIES = ['fashion', 'food', 'beauty', 'tech', 'fitness', 'travel', 'education', 'finance', 'lifestyle', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'];
const GENDERS = ['male', 'female', 'other'];
const OPENING_STATUSES = ['active', 'closed', 'draft'];

const MAX_CREATOR_CATEGORIES = 3; // same limit the app screens already enforce

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

// a trimmed string, or null when the value is not a string at all
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : null);

// a number clamped into [min, max], or null when it is not a usable number
const num = (v, min, max) => {
  if (typeof v === 'string' && v.trim() === '') return null;
  if (typeof v !== 'number' && typeof v !== 'string') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
};

// Only http / https links are allowed (a "javascript:" link would run code when
// someone clicks it). A link typed without a scheme gets https:// added.
// Returns '' for empty input, null for an unsafe or invalid link.
const safeUrl = (v, max = 300) => {
  const s = str(v, max);
  if (s === null) return null;
  if (s === '') return '';
  if (/[\s<>"'`\\]/.test(s)) return null;
  if (s.startsWith('/')) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return withScheme;
  } catch {
    return null;
  }
};

const categoryList = (v, allowed) => {
  if (!Array.isArray(v)) return null;
  return [...new Set(v.filter((c) => typeof c === 'string' && allowed.includes(c)))];
};

// nested objects -> dotted keys (arrays and dates stay as they are)
const flatten = (obj, prefix = '', out = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isObject(value) && !(value instanceof Date)) flatten(value, path, out);
    else out[path] = value;
  }
  return out;
};

// ─── creator ─────────────────────────────────────────────────────────────────
const cleanCreatorInput = (body, { isCreate = false } = {}) => {
  const b = isObject(body) ? body : {};
  const data = {};

  if (has(b, 'name')) {
    const name = str(b.name, 100);
    if (!name) return { error: 'Name is required' };
    data.name = name;
  }
  if (isCreate && !data.name) return { error: 'Name is required' };

  if (has(b, 'bio')) {
    const bio = str(b.bio, 300);
    if (bio === null) return { error: 'Bio must be text' };
    data.bio = bio;
  }

  if (has(b, 'location')) {
    if (!isObject(b.location)) return { error: 'Invalid location' };
    const location = {};
    if (has(b.location, 'city')) location.city = str(b.location.city, 100) ?? '';
    if (has(b.location, 'state')) location.state = str(b.location.state, 100) ?? '';
    data.location = location;
  }

  if (has(b, 'categories')) {
    const cats = categoryList(b.categories, CREATOR_CATEGORIES);
    if (!cats || cats.length < 1) return { error: 'Select at least 1 category' };
    if (cats.length > MAX_CREATOR_CATEGORIES) return { error: `Select at most ${MAX_CREATOR_CATEGORIES} categories` };
    data.categories = cats;
  }

  if (has(b, 'gender')) {
    if (!GENDERS.includes(b.gender)) return { error: 'Invalid gender' };
    data.gender = b.gender;
  }

  if (has(b, 'languages')) {
    if (!Array.isArray(b.languages)) return { error: 'Invalid languages' };
    data.languages = [...new Set(b.languages.map((l) => str(l, 30)).filter(Boolean))].slice(0, 10);
  }

  if (has(b, 'pricing')) {
    if (!isObject(b.pricing)) return { error: 'Invalid pricing' };
    const pricing = {};
    for (const key of ['reel', 'post', 'story', 'ugcCollab', 'ugcNonCollab']) {
      if (has(b.pricing, key)) pricing[key] = num(b.pricing[key], 0, 10000000) ?? 0;
    }
    data.pricing = pricing;
  }

  if (has(b, 'barterEnabled') && typeof b.barterEnabled === 'boolean') data.barterEnabled = b.barterEnabled;
  if (has(b, 'isOpenForCollab') && typeof b.isOpenForCollab === 'boolean') data.isOpenForCollab = b.isOpenForCollab;

  if (has(b, 'sampleContentLinks')) {
    if (!Array.isArray(b.sampleContentLinks)) return { error: 'Invalid sample links' };
    const links = [];
    for (const raw of b.sampleContentLinks.slice(0, 10)) {
      const link = safeUrl(raw);
      if (link === null) return { error: 'Sample links must be valid web links (http:// or https://)' };
      if (link) links.push(link);
    }
    data.sampleContentLinks = links;
  }

  return { data };
};

// ─── brand ───────────────────────────────────────────────────────────────────
const cleanBrandInput = (body, { isCreate = false } = {}) => {
  const b = isObject(body) ? body : {};
  const data = {};

  if (has(b, 'brandName')) {
    const brandName = str(b.brandName, 100);
    if (!brandName) return { error: 'Brand name is required' };
    data.brandName = brandName;
  }
  if (isCreate && !data.brandName) return { error: 'Brand name is required' };

  if (has(b, 'description')) {
    const description = str(b.description, 1000);
    if (description === null) return { error: 'Description must be text' };
    data.description = description;
  }

  if (has(b, 'website')) {
    const website = safeUrl(b.website);
    if (website === null) return { error: 'Website must be a valid web link (http:// or https://)' };
    data.website = website;
  }

  if (has(b, 'category')) {
    if (!BRAND_CATEGORIES.includes(b.category)) return { error: 'Invalid category' };
    data.category = b.category;
  }

  if (has(b, 'location')) {
    if (!isObject(b.location)) return { error: 'Invalid location' };
    const location = {};
    if (has(b.location, 'city')) location.city = str(b.location.city, 100) ?? '';
    if (has(b.location, 'state')) location.state = str(b.location.state, 100) ?? '';
    data.location = location;
  }

  // the screen sends this as the dotted key 'instagram.handle'
  const rawHandle = has(b, 'instagram.handle') ? b['instagram.handle'] : (isObject(b.instagram) ? b.instagram.handle : undefined);
  if (rawHandle !== undefined) {
    const handle = (str(rawHandle, 40) ?? '').replace(/^@/, '');
    if (!/^[A-Za-z0-9._]{0,40}$/.test(handle)) return { error: 'Invalid Instagram handle' };
    data.instagram = { handle };
  }

  return { data };
};

// ─── campaign (opening) ──────────────────────────────────────────────────────
const cleanOpeningInput = (body, { isCreate = false } = {}) => {
  const b = isObject(body) ? body : {};
  const data = {};

  if (has(b, 'title')) {
    const title = str(b.title, 150);
    if (!title) return { error: 'Title is required' };
    data.title = title;
  }
  if (isCreate && !data.title) return { error: 'Title is required' };

  if (has(b, 'description')) {
    const description = str(b.description, 3000);
    if (description === null) return { error: 'Description must be text' };
    data.description = description;
  }

  if (has(b, 'deliverables')) {
    if (!isObject(b.deliverables)) return { error: 'Invalid deliverables' };
    const deliverables = {};
    for (const key of ['reels', 'posts', 'stories', 'ugc']) {
      if (has(b.deliverables, key)) deliverables[key] = Math.floor(num(b.deliverables[key], 0, 100) ?? 0);
    }
    data.deliverables = deliverables;
  }

  for (const key of ['isCollab', 'isBarter']) {
    if (has(b, key) && typeof b[key] === 'boolean') data[key] = b[key];
  }
  for (const key of ['budgetMin', 'budgetMax']) {
    if (has(b, key)) data[key] = num(b[key], 0, 100000000) ?? 0;
  }
  if (has(b, 'barterDetails')) data.barterDetails = str(b.barterDetails, 500) ?? '';

  if (has(b, 'requirements')) {
    if (!isObject(b.requirements)) return { error: 'Invalid requirements' };
    const requirements = {};
    if (has(b.requirements, 'minFollowers')) requirements.minFollowers = num(b.requirements.minFollowers, 0, 1000000000) ?? 0;
    if (has(b.requirements, 'minEngagement')) requirements.minEngagement = num(b.requirements.minEngagement, 0, 100) ?? 0;
    if (has(b.requirements, 'categories')) requirements.categories = categoryList(b.requirements.categories, CREATOR_CATEGORIES) || [];
    if (has(b.requirements, 'locations')) {
      requirements.locations = Array.isArray(b.requirements.locations)
        ? [...new Set(b.requirements.locations.map((l) => str(l, 60)).filter(Boolean))].slice(0, 10)
        : [];
    }
    data.requirements = requirements;
  }

  if (has(b, 'deadline')) {
    if (b.deadline === null || b.deadline === '') {
      data.deadline = null;
    } else {
      const deadline = new Date(b.deadline);
      if (Number.isNaN(deadline.getTime())) return { error: 'Invalid deadline' };
      data.deadline = deadline;
    }
  }

  if (has(b, 'status')) {
    if (!OPENING_STATUSES.includes(b.status)) return { error: 'Invalid status' };
    data.status = b.status;
  }

  return { data };
};

module.exports = { cleanCreatorInput, cleanBrandInput, cleanOpeningInput, flatten, safeUrl };
