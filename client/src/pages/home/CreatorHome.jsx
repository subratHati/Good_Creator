import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { CreatorSetupModal } from '../../components/ProfileSetupModals';
import { getMyCreatorProfile } from '../../api/creator';
import { searchOpenings } from '../../api/openings';
import useAuth from '../../hooks/useAuth';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const categoryColors = {
  fashion: { bg: '#FED7AA', color: '#7C2D12' },
  beauty: { bg: '#FBCFE8', color: '#831843' },
  food: { bg: '#FDE68A', color: '#78350F' },
  tech: { bg: '#DDD6FE', color: '#4C1D95' },
  fitness: { bg: '#BBF7D0', color: '#064E3B' },
  lifestyle: { bg: '#BFDBFE', color: '#1E3A8A' },
  travel: { bg: '#A7F3D0', color: '#064E3B' },
  education: { bg: '#FDE68A', color: '#78350F' },
  finance: { bg: '#BBF7D0', color: '#064E3B' },
  gaming: { bg: '#DDD6FE', color: '#4C1D95' },
  other: { bg: '#E5E7EB', color: '#1F2937' },
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

const Carousel = ({ height = 'h-full' }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`relative ${height} rounded-3xl overflow-hidden select-none`}>
      <img src={slides[current].src} alt="slide" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" />
      <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)' }} />
      <div className="absolute bottom-4 left-5 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className="rounded-full transition-all"
            style={{ width: i === current ? '24px' : '8px', height: '8px', backgroundColor: i === current ? '#FFE234' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  );
};

const InstagramPanel = ({ ig, onConnect }) => {
  const engagementGood = ig?.engagementRate >= 3;
  return (
    <div className="rounded-3xl overflow-hidden border border-gray-100" style={{ backgroundColor: 'white' }}>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: '#F8FAFF' }}>
            <div className="text-xl font-black" style={{ color: '#155DFC' }}>
              {ig?.isConnected ? formatNumber(ig.followersCount) : '—'}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Followers</div>
          </div>
          <div className="rounded-2xl p-3 text-center relative overflow-hidden" style={{ backgroundColor: '#F8FAFF' }}>
            <div className="flex items-center justify-center gap-1">
              <div className="text-xl font-black" style={{ color: ig?.isConnected ? (engagementGood ? '#22C55E' : '#FF3D57') : '#9CA3AF' }}>
                {ig?.isConnected ? (ig.engagementRate ? `${ig.engagementRate}%` : '—') : '—'}
              </div>
              {ig?.isConnected && ig?.engagementRate && (
                <div style={{ animation: 'bounce 1s infinite' }}>
                  {engagementGood ? <TrendingUp size={14} color="#22C55E" /> : <TrendingDown size={14} color="#FF3D57" />}
                </div>
              )}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Engagement</div>
            {ig?.isConnected && ig?.engagementRate && (
              <div className="text-xs font-black mt-0.5" style={{ color: engagementGood ? '#22C55E' : '#FF3D57' }}>
                {engagementGood ? '↑ Great!' : '↓ Improve'}
              </div>
            )}
          </div>
        </div>
        {ig?.isConnected ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-2xl" style={{ backgroundColor: '#F0FFF4' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-xs font-black" style={{ color: '#166834' }}>@{ig.handle} · Instagram Connected</span>
          </div>
        ) : (
          <button onClick={onConnect}
            className="w-full py-3 rounded-2xl font-black text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(90deg, #833AB4, #E1306C, #F77737)' }}>
            Connect Instagram →
          </button>
        )}
      </div>
      <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }`}</style>
    </div>
  );
};

// ─── OPENING CARD — matches BrowseBrands design exactly ──────────────────────
const OpeningCard = ({ opening, size = 'md', onClick }) => {
  const cat = opening.brandId?.category?.toLowerCase() || 'other';
  const catStyle = categoryColors[cat] || categoryColors.other;

  const d = opening.deliverables || {};
  const boxes = [
    { type: 'Reel', qty: d.reels || 0 },
    { type: 'Post', qty: d.posts || 0 },
    { type: 'Story', qty: d.stories || 0 },
    { type: 'UGC', qty: d.ugc || 0 },
  ].filter(b => b.qty > 0);
  if (boxes.length === 0 && opening.contentType) {
    boxes.push({ type: opening.contentType.charAt(0).toUpperCase() + opening.contentType.slice(1), qty: opening.quantity || 1 });
  }

  const w = size === 'sm' ? '173px' : '200px';
  const imgH = size === 'sm' ? '130px' : '130px';

  return (
    <div onClick={onClick}
      className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-95"
      style={{ backgroundColor: 'white', border: '1.5px solid #F0F0F0', boxShadow: '0 2px 0 0 #E5E5E5', width: w }}>

      {/* brand image */}
      <div style={{ height: imgH, width: '100%', overflow: 'hidden', backgroundColor: '#F0F5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {opening.brandId?.logo
          ? <img src={opening.brandId.logo} alt="brand" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          : <span style={{ fontSize: size === 'sm' ? '40px' : '52px' }}>🏷️</span>
        }
      </div>

      <div style={{ padding: size === 'sm' ? '8px' : '12px' }}>
        {/* brand name */}
        <div style={{ fontWeight: 700, fontSize: size === 'sm' ? '13px' : '15px', color: '#16A34A', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {opening.brandId?.brandName || 'Brand'}
        </div>

        {/* category badge */}
        <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', backgroundColor: catStyle.bg, color: catStyle.color, marginBottom: '10px', textTransform: 'capitalize' }}>
          {opening.brandId?.category || opening.contentType || 'Brand'}
        </span>

        {/* deliverable boxes */}
        {boxes.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            {boxes.map((b, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: '#F8FAFF', border: '1.5px solid #DBEAFE', borderRadius: '8px', padding: size === 'sm' ? '3px 2px' : '5px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: size === 'sm' ? '9px' : '9px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{b.type}</div>
                <div style={{ fontSize: size === 'sm' ? '14px' : '15px', fontWeight: 800, color: '#1E3A8A', lineHeight: 1 }}>{b.qty}</div>
              </div>
            ))}
          </div>
        )}

        {/* price box */}
        <div style={{ backgroundColor: '#FACC15', borderRadius: '10px', padding: '7px 10px', marginBottom: '10px', boxShadow: '0 3px 0 0 #B45309' }}>
          <div style={{ fontSize: size === 'sm' ? '11px' : '14px', fontWeight: 900, color: '#0F172A' }}>
            {opening.budgetMin > 0 && opening.budgetMax > 0
              ? `₹${opening.budgetMin.toLocaleString('en-IN')} – ₹${opening.budgetMax.toLocaleString('en-IN')}`
              : opening.budgetMax > 0
                ? `Up to ₹${opening.budgetMax.toLocaleString('en-IN')}`
                : 'Budget on discussion'
            }
          </div>
        </div>

        {/* apply button */}
        <button style={{ width: '100%', padding: size === 'sm' ? '6px 0' : '9px 0', borderRadius: '12px', backgroundColor: '#155DFC', color: 'white', fontSize: size === 'sm' ? '10px' : '11px', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 3px 0 0 #0C3EB5' }}>
          Apply Now
        </button>
      </div>
    </div>
  );
};

const CreatorHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

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

        // fetch openings personalized by creator categories
        const categories = creatorProfile?.categories?.join(',') || '';
        const openingsRes = await searchOpenings({ limit: 6, ...(categories ? { categories } : {}) });
        setOpenings(openingsRes.data.openings?.slice(0, 6) || []);
      } catch { }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const ig = profile?.instagram;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      </div>
    );
  }

  const OpeningCards = ({ size = 'md' }) => (
    openings.length === 0 ? (
      <div className="rounded-2xl p-8 text-center border-2 border-dashed border-gray-100">
        <div className="text-3xl mb-2">📋</div>
        <div className="font-black text-gray-900 text-sm">No openings yet</div>
        <div className="text-xs text-gray-400 mt-1">Brands are posting daily — check back soon!</div>
      </div>
    ) : (
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {openings.map(opening => (
          <OpeningCard key={opening._id} opening={opening} size={size} onClick={() => navigate('/creator/browse-brands')} />
        ))}
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ══ MOBILE ══ */}
      <div className="md:hidden">
        <div style={{ backgroundColor: '#101828', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }} className="px-4 pt-4 pb-6 space-y-3">
          <div style={{ height: '28vh' }}>
            <Carousel height="h-full" />
          </div>
          <div className="text-center py-2">
            <button onClick={() => navigate('/creator/browse-brands')}
              className="inline-block text-xs font-black px-3 py-1.5 rounded-full mb-3"
              style={{ backgroundColor: '#155DFC', color: 'white' }}>
              Brand Deals →
            </button>
            <h2 className="text-xl font-black text-white leading-tight mb-2">Get Discovered by<br />Top Indian Brands</h2>
            <p className="text-xs font-medium mx-auto" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '260px' }}>
              1,000+ creators landing paid collabs every month on GoodCreator
            </p>
          </div>
        </div>

        <div className="bg-white px-4 pt-4 pb-24 space-y-6">
          <InstagramPanel ig={ig} onConnect={() => navigate('/creator/profile')} />

          <div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black" style={{ color: '#101828' }}>Brands Hiring Now</h2>
              <button onClick={() => navigate('/creator/browse-brands')} className="flex items-center gap-1 text-xs font-black" style={{ color: '#155DFC' }}>
                See all <ArrowRight size={12} />
              </button>
            </div>
            <OpeningCards size="sm" />
          </div>

          <div>
            <div className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: '#155DFC' }}>Creator Academy</div>
            <h2 className="text-xl font-black mb-3" style={{ color: '#101828' }}>Level Up Your Content</h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {tips.map((tip, i) => (
                <div key={i} className="flex-shrink-0 w-44 rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0F0F0', boxShadow: '0 2px 0 0 #E5E5E5' }}>
                  <div className="h-28 overflow-hidden">
                    <img src={tip.src} alt={tip.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 bg-white">
                    <div className="text-lg mb-1">{tip.emoji}</div>
                    <div className="font-black text-xs" style={{ color: '#101828' }}>{tip.title}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{tip.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden relative" style={{ backgroundColor: '#101828' }}>
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" alt="creators"
              className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="relative z-10 p-6">
              <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>You've got this 💪</div>
              <h2 className="text-xl font-black text-white leading-tight mb-2">Your next viral<br />collab starts here 🚀</h2>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Join 1,000+ creators landing brand deals every month.</p>
              <button onClick={() => navigate('/creator/browse-brands')}
                className="w-full py-3 rounded-2xl font-black text-sm text-white"
                style={{ backgroundColor: '#155DFC' }}>
                Find Brand Deals →
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
                  className="flex-1 py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 transition-transform hover:scale-95"
                  style={{ backgroundColor: '#155DFC' }}>
                  Find Brand Deals 🚀
                </button>
                <button onClick={() => navigate('/creator/profile')}
                  className="px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-1 transition-transform hover:scale-95"
                  style={{ backgroundColor: 'white', color: '#101828', border: '2px solid #101828' }}>
                  Edit Profile <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-black" style={{ color: '#101828' }}>Brands Hiring Now</h3>
              <button onClick={() => navigate('/creator/browse-brands')} className="flex items-center gap-1 text-sm font-black hover:underline" style={{ color: '#155DFC' }}>
                See all <ArrowRight size={14} />
              </button>
            </div>
            <OpeningCards size="md" />
          </div>

          <div className="mt-12">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#155DFC' }}>Creator Academy</div>
              <h2 className="text-2xl font-black" style={{ color: '#101828' }}>Level Up Your Content</h2>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="rounded-3xl overflow-hidden cursor-pointer transition-transform hover:scale-95"
                  style={{ border: '1.5px solid #F0F0F0', boxShadow: '0 4px 0 0 #E5E5E5' }}>
                  <div className="h-36 overflow-hidden">
                    <img src={tip.src} alt={tip.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 bg-white">
                    <div className="text-2xl mb-2">{tip.emoji}</div>
                    <div className="font-black text-sm mb-1" style={{ color: '#101828' }}>{tip.title}</div>
                    <div className="text-xs text-gray-400 leading-relaxed mb-3">{tip.desc}</div>
                    <div className="flex items-center gap-1 text-xs font-black" style={{ color: '#155DFC' }}>Read More <ArrowRight size={11} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-3xl overflow-hidden relative" style={{ backgroundColor: '#101828' }}>
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80" alt="creators collaborating"
              className="absolute inset-0 w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(16,24,40,0.95) 40%, rgba(16,24,40,0.4) 100%)' }} />
            <div className="relative z-10 p-10">
              <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>You've got this 💪</div>
              <h2 className="text-3xl font-black text-white leading-tight mb-3">Your next viral collab<br />starts here 🚀</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>Join 1,000+ creators landing brand deals on GoodCreator every month.</p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/creator/browse-brands')}
                  className="px-6 py-3 rounded-2xl font-black text-sm text-white transition-transform hover:scale-95"
                  style={{ backgroundColor: '#155DFC' }}>
                  Find Brand Deals
                </button>
                <button onClick={() => navigate('/creator/profile')}
                  className="px-6 py-3 rounded-2xl font-black text-sm transition-transform hover:scale-95"
                  style={{ border: '2px solid rgba(255,255,255,0.3)', color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}>
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
            } catch { setShowSetupModal(true); }
          }}
        />
      )}
    </div>
  );
};

export default CreatorHome;
