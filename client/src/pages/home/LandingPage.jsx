import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, User, Search, MessageCircle, Handshake, IndianRupee, Wallet, Link2, Megaphone, ShieldCheck, Store, Mail, X } from 'lucide-react';
// ─── EDIT ME ──────────────────────────────────────────────────────────────────
// Photos live in client/public/landing/ and are referenced by URL.
const IMG = {
  heroFashion: '/landing/hero-fashion-1.webp',
  heroBeauty: '/landing/hero-beauty-1.webp',
  avatars: ['/landing/avatar-1.webp', '/landing/avatar-2.webp', '/landing/avatar-3.webp', '/landing/avatar-4.webp'],
  fashionModel: '/landing/photo-1.webp',
  beautyModel: '/landing/photo-2.webp',
  forCreators: '/landing/dual-img-1.webp',
  forBrands: '/landing/brand-img-1.webp',
};

// Official logos for the trust strip. Download each from the company's own brand / press page and save them in
// client/public/landing/logos/ (SVG or PNG, transparent background). If a file is missing, the company name shows as text.
const LOGOS = {
  instagram: '/landing/logos/instagram.svg',
  meta: '/landing/logos/meta.svg',
  razorpay: '/landing/logos/razorpay.svg',
};

// SAMPLE profiles (names, handles and numbers are illustrative, not real people).
// Replace with real creators who have agreed to be shown before launch.
const SAMPLE_CREATORS = [
  { name: 'Aditi Sharma', handle: '@aditi.style', followers: '120K', engagement: '7.2%', views: '250K', tags: ['Fashion', 'Outfit Ideas'], tone: 'blue', image: '/landing/photo-3.webp' },
  { name: 'Riya Mehta', handle: '@riya.beauty', followers: '85K', engagement: '6.4%', views: '180K', tags: ['Beauty', 'Makeup'], tone: 'pink', image: '/landing/photo-4.webp' },
  { name: 'Simran Kaur', handle: '@simrankfits', followers: '62K', engagement: '5.8%', views: '110K', tags: ['Fashion', 'Styling'], tone: 'blue', image: '/landing/photo-5.webp' },
  { name: 'Neha Verma', handle: '@nehaglow', followers: '48K', engagement: '6.1%', views: '90K', tags: ['Beauty', 'Skincare'], tone: 'pink', image: '/landing/photo-6.webp' },
  { name: 'Kavya Rao', handle: '@kavyastyle', followers: '95K', engagement: '6.8%', views: '200K', tags: ['Fashion', 'Lifestyle'], tone: 'blue', image: '/landing/photo-7.webp' },
];

// Steps shown in the two "How GoodCreator works" sections.
const CREATOR_STEPS = [
  { icon: User, title: 'Create your profile', text: 'Sign up free and set up your creator profile with your niche and location.' },
  { icon: Link2, title: 'Connect Instagram', text: 'Link your account so brands can see your real followers, engagement and views.' },
  { icon: Search, title: 'Get discovered', text: 'Brands find you in search, or you apply to campaigns that match your niche.' },
  { icon: MessageCircle, title: 'Chat & agree', text: 'Talk to the brand directly and agree on the deliverables and price.' },
  { icon: Wallet, title: 'Deliver & get paid', text: 'Share your content. Once the brand approves it, your payment is released securely.' },
];
const BRAND_STEPS = [
  { icon: Store, title: 'Create your brand profile', text: 'Sign up free and tell creators who you are and what you sell.' },
  { icon: Search, title: 'Find the right creators', text: 'Filter fashion & beauty creators by category, location and real Instagram stats.' },
  { icon: Megaphone, title: 'Post a campaign', text: 'Or post a campaign and let interested creators apply to you.' },
  { icon: MessageCircle, title: 'Chat & finalise', text: 'Message creators directly. No agency in between.' },
  { icon: ShieldCheck, title: 'Pay securely & approve', text: 'Pay through GoodCreator, approve the delivered content, then leave a review.' },
];
const HOW_TONES = {
  blue: { num: 'bg-[#155DFC] text-white', icon: 'bg-[#f2f6ff] text-[#155DFC]' },
  dark: { num: 'bg-[#101828] text-white', icon: 'bg-[#eef1f6] text-[#101828]' },
};

// ─── POP-OUT LOOK for the Fashion / Beauty cards ──────────────────────────────
// How far (px) the picture rises ABOVE the top edge of its card. 0 = no pop-out.
const POP_OUT_PX = 32;
// 'auto' -> each card checks its own picture: a transparent cut-out is shown whole,
//           a normal photo is shown inside the arch shape. (recommended)
// true / false -> force one look for both cards.
const CUTOUT_PHOTOS = 'auto';

// Where the picture sits and how wide it can be. Cut-outs get a wider slot, closer to the right edge,
// so arms and hair are never cut off.
const BOX_CUTOUT = 'right-2 w-[140px] md:right-3 md:w-[150px] lg:right-[14px] lg:w-[44%]';
const BOX_PHOTO = 'right-[14px] w-[120px] md:right-5 md:w-[140px] lg:right-[26px] lg:w-[205px]';

// true if the picture has transparent top corners (= a cut-out), false for a normal photo, null while it loads.
const useIsCutout = (src) => {
  const [isCutout, setIsCutout] = useState(null);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      let result = false;
      try {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 16;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 16, 16);
        const alpha = (x, y) => ctx.getImageData(x, y, 1, 1).data[3];
        result = alpha(0, 0) < 40 && alpha(15, 0) < 40;
      } catch (e) {
        result = false;
      }
      if (alive) setIsCutout(result);
    };
    img.onerror = () => { if (alive) setIsCutout(false); };
    img.src = src;
    return () => { alive = false; };
  }, [src]);
  return isCutout;
};

const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
// Navbar logo font (loaded by the <link> inside the page).
const LOGO_FONT = '"Archivo Black", Inter, ui-sans-serif, system-ui, sans-serif';

// ─── small building blocks ────────────────────────────────────────────────────
const VARIANTS = {
  primary: 'border-[#155DFC] bg-[#155DFC] text-white hover:bg-[#0F4FCC] hover:border-[#0F4FCC]',
  outline: 'border-[#9ca8b8] bg-white text-[#101828] hover:border-[#101828]',
  white: 'border-white bg-white text-[#101828] hover:bg-[#EAF1FF]',
  soft: 'border-[#dce4ee] bg-white text-[#101828] shadow-[0_3px_10px_rgba(16,24,40,.04)] hover:border-[#155DFC] hover:text-[#155DFC]',
};
const SIZES = {
  lg: 'px-8 py-3 text-xs',
  md: 'px-4 py-[9px] text-xs',
  sm: 'px-[10px] py-2 text-[9px] lg:px-[15px] lg:py-[9px] lg:text-[10px]',
};
const Btn = ({ variant = 'primary', size = 'lg', className = '', ...props }) => (
  <button
    type="button"
    className={`inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border font-extrabold transition duration-150 active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...props}
  />
);

const TrustItem = ({ children }) => (
  <span className="inline-flex items-center gap-[7px] whitespace-nowrap">
    <span className="flex h-4 w-4 items-center justify-center rounded-full border-[1.6px] border-[#155DFC] text-[#155DFC]">
      <Check size={9} strokeWidth={3.5} />
    </span>
    {children}
  </span>
);

const InstagramGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
  </svg>
);

const CategoryCard = ({ kicker, title, text, cta, image, alt, bg, onCta }) => {
  const detected = useIsCutout(image);
  const cutout = CUTOUT_PHOTOS === 'auto' ? detected : CUTOUT_PHOTOS;
  return (
    <article className="relative flex min-h-[340px] rounded-[15px] bg-white p-[6px] sm:min-h-[360px] sm:p-2 md:min-h-[320px] lg:h-[300px] lg:min-h-0 lg:rounded-[18px] lg:p-3">
      {/* coloured panel: clips only its own content */}
      <div className={`relative flex-1 overflow-hidden rounded-xl px-[10px] py-4 sm:px-[15px] sm:py-5 md:px-5 md:py-6 lg:rounded-[14px] lg:px-[26px] lg:py-7 ${bg}`}>
        <div className="relative z-[4] pt-[174px] md:w-1/2 md:pt-0 lg:w-[52%]">
          <span className="mb-2 inline-block rounded-full bg-white/70 px-[9px] py-[5px] text-[9px] font-extrabold tracking-[1.2px] text-[#1558d8]">{kicker}</span>
          <h2 className="mb-[11px] text-[20px] font-extrabold leading-[.98] tracking-[-1.3px] text-[#101828] sm:text-[22px] lg:text-[29px]">
            {title[0]}<br />{title[1]}
          </h2>
          <p className="mb-[14px] max-w-[260px] text-[10px] leading-[1.45] text-[#506073]">{text}</p>
          <Btn variant="soft" size="sm" onClick={onCta}>{cta}</Btn>
        </div>
      </div>
      {/* the person: stands on the panel's bottom edge and rises ABOVE the top edge of the card */}
      <div className={`pointer-events-none absolute top-[calc(var(--pop)_*_-0.6)] z-[5] h-[calc(185px_+_var(--pop)_*_0.6)] drop-shadow-[0_18px_22px_rgba(16,24,40,.16)] md:bottom-2 md:top-[calc(var(--pop)_*_-0.8)] md:h-auto lg:bottom-3 lg:top-[calc(var(--pop)_*_-1)] ${cutout ? BOX_CUTOUT : BOX_PHOTO} ${cutout === null ? 'opacity-0' : ''}`}>
        <img
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`block h-full w-full ${cutout ? 'object-contain object-bottom' : 'rounded-b-[10px] rounded-t-[60px] object-cover object-top md:rounded-t-[70px] lg:rounded-b-[14px] lg:rounded-t-[110px]'}`}
        />
      </div>
    </article>
  );
};

const CreatorCard = ({ c }) => (
  <article className="w-[180px] shrink-0 overflow-hidden rounded-xl border border-[#edf0f3] bg-white shadow-[0_3px_12px_rgba(15,23,42,.035)] sm:w-[205px]">
    <img src={c.image} alt="" decoding="async" className="block h-[140px] w-full bg-[#e9eef7] object-cover sm:h-[155px]" />
    <div className="px-3 pb-[13px] pt-[11px]">
      <div className="flex items-center gap-1 text-[13px] font-extrabold">
        {c.name}<span className="text-[9px] text-[#155DFC]">●</span>
      </div>
      <div className="mt-0.5 text-[9px] text-[#657185]">{c.handle}</div>
      <div className="mt-[11px] flex justify-between">
        {[[c.followers, 'Followers'], [c.engagement, 'Engagement'], [c.views, 'Avg. Views']].map(([v, l]) => (
          <div key={l}>
            <strong className="block text-[11px]">{v}</strong>
            <span className="text-[9px] text-[#7b8798]">{l}</span>
          </div>
        ))}
      </div>
      <div className="mt-[10px] flex gap-[5px]">
        {c.tags.map((t) => (
          <span key={t} className={`rounded-[10px] px-2 py-[5px] text-[9px] text-[#4b5b70] ${c.tone === 'pink' ? 'bg-[#fff0f3]' : 'bg-[#eff5ff]'}`}>{t}</span>
        ))}
      </div>
    </div>
  </article>
);

const HowItWorks = ({ id, kicker, title, intro, steps, tone }) => (
  <section id={id} className="scroll-mt-4 border-t border-[#f0f2f5] pb-[22px] pt-[18px]">
    <span className="inline-block rounded-[10px] bg-[#e0edff] px-2 py-1 text-[9px] font-extrabold tracking-[1px] text-[#1558d8]">{kicker}</span>
    <h2 className="mb-1 mt-2 text-[20px] font-extrabold leading-[1.1] tracking-[-.8px] sm:text-[22px]">
      How <span className="text-[#155DFC]">GoodCreator</span> works {title}
    </h2>
    <p className="mb-[16px] text-[11px] text-[#627084]">{intro}</p>
    <ol className="md:grid md:grid-cols-5 md:gap-[18px]">
      {steps.map(({ icon: Icon, title: stepTitle, text }, i) => (
        <li key={stepTitle} className="relative flex items-start gap-3 border-b border-[#f0f2f5] py-[14px] first:pt-0 last:border-b-0 last:pb-0 md:block md:border-0 md:py-0 md:first:pt-0">
          <div className="flex shrink-0 items-center gap-2 md:mb-[9px]">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold ${HOW_TONES[tone].num}`}>{i + 1}</span>
            <span className={`flex h-[39px] w-[39px] items-center justify-center rounded-full ${HOW_TONES[tone].icon}`}><Icon size={18} /></span>
          </div>
          <div className="min-w-0">
            <h3 className="mb-[3px] text-[12px] font-bold md:mb-[6px] md:text-[11px]">{stepTitle}</h3>
            <p className="text-[11px] leading-[1.45] text-[#627084] md:max-w-[190px] md:text-[10px]">{text}</p>
          </div>
          {i < steps.length - 1 && <ArrowRight size={18} className="absolute -right-[13px] top-[22px] hidden text-[#aeb8c6] md:block" />}
        </li>
      ))}
    </ol>
  </section>
);

// A company logo that never shows a broken image: if the file is missing, the name is shown as text instead.
const LogoBadge = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-[14px] font-extrabold text-[#334155] md:text-[18px]">{name}</span>;
  return <img src={src} alt={name} onError={() => setFailed(true)} className="h-6 w-auto sm:h-7 md:h-9" />;
};

// Small, centred trust area shown right under the hero: big logos, one short line each.
const TRUST_ITEMS = [
  {
    logos: <><LogoBadge src={LOGOS.instagram} name="Instagram" /><LogoBadge src={LOGOS.meta} name="Meta" /></>,
    label: 'Stats synced from Instagram',
  },
  {
    logos: <span className="text-[15px] font-normal leading-none tracking-[-.3px] sm:text-[22px] md:text-[30px]" style={{ fontFamily: LOGO_FONT }}>Good<span className="text-[#155DFC]">Creator</span></span>,
    label: 'Escrow-protected payments',
  },
  {
    logos: <LogoBadge src={LOGOS.razorpay} name="Razorpay" />,
    label: 'Secure checkout by Razorpay',
  },
];
const TrustStrip = () => (
  <section aria-label="How GoodCreator builds trust" className="bg-white">
    <Container className="grid grid-cols-3 py-[12px] md:py-[18px]">
      {TRUST_ITEMS.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-[6px] px-1 text-center md:gap-[8px] md:px-4">
          <div className="flex h-8 flex-wrap items-center justify-center gap-x-2 md:h-10 md:gap-x-3">{item.logos}</div>
          <p className="text-balance text-[10px] font-semibold leading-[1.3] text-[#627084] md:text-[11px]">{item.label}</p>
        </div>
      ))}
    </Container>
  </section>
);

const Container = ({ className = '', children, ...props }) => (
  <div className={`mx-auto w-full max-w-[1228px] px-3 sm:px-6 ${className}`} {...props}>{children}</div>
);

// ─── CONTACT DIALOG ───────────────────────────────────────────────────────────
const CONTACT_EMAIL = 'team@goodcreator.in';
const ContactDialog = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: the address is still shown on screen */ }
  };

  // Many desktops have no mail app set up, so a plain mailto: link silently does nothing there.
  // On phones the mail app opens; on computers Gmail's compose window opens in a new tab.
  const sendEmail = () => {
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    } else {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101828]/55 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        className="relative w-full max-w-[400px] rounded-2xl bg-white p-6 text-center shadow-[0_24px_60px_rgba(16,24,40,.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828]">
          <X size={18} />
        </button>
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4ff] text-[#155DFC]"><Mail size={22} /></div>
        <h2 id="contact-title" className="mb-1 text-[19px] font-extrabold tracking-[-.5px] text-[#101828]">Contact GoodCreator</h2>
        <p className="mb-4 text-[13px] leading-[1.55] text-[#667085]">For any question, help or feedback, please send us an email at:</p>
        <div className="mb-4 select-all break-all rounded-xl border border-[#d1e0ff] bg-[#f5f8ff] px-3 py-3 text-[16px] font-bold text-[#155DFC]">{CONTACT_EMAIL}</div>
        <p className="mb-5 text-[12px] leading-[1.55] text-[#667085]">Please mention the email you registered with and what you need help with. We usually reply within 24 to 48 hours. If the button does not open your email, copy the address and write to us from any email app.</p>
        <div className="flex gap-2">
          <button type="button" onClick={sendEmail} className="flex flex-1 cursor-pointer items-center justify-center rounded-lg bg-[#155DFC] px-3 py-2.5 text-[13px] font-bold text-white hover:bg-[#0f4fe0]">Send email</button>
          <button type="button" onClick={copyEmail} className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-[#d0d5dd] bg-white px-3 py-2.5 text-[13px] font-bold text-[#344054] hover:bg-[#f9fafb]">{copied ? 'Copied' : 'Copy email'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const scrollerRef = useRef(null);
  const [contactOpen, setContactOpen] = useState(false);

  const toRegister = () => navigate('/register');
  const toLogin = () => navigate('/login');
  const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Slowly auto-scrolling creators row. Pauses on hover / touch, respects
  // "reduce motion", and keeps its own float position (setting scrollLeft in
  // sub-pixel steps would otherwise get rounded away by the browser).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const SPEED = 0.035; // px per ms (~35px/s)
    let frame = 0;
    let last = performance.now();
    let pos = el.scrollLeft;
    let paused = false;
    let atEnd = false;
    let holdUntil = 0;
    let resumeTimer;

    const pause = () => { paused = true; clearTimeout(resumeTimer); };
    const resume = () => { pos = el.scrollLeft; atEnd = false; paused = false; };
    const resumeSoon = () => { clearTimeout(resumeTimer); resumeTimer = setTimeout(resume, 1200); };
    const resetClock = () => { last = performance.now(); };

    const tick = (now) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (!paused && now >= holdUntil) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          pos += dt * SPEED;
          if (pos >= max) {
            if (!atEnd) { atEnd = true; pos = max; el.scrollLeft = max; holdUntil = now + 1400; }
            else { atEnd = false; pos = 0; el.scrollLeft = 0; holdUntil = now + 800; }
          } else {
            el.scrollLeft = pos;
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resumeSoon, { passive: true });
    document.addEventListener('visibilitychange', resetClock);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resumeTimer);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resumeSoon);
      document.removeEventListener('visibilitychange', resetClock);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white leading-[normal] text-[#101828] antialiased" style={{ fontFamily: FONT }}>
      <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      {/* NAV */}
      <header className="border-b border-[#edf0f4] bg-white">
        <Container className="flex h-[47px] items-center justify-between">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer text-[17px] font-normal tracking-[-.3px] sm:text-[20px]" style={{ fontFamily: LOGO_FONT }}>
            Good<span className="text-[#155DFC]">Creator</span>
          </button>
          <nav className="flex items-center gap-2 text-[11px] font-semibold text-[#111827] sm:gap-7">
            <button type="button" onClick={() => scrollToId('how-creators')} className="hidden cursor-pointer hover:text-[#155DFC] sm:block">For Creators</button>
            <button type="button" onClick={() => scrollToId('how-brands')} className="hidden cursor-pointer hover:text-[#155DFC] sm:block">For Brands</button>
            <button type="button" onClick={toLogin} className="cursor-pointer rounded-lg border border-[#e1e6ed] bg-white px-3 py-[9px] transition hover:border-[#101828] sm:px-[18px]">Log in</button>
            <button type="button" onClick={toRegister} className="cursor-pointer rounded-lg border border-[#101828] bg-[#101828] px-3 py-[9px] text-white transition hover:bg-black sm:px-[18px]">Join free</button>
          </nav>
        </Container>
        {/* phones only: the two section links, one row under the bar */}
        <div className="border-t border-[#f0f2f5] sm:hidden">
          <Container className="flex gap-2 py-2">
            <button type="button" onClick={() => scrollToId('how-creators')} className="flex-1 cursor-pointer rounded-lg bg-[#f2f6ff] py-[7px] text-[11px] font-bold text-[#155DFC] active:scale-[0.98]">For Creators</button>
            <button type="button" onClick={() => scrollToId('how-brands')} className="flex-1 cursor-pointer rounded-lg bg-[#f2f6ff] py-[7px] text-[11px] font-bold text-[#155DFC] active:scale-[0.98]">For Brands</button>
          </Container>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="overflow-hidden bg-[linear-gradient(115deg,#fff_0%,#f7f9fc_100%)]">
          <Container className="flex flex-col lg:grid lg:min-h-[406px] lg:grid-cols-[47%_53%]">
            <div className="relative z-[3] order-2 pb-7 pt-[10px] lg:order-none lg:pb-0 lg:pt-10">
              <span className="inline-block rounded-full bg-[#e7f0ff] px-[11px] py-[6px] text-[9px] font-extrabold tracking-[.4px] text-[#1558d8]">
                FASHION &amp; BEAUTY CREATOR MARKETPLACE
              </span>
              <h1 className="mb-[9px] mt-[15px] text-[37px] font-extrabold leading-[1.02] tracking-[-2.5px] sm:text-[45px]">
                Where brands meet<br /><span className="text-[#155DFC]">fashion &amp; beauty</span><br />creators.
              </h1>
              <p className="mb-[15px] max-w-[430px] text-[15px] leading-[1.45] text-[#536173]">
                Connect with authentic Instagram creators in fashion and beauty. No agencies, no cold DMs. Just real collaborations.
              </p>
              <div className="flex flex-wrap gap-3">
                <Btn onClick={toRegister}>I&apos;m a creator →</Btn>
                <Btn variant="outline" onClick={toRegister}>I&apos;m a brand →</Btn>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-[#334155]">
                <TrustItem>₹0 to join</TrustItem>
                <TrustItem>No monthly subscription</TrustItem>
                <TrustItem>Direct brand collaboration</TrustItem>
              </div>
            </div>

            <div className="relative order-first mx-auto h-[292px] w-full max-w-[400px] sm:h-[420px] sm:max-w-[560px] lg:order-none lg:mx-0 lg:h-[406px] lg:max-w-none">
              <img src={IMG.heroFashion} alt="Fashion creator" className="absolute right-[100px] top-2 h-[236px] w-[190px] rounded-t-[180px] object-cover object-top mix-blend-multiply sm:right-[132px] sm:h-[405px] sm:w-[335px]" />
              <img src={IMG.heroBeauty} alt="Beauty creator" className="absolute right-0 top-[92px] h-[130px] w-[104px] rounded-[14px] object-cover shadow-[0_10px_30px_rgba(15,23,42,.08)] sm:top-[157px] sm:h-[226px] sm:w-[180px] sm:rounded-[18px]" />

              <div className="absolute right-0 top-[6px] z-[4] w-[140px] rounded-[12px] bg-white px-[10px] py-[9px] shadow-[0_7px_24px_rgba(15,23,42,.07)] sm:top-[35px] sm:w-[180px] sm:rounded-[13px] sm:px-4 sm:py-[15px]">
                <span className="absolute left-[10px] top-[9px] flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#155DFC] text-white sm:left-4 sm:top-[14px] sm:h-[29px] sm:w-[29px] sm:rounded-[7px]"><Handshake className="h-[13px] w-[13px] sm:h-4 sm:w-4" /></span>
                <div className="ml-[31px] text-[11px] font-extrabold leading-[1.15] sm:ml-[39px] sm:text-[13px]">Real<br />Collaborations</div>
                <div className="mt-2 flex items-center sm:mt-[13px]">
                  {IMG.avatars.map((src, i) => (
                    <img key={src} src={src} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className={`h-5 w-5 rounded-full border-2 border-white object-cover sm:h-6 sm:w-6 ${i ? '-ml-[5px]' : ''}`} />
                  ))}
                  <span className="ml-1.5 text-[8px] leading-tight text-[#687487] sm:ml-2 sm:text-[9px]">Creators<br />&amp; brands</span>
                </div>
              </div>

              <div className="absolute bottom-[10px] left-0 z-[5] flex items-center gap-2 rounded-[14px] bg-white px-[10px] py-[10px] shadow-[0_9px_28px_rgba(15,23,42,.13)] sm:bottom-[75px] sm:left-[25px] sm:w-[270px] sm:gap-[14px] sm:px-[18px] sm:py-[17px]">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[linear-gradient(135deg,#ffb400,#f00075,#6840f0)] sm:h-[26px] sm:w-[26px] sm:rounded-[7px]"><InstagramGlyph /></span>
                {[['85K', 'Followers'], ['6.4%', 'Engagement'], ['120K', 'Avg. Views']].map(([v, l]) => (
                  <div key={l} className="whitespace-nowrap">
                    <strong className="block text-[13px] leading-tight sm:text-[16px]">{v}</strong>
                    <span className="text-[8px] text-[#697586] sm:text-[9px]">{l}</span>
                  </div>
                ))}
              </div>

              <div className="absolute left-0 top-[14px] z-[6] -rotate-[5deg] text-[14px] italic text-[#111] sm:top-[35px] sm:text-[16px]" style={{ fontFamily: 'cursive' }}>Fashion<br />↘</div>
              <div className="absolute bottom-[26px] right-[-1px] z-[6] -rotate-[7deg] text-[14px] italic text-[#111] sm:bottom-[35px] sm:text-[16px]" style={{ fontFamily: 'cursive' }}>↖<br />Beauty</div>
            </div>
          </Container>
        </section>

        <TrustStrip />

        {/* CATEGORIES */}
        <Container className="pt-[calc(15px_+_var(--pop)_*_0.6)] md:pt-[calc(15px_+_var(--pop)_*_0.8)] lg:pt-[calc(15px_+_var(--pop))]" style={{ '--pop': `${POP_OUT_PX}px` }}>
          <div className="grid grid-cols-2 gap-[7px] sm:gap-[10px] lg:gap-[18px]">
            <CategoryCard
              kicker="FASHION" title={['Fashion', 'Creators']}
              text="From everyday outfits to ethnic, streetwear to luxury — collaborate with creators who bring fashion to life."
              cta="Explore fashion creators →" onCta={toRegister}
              image={IMG.fashionModel} alt="Fashion creator"
              bg="bg-[linear-gradient(115deg,#edf5ff,#dbeaff)]"
            />
            <CategoryCard
              kicker="BEAUTY" title={['Beauty', 'Creators']}
              text="Makeup, skincare, haircare and more — work with creators who create real, relatable beauty content."
              cta="Explore beauty creators →" onCta={toRegister}
              image={IMG.beautyModel} alt="Beauty creator"
              bg="bg-[linear-gradient(115deg,#fff0f5,#ffe4ed)]"
            />
          </div>

          {/* POPULAR CREATORS */}
          <section id="popular" className="pb-[13px] pt-4">
            <div className="mb-[10px] flex items-center justify-between gap-3">
              <h2 className="text-[19px] font-extrabold tracking-[-.8px] sm:text-[22px]">Popular Fashion &amp; Beauty Creators</h2>
              <button type="button" onClick={toRegister} className="shrink-0 cursor-pointer text-[10px] font-bold text-[#155DFC] hover:underline">View all creators →</button>
            </div>
            <div ref={scrollerRef} className="flex gap-3 overflow-x-auto overflow-y-hidden px-[2px] pb-[14px] pt-[6px] [scrollbar-width:none] sm:gap-[18px] sm:px-1 [&::-webkit-scrollbar]:hidden">
              {SAMPLE_CREATORS.map((c) => <CreatorCard key={c.handle} c={c} />)}
            </div>
          </section>

          {/* HOW IT WORKS: creators */}
          <HowItWorks
            id="how-creators" tone="blue" kicker="FOR CREATORS" title="for creators"
            intro="Five simple steps from sign-up to your first paid collaboration."
            steps={CREATOR_STEPS}
          />

          {/* HOW IT WORKS: brands */}
          <HowItWorks
            id="how-brands" tone="dark" kicker="FOR BRANDS" title="for brands"
            intro="Five simple steps from sign-up to a finished collaboration."
            steps={BRAND_STEPS}
          />

          {/* FOR CREATORS / FOR BRANDS */}
          <section className="grid gap-[10px] py-[7px] lg:grid-cols-2">
            {[
              { id: 'for-creators', tone: 'bg-[#eaf3ff]', kicker: 'FOR CREATORS', title: ['Turn your content', 'into real opportunities.'], items: ['Get discovered by fashion & beauty brands', 'Showcase your Instagram stats', 'Receive genuine collaboration offers', 'Free to join, no monthly fees'], cta: 'Join as a creator →', img: IMG.forCreators, imgClass: 'sm:-right-2 sm:object-top mix-blend-multiply' },
              { id: 'for-brands', tone: 'bg-[#fff3f5]', kicker: 'FOR BRANDS', title: ['Find creators who', 'fit your brand.'], items: ['Discover relevant fashion & beauty creators', 'View real Instagram insights', 'Directly connect and collaborate', 'No subscription, no agency fees'], cta: 'Join as a brand →', img: IMG.forBrands, imgClass: 'sm:right-0' },
            ].map((card) => (
              <article key={card.id} id={card.id} className={`relative overflow-hidden rounded-xl px-[22px] pb-[22px] pt-[15px] sm:min-h-[226px] lg:h-[226px] lg:pb-[15px] ${card.tone}`}>
                <span className="inline-block rounded-[10px] bg-[#e0edff] px-2 py-1 text-[9px] font-extrabold tracking-[1px] text-[#1558d8]">{card.kicker}</span>
                <h2 className="mb-[10px] mt-2 max-w-[245px] text-[22px] font-extrabold leading-[1.02] tracking-[-1px]">{card.title[0]}<br />{card.title[1]}</h2>
                <ul className="max-w-[270px]">
                  {card.items.map((t) => (
                    <li key={t} className="my-[7px] flex items-start gap-[7px] text-[10px] text-[#26364b]">
                      <Check size={11} strokeWidth={3.5} className="mt-[1px] shrink-0 text-[#155DFC]" />{t}
                    </li>
                  ))}
                </ul>
                <Btn size="md" className="mt-[5px]" onClick={toRegister}>{card.cta}</Btn>
                <img src={card.img} alt="" loading="lazy" decoding="async" className={`mt-4 h-[150px] w-full rounded-xl object-cover sm:absolute sm:bottom-0 sm:mt-0 sm:h-[225px] sm:w-[205px] sm:rounded-none ${card.imgClass}`} />
              </article>
            ))}
          </section>

          {/* FINAL CTA */}
          <section className="mb-8 mt-[9px] grid items-center gap-[22px] rounded-xl bg-[#101828] px-[25px] py-[18px] text-white lg:grid-cols-[1.8fr_1fr] lg:gap-0">
            <div>
              <span className="inline-block rounded-xl bg-[#1d2a42] px-[10px] py-[5px] text-[9px] tracking-[1px]">FREE TO JOIN</span>
              <h2 className="mb-2 mt-2 text-[22px] font-extrabold leading-[1.05] tracking-[-.9px]">No subscription. No agency fees. <br className="hidden lg:block" />Just real fashion &amp; beauty collaborations.</h2>
              <p className="mb-[10px] text-[10px] text-[#d2d9e4]">Join GoodCreator today and start connecting.</p>
              <p className="mb-[12px] max-w-[460px] text-[10px] leading-[1.5] text-[#d2d9e4]">We take a 15% commission only when a collaboration is completed. Everything else is free for both creators and brands.</p>
              <div className="flex flex-wrap gap-[9px]">
                <Btn size="md" onClick={toRegister}>I&apos;m a creator →</Btn>
                <Btn size="md" variant="white" onClick={toRegister}>I&apos;m a brand →</Btn>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5 border-t border-[#455064] pt-[18px] lg:border-l lg:border-t-0 lg:pl-[35px] lg:pt-0">
              {[[IndianRupee, '₹0', 'To join'], [Wallet, '₹0', 'Monthly subscription'], [Handshake, 'Direct', 'Brand collaboration']].map(([Icon, v, l]) => (
                <div key={l} className="text-center">
                  <span className="mx-auto mb-[7px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-[#101828]"><Icon size={15} strokeWidth={2.5} /></span>
                  <strong className="block text-[13px]">{v}</strong>
                  <span className="text-[9px] text-[#e0e5ed]">{l}</span>
                </div>
              ))}
            </div>
          </section>
        </Container>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#edf0f4] bg-white">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-[11px] text-[#697586] sm:flex-row">
          <div className="text-[15px] font-extrabold tracking-[-.5px] text-[#101828]">Good<span className="text-[#155DFC]">Creator</span></div>
          <div>Fashion &amp; beauty creator collaborations · 2026</div>
          <div className="flex gap-5">
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="hover:text-[#101828]">Privacy</a>
            <button type="button" onClick={() => setContactOpen(true)} className="cursor-pointer hover:text-[#101828]">Contact</button>
          </div>
        </Container>
      </footer>
      {contactOpen && <ContactDialog onClose={() => setContactOpen(false)} />}
    </div>
  );
}
