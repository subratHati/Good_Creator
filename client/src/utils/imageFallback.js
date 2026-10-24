// Any broken profile/logo picture (Instagram or Cloudinary) is swapped for a letter avatar,
// using the first letter of the image's alt text (a plain person icon if there is none).
const COLORS = ['#155DFC', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DB2777', '#4F46E5'];
const isManaged = (src) => /cdninstagram\.com|fbcdn\.net|res\.cloudinary\.com/i.test(src || '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const letterAvatar = (name) => {
  const clean = String(name || '').trim();
  const letter = clean ? esc([...clean][0].toUpperCase()) : '';
  let hash = 0;
  for (const ch of clean) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const color = COLORS[hash % COLORS.length];
  const body = letter
    ? `<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#fff">${letter}</text>`
    : '<circle cx="50" cy="38" r="16" fill="#fff" fill-opacity=".9"/><path d="M18 90c0-18 14-30 32-30s32 12 32 30z" fill="#fff" fill-opacity=".9"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"/>${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

window.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || img.dataset.fallbackDone) return;
    if (!isManaged(img.currentSrc || img.src)) return;
    img.dataset.fallbackDone = '1';
    img.removeAttribute('srcset');
    img.src = letterAvatar(img.alt || img.dataset.name);
  },
  true
);