// Checks for the brand verification details. They match the checks on the
// server (utils/profileInput.js), so a brand hears about a typo straight away.
// The server checks again, so these are only a convenience.

// ─── phone / WhatsApp number with a country code ──────────────────────────────
// India comes first and is the default. (No two codes here start with each other,
// so a saved number can be split back into code + number without guessing.)
export const DEFAULT_COUNTRY_CODE = '91';
export const COUNTRIES = [
  { name: 'India', code: '91' },
  { name: 'US / Canada', code: '1' },
  { name: 'UK', code: '44' },
  { name: 'UAE', code: '971' },
  { name: 'Saudi Arabia', code: '966' },
  { name: 'Qatar', code: '974' },
  { name: 'Kuwait', code: '965' },
  { name: 'Oman', code: '968' },
  { name: 'Bahrain', code: '973' },
  { name: 'Singapore', code: '65' },
  { name: 'Malaysia', code: '60' },
  { name: 'Australia', code: '61' },
  { name: 'New Zealand', code: '64' },
  { name: 'Nepal', code: '977' },
  { name: 'Bhutan', code: '975' },
  { name: 'Bangladesh', code: '880' },
  { name: 'Sri Lanka', code: '94' },
  { name: 'Maldives', code: '960' },
  { name: 'Pakistan', code: '92' },
  { name: 'Germany', code: '49' },
  { name: 'France', code: '33' },
  { name: 'Italy', code: '39' },
  { name: 'Spain', code: '34' },
  { name: 'Netherlands', code: '31' },
  { name: 'Ireland', code: '353' },
  { name: 'Switzerland', code: '41' },
  { name: 'Sweden', code: '46' },
  { name: 'Japan', code: '81' },
  { name: 'South Korea', code: '82' },
  { name: 'China', code: '86' },
  { name: 'Hong Kong', code: '852' },
  { name: 'Thailand', code: '66' },
  { name: 'Indonesia', code: '62' },
  { name: 'Philippines', code: '63' },
  { name: 'Vietnam', code: '84' },
  { name: 'Turkey', code: '90' },
  { name: 'Egypt', code: '20' },
  { name: 'South Africa', code: '27' },
  { name: 'Nigeria', code: '234' },
  { name: 'Kenya', code: '254' },
  { name: 'Brazil', code: '55' },
  { name: 'Mexico', code: '52' },
];

// "+919876543210" -> { code: '91', number: '9876543210' }.
// An older number saved without a country code is read as an Indian number.
export const splitPhone = (saved) => {
  const raw = String(saved || '').trim().replace(/[\s\-().]/g, '');
  if (!raw) return { code: DEFAULT_COUNTRY_CODE, number: '' };
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) {
    const match = COUNTRIES.find((c) => digits.startsWith(c.code));
    return match ? { code: match.code, number: digits.slice(match.code.length) } : { code: DEFAULT_COUNTRY_CODE, number: digits };
  }
  if (/^91[6-9][0-9]{9}$/.test(digits)) return { code: '91', number: digits.slice(2) };
  return { code: DEFAULT_COUNTRY_CODE, number: digits.replace(/^0+/, '') };
};

// ('91', '098765 43210') -> '+919876543210'.  An empty number gives ''.
export const joinPhone = (code, number) => {
  const n = String(number || '').replace(/\D/g, '').replace(/^0+/, '');
  return n ? `+${code}${n}` : '';
};

// value is the joined form, e.g. +919876543210
export const phoneProblem = (value) => {
  const s = String(value || '').trim().replace(/[\s\-().]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(s)) return 'Enter a valid phone / WhatsApp number';
  if (s.startsWith('+91') && !/^\+91[6-9][0-9]{9}$/.test(s)) return 'Indian numbers have 10 digits and start with 6, 7, 8 or 9';
  return '';
};

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const gstinProblem = (value) => {
  const s = String(value || '').replace(/\s/g, '').toUpperCase();
  if (!s) return '';
  return GSTIN.test(s) ? '' : 'GSTIN looks wrong. It has 15 characters, for example 27AAPFU0939F1ZV';
};

export const udyamProblem = (value) => {
  const s = String(value || '').replace(/[\s-]/g, '').toUpperCase();
  if (!s) return '';
  return /^UDYAM[A-Z]{2}[0-9]{2}[0-9]{7}$/.test(s) ? '' : 'UDYAM number looks wrong. It looks like UDYAM-MH-00-0000000';
};

export const igHandleProblem = (value) => {
  const s = String(value || '').trim().replace(/^@/, '');
  return /^[A-Za-z0-9._]{0,40}$/.test(s) ? '' : 'Instagram handle can only have letters, numbers, dots and underscores';
};

// The screen has ONE box for "GSTIN or UDYAM number". These work out which of
// the two the brand typed, so the server still gets them as separate fields.
export const registrationProblem = (value) => {
  const s = String(value || '').replace(/[\s-]/g, '').toUpperCase();
  if (!s) return '';
  if (GSTIN.test(s) || /^UDYAM[A-Z]{2}[0-9]{2}[0-9]{7}$/.test(s)) return '';
  return 'This does not look like a GSTIN (15 characters) or a UDYAM number (UDYAM-MH-00-0000000)';
};

export const splitRegistration = (value) => {
  const s = String(value || '').replace(/[\s-]/g, '').toUpperCase();
  if (!s) return { gstin: '', udyam: '' };
  if (s.startsWith('UDYAM')) return { gstin: '', udyam: String(value).trim() };
  return { gstin: s, udyam: '' };
};
