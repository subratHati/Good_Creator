// utils/brandVerification.js
//
// Brand verification is done by hand by the admin team (they phone the brand
// and check its documents). A brand is verified ONLY when its record says
// verification.status === 'verified'. Anything else - 'pending',
// 'not_verified', or no status at all - counts as NOT verified. Nothing a
// brand can send in a request is able to write this field (cleanBrandInput
// ignores it); only the admin review endpoint sets it.
//
// Who may do what is decided on the server, on every request, by reading the
// brand record fresh from the database - not from the login token and not
// from anything the browser says.

const Brand = require('../models/Brand');
const { cleanPhone } = require('./profileInput');

const STATUS = { PENDING: 'pending', VERIFIED: 'verified', NOT_VERIFIED: 'not_verified' };

const NOT_VERIFIED_CODE = 'BRAND_NOT_VERIFIED';
const NOT_VERIFIED_MESSAGE =
  'Your brand is not verified yet. You can use this once our team has verified your brand (this is done within 24 hours).';

// 'pending' | 'verified' | 'not_verified' - a missing or unknown value is 'pending'
const effectiveStatus = (brand) => {
  const status = brand && brand.verification && brand.verification.status;
  return status === STATUS.VERIFIED || status === STATUS.NOT_VERIFIED ? status : STATUS.PENDING;
};

const isBrandVerified = (brand) => !!brand && !!brand.verification && brand.verification.status === STATUS.VERIFIED;

// ids of every brand that is NOT verified. Used to hide those brands'
// campaigns from creators. (The unverified group is small, so a "not in this
// list" filter is cheap; and a brand with no status is in the list.)
const unverifiedBrandIds = () => Brand.distinct('_id', { 'verification.status': { $ne: STATUS.VERIFIED } });

// ── what a VERIFIED brand may change ─────────────────────────────────────────
// Once the team has verified a brand:
//   - brand name, category, GSTIN and UDYAM number are locked (they are what
//     was checked, so they cannot be swapped afterwards)
//   - logo, description and location can be changed freely
//   - changing the phone number, website or Instagram handle - or ADDING a
//     website, Instagram handle, GSTIN or UDYAM number - sends the brand back to
//     "waiting" so the team checks it again
// Removing a website or handle does not need a new check.
const plain = (s) => String(s || '').trim().toLowerCase().replace(/^@/, '').replace(/\/+$/, '');
const phoneKey = (v) => cleanPhone(String(v || '')) || String(v || '').trim();

// `current` is the brand as saved, `data` is the cleaned input from the request.
// Returns { locked: 'Brand name' | null, changed: ['website', ...] }
const checkVerifiedBrandEdit = (current, data) => {
  const has = (k) => Object.prototype.hasOwnProperty.call(data, k);
  const result = { locked: null, changed: [] };

  if (has('brandName') && data.brandName !== current.brandName) result.locked = 'Brand name';
  else if (has('category') && data.category !== current.category) result.locked = 'Category';
  else if (current.gstin && has('gstin') && data.gstin !== current.gstin) result.locked = 'GSTIN';
  else if (current.udyam && has('udyam') && data.udyam !== current.udyam) result.locked = 'UDYAM number';
  if (result.locked) return result;

  if (data.phone && phoneKey(data.phone) !== phoneKey(current.phone)) result.changed.push('phone number');
  if (data.website && plain(data.website) !== plain(current.website)) result.changed.push('website');
  const newHandle = data.instagram && data.instagram.handle;
  if (newHandle && plain(newHandle) !== plain(current.instagram && current.instagram.handle)) result.changed.push('Instagram handle');
  if (data.gstin && !current.gstin) result.changed.push('GSTIN');
  if (data.udyam && !current.udyam) result.changed.push('UDYAM number');
  return result;
};

// what to $set so a brand goes back to "waiting", and why
const backToWaiting = (changed) => ({
  'verification.status': STATUS.PENDING,
  'verification.requestedAt': new Date(),
  'verification.note': '',
  'verification.reason': `Changed after verification: ${changed.join(', ')}`,
});

// the fields of a brand that are never shown to anyone but the owner and admins
const PRIVATE_BRAND_FIELDS = ['phone', 'gstin', 'udyam', 'verification', 'savedCreators', 'userId'];

module.exports = {
  STATUS,
  NOT_VERIFIED_CODE,
  NOT_VERIFIED_MESSAGE,
  effectiveStatus,
  isBrandVerified,
  unverifiedBrandIds,
  PRIVATE_BRAND_FIELDS,
  checkVerifiedBrandEdit,
  backToWaiting,
};
