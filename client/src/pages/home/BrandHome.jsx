import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, TrendingUp, Bell } from 'lucide-react';
import { usePostHog } from '@posthog/react';
import Navbar from '../../components/Navbar';
import { BrandSetupModal } from '../../components/ProfileSetupModals';
import { getMyBrandProfile } from '../../api/brand';
import { getMyOpenings } from '../../api/openings';
import { searchCreators } from '../../api/creator';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import CreatorCardSmall from '../../components/CreatorCardSmall';
import ReferralSourceModal from '../../components/ReferralSourceModal';
import BrandHomeSkeleton from '../../components/BrandHomeSkeleton';
import PaymentAnnouncementBanner from '../../components/PaymentAnnouncementBanner';
import PushPermissionBanner from '../../components/PushPermissionBanner';

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
  { src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80' },
  { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80' },
  { src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80' },
];

const tips = [
  { src: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=400&q=80', emoji: '📝', title: 'Write a Clear Brief', desc: 'Creators perform 2x better when they have detailed campaign briefs.' },
  { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80', emoji: '💰', title: 'Set Realistic Budgets', desc: 'Fair pay attracts quality creators who are invested in your brand.' },
  { src: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=400&q=80', emoji: '📊', title: 'Check Engagement Rate', desc: 'A creator with 10K engaged followers beats 100K passive ones.' },
  { src: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=80', emoji: '🤝', title: 'Build Long-term Ties', desc: 'Repeat collaborations drive 3x more trust with audiences.' },
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
          <button key={i} onClick={() => setCurrent(i)} className="rounded-full transition-all"
            style={{ width: i === current ? '24px' : '8px', height: '8px', backgroundColor: i === current ? '#FFE234' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  );
};

const CampaignPanel = ({ activeCampaigns, onPost }) => (
  <div className="rounded-3xl overflow-hidden flex-1" style={{ backgroundColor: '#101828', boxShadow: '0 6px 0 0 #0a1020' }}>
    <div className="p-5 h-full flex flex-col justify-between">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Active Campaigns</div>
        <div className="text-5xl font-black mb-1" style={{ color: '#FFE234' }}>{activeCampaigns}</div>
        <div className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>campaigns running now</div>
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp size={14} color="#22C55E" />
          <span className="text-xs font-bold" style={{ color: '#22C55E' }}>Your brand is live</span>
        </div>
      </div>
      <button onClick={onPost} className="w-full py-3 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 mt-4"
        style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}>
        <Plus size={16} /> Post Campaign
      </button>
    </div>
  </div>
);

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationsList = () => {
  const navigate = useNavigate();
  const { notifications, loading } = useNotifications({ limit: 8, pollIntervalMs: 60000 });

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-10 flex-1">
          <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center flex-1">
          <div className="text-2xl mb-2">🔔</div>
          <div className="text-xs font-black text-gray-900 mb-1">All caught up!</div>
          <div className="text-xs text-gray-400">New activity will appear here.</div>
        </div>
      ) : (
        // this list scrolls independently — scrolling here does not move the page,
        // scrolling the page (outside this box) moves this section normally with it
        <div className="flex-1 min-h-0 divide-y divide-gray-100 overflow-y-auto">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.action.path)}
              className="w-full text-left px-5 py-3 hover:bg-white transition-colors"
            >
              <div className="text-xs font-bold text-gray-900 leading-snug">{n.title}</div>
              {n.preview && <div className="text-xs text-gray-400 mt-0.5 truncate">{n.preview}</div>}
              <div className="text-xs text-gray-300 mt-1">{timeAgo(n.time)}</div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto px-5 py-3" style={{ borderTop: '1.5px solid #F0F0F0' }}>
        <button
          onClick={() => navigate('/brand/openings')}
          className="text-xs font-black w-full text-center hover:underline"
          style={{ color: '#155DFC' }}
        >
          View all activity →
        </button>
      </div>
    </>
  );
};

const BrandHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [profile, setProfile] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, openingsRes] = await Promise.allSettled([getMyBrandProfile(), getMyOpenings()]);
        let brandProfile = null;
        if (profileRes.status === 'fulfilled') { brandProfile = profileRes.value.data.brand; setProfile(brandProfile); setShowSetupModal(false); }
        else { setProfile(null); setShowSetupModal(true); }
        if (openingsRes.status === 'fulfilled') setOpenings(openingsRes.value.data.openings || []);
        const category = brandProfile?.category;
        const creatorsRes = await searchCreators({ ...(category ? { category } : {}), isOpenForCollab: 'true', limit: 6, sortBy: 'engagement' });
        setSuggestedCreators(creatorsRes.data.creators?.slice(0, 6) || []);
      } catch { }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const activeCount = openings.filter(o => o.status === 'active').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <BrandHomeSkeleton />
        </div>
      </div>
    );
  }

  const CreatorCards = ({ size = 'md' }) => (
    suggestedCreators.length === 0 ? (
      <div className="rounded-2xl p-8 text-center border-2 border-dashed border-gray-100">
        <div className="text-3xl mb-2">👥</div>
        <div className="font-black text-gray-900 text-sm">No creators found yet</div>
        <div className="text-xs text-gray-400 mt-1">Browse all creators to find your perfect match</div>
      </div>
    ) : (
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {suggestedCreators.map(creator => (
          <CreatorCardSmall key={creator._id} creator={creator} size={size} onClick={() => navigate(`/creator/${creator._id}`)} />
        ))}
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <PushPermissionBanner />
      <PaymentAnnouncementBanner />
      <div className="flex-1 overflow-y-auto">

        {/* ══ MOBILE ══ */}
        <div className="md:hidden">
          <div style={{ backgroundColor: '#101828', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }} className="px-4 pt-4 pb-6 space-y-3">
            <div style={{ height: '28vh' }}><Carousel height="h-full" /></div>
            <div className="text-center py-2">
              <button onClick={() => navigate('/brand/browse-creators')} className="inline-block text-xs font-black px-3 py-1.5 rounded-full mb-3" style={{ backgroundColor: '#155DFC', color: 'white' }}>Browse Creators →</button>
              <h2 className="text-xl font-black text-white leading-tight mb-2">Find Creators Who<br />Love Your Brand</h2>
              <p className="text-xs font-medium mx-auto" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '260px' }}>1,000+ creators ready to collab with top Indian brands</p>
            </div>
          </div>

          <div className="bg-white px-4 pt-4 pb-24 space-y-6">
            {/* active campaigns row */}
            <div className="flex items-center justify-between rounded-2xl p-4" style={{ backgroundColor: '#F8FAFF', border: '1.5px solid #DBEAFE' }}>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6B7280' }}>Active Campaigns</div>
                <div className="text-3xl font-black" style={{ color: '#155DFC' }}>{activeCount}</div>
              </div>
              <button onClick={() => navigate('/brand/openings/create')} className="flex items-center gap-1.5 px-4 py-3 rounded-2xl font-black text-white text-sm" style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}>
                <Plus size={14} /> Post Campaign
              </button>
            </div>

            {/* featured creators */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black" style={{ color: '#101828' }}>
                  {profile?.category ? `🎯 ${getCategoryLabel(profile.category)} Creators` : '🎯 Featured Creators'}
                </h2>
                <button onClick={() => navigate('/brand/browse-creators')} className="flex items-center gap-1 text-xs font-black" style={{ color: '#155DFC' }}>See all <ArrowRight size={12} /></button>
              </div>
              <CreatorCards size="sm" />
            </div>

            {/* tips */}
            <div>
              <div className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: '#155DFC' }}>Brand Academy</div>
              <h2 className="text-xl font-black mb-3" style={{ color: '#101828' }}>Run Great Campaigns</h2>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {tips.map((tip, i) => (
                  <div key={i} className="flex-shrink-0 w-44 rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0F0F0', boxShadow: '0 2px 0 0 #E5E5E5' }}>
                    <div className="h-28 overflow-hidden"><img src={tip.src} alt={tip.title} className="w-full h-full object-cover" /></div>
                    <div className="p-3 bg-white">
                      <div className="text-lg mb-1">{tip.emoji}</div>
                      <div className="font-black text-xs" style={{ color: '#101828' }}>{tip.title}</div>
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* banner */}
            <div className="rounded-3xl overflow-hidden relative" style={{ backgroundColor: '#101828' }}>
              <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80" alt="brand collab" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="relative z-10 p-6">
                <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Your brand deserves the best 🏆</div>
                <h2 className="text-xl font-black text-white leading-tight mb-2">Launch your next viral campaign today 🚀</h2>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Join 500+ brands finding their perfect creators on GoodCreator.</p>
                <button onClick={() => navigate('/brand/browse-creators')} className="w-full py-3 rounded-2xl font-black text-sm text-white" style={{ backgroundColor: '#155DFC' }}>Browse Creators →</button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ DESKTOP ══ */}
        <div className="hidden md:block">
          <div className="max-w-6xl mx-auto px-6 pb-10">

            <div className="grid grid-cols-2 gap-5 pt-6" style={{ minHeight: '60vh' }}>
              <div style={{ minHeight: '400px' }}><Carousel height="h-full" /></div>
              <div className="flex flex-col gap-4">
                <CampaignPanel activeCampaigns={activeCount} onPost={() => navigate('/brand/openings/create')} />
                <div className="flex gap-3">
                  <button onClick={() => navigate('/brand/browse-creators')} className="flex-1 py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 transition-transform hover:scale-95" style={{ backgroundColor: '#155DFC' }}>Browse Creators 🔍</button>
                  <button onClick={() => navigate('/brand/openings')} className="px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-1 transition-transform hover:scale-95" style={{ backgroundColor: 'white', color: '#101828', border: '2px solid #101828' }}>My Campaigns <ArrowRight size={14} /></button>
                </div>
              </div>
            </div>

            {/* Featured Creators (60%) + Notifications (40%) — separate cards, matched height */}
            <div className="mt-12 grid gap-5" style={{ gridTemplateColumns: '60% 40%' }}>

              {/* creators card */}
              <div className="rounded-3xl overflow-hidden p-6 min-w-0 flex flex-col" style={{ border: '1.5px solid #F0F0F0', boxShadow: '0 4px 0 0 #E5E5E5' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-black" style={{ color: '#101828' }}>
                    {profile?.category ? `🎯 ${getCategoryLabel(profile.category)} Creators` : '🎯 Featured Creators'}
                  </h2>
                  <button onClick={() => navigate('/brand/browse-creators')} className="flex items-center gap-1 text-sm font-black hover:underline" style={{ color: '#155DFC' }}>See all <ArrowRight size={14} /></button>
                </div>
                <CreatorCards size="md" />
              </div>

              {/* notifications card — its own internal scroll, section scrolls normally with the page */}
              <div className="rounded-3xl overflow-hidden min-w-0 flex flex-col" style={{ border: '1.5px solid #F0F0F0', boxShadow: '0 4px 0 0 #E5E5E5' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1.5px solid #F0F0F0' }}>
                  <div className="flex items-center gap-2">
                    <Bell size={15} style={{ color: '#155DFC' }} />
                    <span className="font-black text-sm" style={{ color: '#101828' }}>Notifications</span>
                  </div>
                </div>
                <NotificationsList />
              </div>

            </div>

            <div className="mt-12">
              <div className="mb-5">
                <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#155DFC' }}>Brand Academy</div>
                <h2 className="text-2xl font-black" style={{ color: '#101828' }}>Run Great Campaigns</h2>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {tips.map((tip, i) => (
                  <div key={i} className="rounded-3xl overflow-hidden cursor-pointer transition-transform hover:scale-95" style={{ border: '1.5px solid #F0F0F0', boxShadow: '0 4px 0 0 #E5E5E5' }}>
                    <div className="h-36 overflow-hidden"><img src={tip.src} alt={tip.title} className="w-full h-full object-cover" /></div>
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
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80" alt="brand campaign" className="absolute inset-0 w-full h-full object-cover opacity-25" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(16,24,40,0.95) 40%, rgba(16,24,40,0.4) 100%)' }} />
              <div className="relative z-10 p-10">
                <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Your brand deserves the best 🏆</div>
                <h2 className="text-3xl font-black text-white leading-tight mb-3">Launch your next viral<br />campaign today 🚀</h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>Join 500+ brands finding their perfect creators on GoodCreator every month.</p>
                <div className="flex gap-3">
                  <button onClick={() => navigate('/brand/browse-creators')} className="px-6 py-3 rounded-2xl font-black text-sm text-white transition-transform hover:scale-95" style={{ backgroundColor: '#155DFC' }}>Browse Creators</button>
                  <button onClick={() => navigate('/brand/openings/create')} className="px-6 py-3 rounded-2xl font-black text-sm transition-transform hover:scale-95" style={{ border: '2px solid rgba(255,255,255,0.3)', color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}>Post a Campaign</button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {showSetupModal && (
        <BrandSetupModal
          onComplete={async () => {
            try {
              const res = await getMyBrandProfile();
              setProfile(res.data.brand);
              setShowSetupModal(false);
              posthog.capture('profile_completed', { role: 'brand' });
              setShowReferralModal(true);
            }
            catch { setShowSetupModal(true); }
          }}
        />
      )}

      {showReferralModal && (
        <ReferralSourceModal
          onClose={() => setShowReferralModal(false)}
        />
      )}
    </div>
  );
};

export default BrandHome;
