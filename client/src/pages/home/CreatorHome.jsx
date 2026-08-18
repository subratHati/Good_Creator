import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Shirt, Sparkles, UtensilsCrossed, Laptop, Dumbbell, Sun, Plane, GraduationCap, Gamepad2, LayoutGrid, TrendingUp as TrendUp, ChevronRight, Clapperboard, Baby, Video, Music, HandHeart, Newspaper, Film, Bot, PawPrint } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { CreatorSetupModal } from '../../components/ProfileSetupModals';
import { getMyCreatorProfile } from '../../api/creator';
import { searchOpenings } from '../../api/openings';
import useAuth from '../../hooks/useAuth';
import ReferralSourceModal from '../../components/ReferralSourceModal';
import InstagramReminderModal from '../../components/InstagramReminderModal';
import InstagramConnectChoiceModal from '../../components/InstagramConnectChoiceModal';
import toast from 'react-hot-toast';
import CreatorHomeSkeleton from '../../components/CreatorHomeSkeleton';
import { usePostHog } from '@posthog/react'
import PaymentAnnouncementBanner from '../../components/PaymentAnnouncementBanner';
import GenderMigrationModal from '../../components/GenderMigrationModal';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// same display-label logic used across the app's category pickers
const categoryLabels = {
  parenting_family: 'Parenting/Family',
  news_politics: 'News/Politics',
  pets_wildlife: 'Pets/Wildlife',
  ai_content: 'AI Content',
};
const getCategoryLabel = (cat) => {
  if (categoryLabels[cat]) return categoryLabels[cat];
  const spaced = cat.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};



const slides = [
  { src: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80' },
  { src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80' },
  { src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80' },
];

const tips = [
  { src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80', emoji: '⏰', title: 'Post at Peak Hours', desc: 'Reels posted between 7–9pm get 3x more reach on weekdays.' },
  { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80', emoji: '🎯', title: 'Niche = More Money', desc: 'Focused creators earn 2x more per post than general ones.' },
  { src: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=400&q=80', emoji: '💬', title: 'Reply to Comments', desc: 'Engagement in the first hour boosts your reach on the feed.' },
  { src: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=80', emoji: '📊', title: 'Track Your Stats', desc: 'Creators who track analytics consistently grow 40% faster.' },
];

// ─── CAROUSEL ─────────────────────────────────────────────────────────────────
const Carousel = ({ height = 'h-full' }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`relative ${height} overflow-hidden select-none`} style={{ borderRadius: '20px' }}>
      <img src={slides[current].src} alt="slide" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" />
      <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)' }} />
      <div className="absolute bottom-4 left-4 flex gap-1.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            style={{ width: i === current ? '20px' : '6px', height: '6px', borderRadius: '3px', backgroundColor: i === current ? '#FACC15' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  );
};

// ─── INSTAGRAM PANEL ──────────────────────────────────────────────────────────
const InstagramPanel = ({ ig, onConnect }) => {
  const engagementGood = ig?.engagementRate >= 3;
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', padding: '14px 12px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#155DFC', marginBottom: '2px' }}>
            {ig?.isConnected ? formatNumber(ig.followersCount) : '—'}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Followers</div>
        </div>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', padding: '14px 12px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: ig?.isConnected ? (engagementGood ? '#16A34A' : '#DC2626') : '#9CA3AF' }}>
              {ig?.isConnected ? (ig.engagementRate ? `${ig.engagementRate}%` : '—') : '—'}
            </div>
            {ig?.isConnected && ig?.engagementRate && (
              engagementGood ? <TrendingUp size={14} color="#16A34A" /> : <TrendingDown size={14} color="#DC2626" />
            )}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engagement</div>
        </div>
      </div>
      {ig?.isConnected ? (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>@{ig.handle} · Instagram Connected</span>
        </div>
      ) : (
        <button onClick={onConnect}
          style={{ width: '100%', padding: '13px', borderRadius: '14px', fontWeight: 900, color: 'white', fontSize: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg, #833AB4, #E1306C, #F77737)' }}>
          Connect Instagram →
        </button>
      )}
      <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }`}</style>
    </div>
  );
};

// ─── CATEGORY GRID ────────────────────────────────────────────────────────────
const CategoryGrid = ({ onCategoryClick }) => {
  const categories = [
    { key: 'fashion', icon: Shirt },
    { key: 'beauty', icon: Sparkles },
    { key: 'food', icon: UtensilsCrossed },
    { key: 'tech', icon: Laptop },
    { key: 'fitness', icon: Dumbbell },
    { key: 'lifestyle', icon: Sun },
    { key: 'travel', icon: Plane },
    { key: 'education', icon: GraduationCap },
    { key: 'finance', icon: TrendUp },
    { key: 'gaming', icon: Gamepad2 },
    { key: 'entertainment', icon: Clapperboard },
    { key: 'parenting_family', icon: Baby },
    { key: 'vlogging', icon: Video },
    { key: 'dance', icon: Music },
    { key: 'religious', icon: HandHeart },
    { key: 'news_politics', icon: Newspaper },
    { key: 'video_editing', icon: Film },
    { key: 'ai_content', icon: Bot },
    { key: 'pets_wildlife', icon: PawPrint },
    { key: 'other', icon: LayoutGrid },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {categories.map(({ key, icon: Icon }) => (
        <button key={key} onClick={() => onCategoryClick(key)}
          style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#155DFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="white" strokeWidth={2} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#101828' }}>{getCategoryLabel(key)}</span>
        </button>
      ))}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const CreatorHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [profile, setProfile] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showInstagramReminder, setShowInstagramReminder] = useState(false);
  const [showInstagramChoiceFromHome, setShowInstagramChoiceFromHome] = useState(false);
  const [showGenderMigration, setShowGenderMigration] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes] = await Promise.allSettled([getMyCreatorProfile()]);
        let creatorProfile = null;
        if (profileRes.status === 'fulfilled') {
          creatorProfile = profileRes.value.data.creator;
          setProfile(creatorProfile);
          setShowSetupModal(false);
        } else {
          setProfile(null);
          setShowSetupModal(true);
        }
        const categories = creatorProfile?.categories?.join(',') || '';
        const openingsRes = await searchOpenings({ limit: 6, ...(categories ? { categories } : {}) });
        setOpenings(openingsRes.data.openings?.slice(0, 6) || []);
      } catch { }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // show the "Instagram not connected" reminder once per session, only
  // after profile data has loaded and only if handle is genuinely empty
  useEffect(() => {
    if (!profile) return;
    if (profile?.instagram?.handle) return; // already has a username set
    const alreadyShownThisSession = sessionStorage.getItem('instagramReminderShown');
    if (alreadyShownThisSession) return;
    sessionStorage.setItem('instagramReminderShown', 'true');
    setShowInstagramReminder(true);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    if (profile.gender) return; // already has a gender set
    setShowGenderMigration(true);
  }, [profile]);


  const ig = profile?.instagram;

  const handleCategoryClick = (cat) => {
    navigate(`/creator/browse-brands?category=${cat}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <CreatorHomeSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />
      <PaymentAnnouncementBanner />
      {/* ══ MOBILE ══ */}
      <div className="md:hidden" style={{ position: 'relative' }}>

        {/* dark hero — fixed behind */}
        <div style={{ backgroundColor: '#101828', padding: '16px 16px 28px', position: 'sticky', top: '56px', zIndex: 0 }}>
          <div style={{ height: '28vh', marginBottom: '20px' }}>
            <Carousel height="h-full" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('/creator/browse-brands')}
              style={{ display: 'inline-block', backgroundColor: '#155DFC', color: 'white', fontSize: '12px', fontWeight: 800, padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', marginBottom: '12px', boxShadow: '0 3px 0 0 #0C3EB5' }}>
              Brand Deals →
            </button>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: '8px', letterSpacing: '-0.3px' }}>
              Get Discovered by<br />Top Indian Brands
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', maxWidth: '260px', margin: '0 auto', marginBottom: '8px' }}>
              1,000+ creators landing paid collabs every month on GoodCreator
            </p>
          </div>
        </div>

        {/* white card slides up */}
        <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', padding: '24px 16px 100px', marginTop: '-28px', position: 'relative', zIndex: 2 }}>

          {/* instagram panel */}
          <div style={{ marginBottom: '24px' }}>
            <InstagramPanel ig={ig} onConnect={() => navigate('/creator/profile')} />
          </div>

          {/* ── CATEGORY SECTION (replaces Brands Hiring Now) ── */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#101828' }}> Browse by Category</div>
              <button onClick={() => navigate('/creator/browse-brands')}
                style={{ fontSize: '12px', fontWeight: 700, color: '#155DFC', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                See all <ArrowRight size={12} />
              </button>
            </div>
            <CategoryGrid onCategoryClick={handleCategoryClick} />
          </div>

          {/* creator academy */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#155DFC', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Creator Academy</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#101828', marginBottom: '14px' }}>Level Up Your Content</div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {tips.map((tip, i) => (
                <div key={i} className="flex-shrink-0" style={{ width: '150px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ height: '90px', overflow: 'hidden' }}>
                    <img src={tip.src} alt={tip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{tip.emoji}</span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#101828', marginBottom: '3px' }}>{tip.title}</div>
                    <div style={{ fontSize: '10px', color: '#6B7280', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tip.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* motivational banner */}
          <div style={{ backgroundColor: '#101828', borderRadius: '20px', overflow: 'hidden', position: 'relative', padding: '24px 20px' }}>
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" alt="creators"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>You've got this</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: '6px' }}>Your next viral<br />collab starts here</div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Join 1,000+ creators landing brand deals every month.</p>
              <button onClick={() => navigate('/creator/browse-brands')}
                style={{ padding: '12px 24px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 3px 0 0 #0C3EB5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Find Brand Deals <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ══ DESKTOP ══ */}
      <div className="hidden md:block">
        <div className="max-w-6xl mx-auto px-6 pb-10">

          <div className="grid grid-cols-2 gap-5 pt-6" style={{ minHeight: '60vh' }}>
            <div style={{ minHeight: '400px' }}>
              <Carousel height="h-full" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <InstagramPanel ig={ig} onConnect={() => navigate('/creator/profile')} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate('/creator/browse-brands')}
                  className="flex-1 flex items-center justify-center gap-2 transition-transform hover:scale-95"
                  style={{ padding: '16px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 0 0 #0C3EB5' }}>
                  Find Brand Deals 🚀
                </button>
                <button onClick={() => navigate('/creator/profile')}
                  className="flex items-center gap-1 transition-transform hover:scale-95"
                  style={{ padding: '16px 24px', backgroundColor: 'white', color: '#101828', border: '1.5px solid #E5E7EB', borderRadius: '16px', fontSize: '14px', fontWeight: 900, cursor: 'pointer' }}>
                  Edit Profile <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ── CATEGORY SECTION (replaces Brands Hiring Now) ── */}
          <div style={{ marginTop: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#101828' }}>Browse by Category</div>
              <button onClick={() => navigate('/creator/browse-brands')}
                style={{ fontSize: '13px', fontWeight: 700, color: '#155DFC', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                See all <ArrowRight size={13} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { key: 'fashion', icon: Shirt },
                { key: 'beauty', icon: Sparkles },
                { key: 'food', icon: UtensilsCrossed },
                { key: 'tech', icon: Laptop },
                { key: 'fitness', icon: Dumbbell },
                { key: 'lifestyle', icon: Sun },
                { key: 'travel', icon: Plane },
                { key: 'education', icon: GraduationCap },
                { key: 'finance', icon: TrendUp },
                { key: 'gaming', icon: Gamepad2 },
                { key: 'entertainment', icon: Clapperboard },
                { key: 'parenting_family', icon: Baby },
                { key: 'vlogging', icon: Video },
                { key: 'dance', icon: Music },
                { key: 'religious', icon: HandHeart },
                { key: 'news_politics', icon: Newspaper },
                { key: 'video_editing', icon: Film },
                { key: 'ai_content', icon: Bot },
                { key: 'pets_wildlife', icon: PawPrint },
                { key: 'other', icon: LayoutGrid },
              ].map(({ key, icon: Icon }) => (
                <button key={key} onClick={() => handleCategoryClick(key)}
                  style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '16px', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#155DFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color="white" strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#101828' }}>{getCategoryLabel(key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* creator academy */}
          <div style={{ marginTop: '48px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#155DFC', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Creator Academy</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#101828' }}>Level Up Your Content</div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="cursor-pointer transition-transform hover:scale-95"
                  style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ height: '140px', overflow: 'hidden' }}>
                    <img src={tip.src} alt={tip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{tip.emoji}</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#101828', marginBottom: '4px' }}>{tip.title}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5, marginBottom: '12px' }}>{tip.desc}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#155DFC', display: 'flex', alignItems: 'center', gap: '4px' }}>Read More <ArrowRight size={11} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* banner */}
          <div style={{ marginTop: '48px', backgroundColor: '#101828', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80" alt="creators"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(16,24,40,0.95) 40%, rgba(16,24,40,0.4) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: '48px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>You've got this</div>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: '10px', letterSpacing: '-0.5px' }}>Your next viral collab<br />starts here</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>Join 1,000+ creators landing brand deals on GoodCreator every month.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => navigate('/creator/browse-brands')}
                  style={{ padding: '14px 28px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 0 0 #0C3EB5' }}>
                  Find Brand Deals
                </button>
                <button onClick={() => navigate('/creator/profile')}
                  style={{ padding: '14px 28px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '14px', fontSize: '14px', fontWeight: 900, cursor: 'pointer' }}>
                  Complete Profile
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showSetupModal && (
        <CreatorSetupModal
          onComplete={async () => {
            try {
              const res = await getMyCreatorProfile();
              setProfile(res.data.creator);
              setShowSetupModal(false);
              posthog.capture('profile_completed', { role: 'creator' });
              setShowReferralModal(true);
            } catch { setShowSetupModal(true); }
          }}
        />
      )}

      {showReferralModal && (
        <ReferralSourceModal
          onClose={() => setShowReferralModal(false)}
        />
      )}

      {showInstagramReminder && (
        <InstagramReminderModal
          onClose={() => setShowInstagramReminder(false)}
          onOpenChoice={() => {
            setShowInstagramReminder(false);
            setShowInstagramChoiceFromHome(true);
          }}
        />
      )}

      {showInstagramChoiceFromHome && (
        <InstagramConnectChoiceModal
          onClose={() => setShowInstagramChoiceFromHome(false)}
          onChooseOAuth={() => {
            setShowInstagramChoiceFromHome(false);
            navigate('/creator/profile');
            toast('Click "Connect Instagram" on your profile to complete the connection', { icon: '👉' });
          }}
          onChooseManual={() => {
            setShowInstagramChoiceFromHome(false);
            navigate('/creator/profile');
            toast('Click "Connect Instagram" on your profile to add stats manually', { icon: '👉' });
          }}
        />
      )}

      {showGenderMigration && (
        <GenderMigrationModal
          onSaved={() => {
            setShowGenderMigration(false);
            setProfile(prev => prev ? { ...prev, gender: 'set' } : prev);
          }}
        />
      )}

    </div>
  );
};

export default CreatorHome;
