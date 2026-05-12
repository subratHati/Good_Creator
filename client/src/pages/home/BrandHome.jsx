import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Users, MapPin, ExternalLink } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { BrandSetupModal } from '../../components/ProfileSetupModals';
import { getMyBrandProfile, getSavedCreators } from '../../api/brand';
import { getMyOpenings } from '../../api/openings';
import { searchCreators } from '../../api/creator';
import useAuth from '../../hooks/useAuth';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const statusColors = {
  active: 'bg-green-50 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
  draft: 'bg-yellow-50 text-yellow-700',
};

const contentColors = {
  reel: 'bg-blue-50 text-blue-700',
  post: 'bg-purple-50 text-purple-700',
  story: 'bg-orange-50 text-orange-700',
  ugc: 'bg-teal-50 text-teal-700',
};

const BrandHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [savedCreators, setSavedCreators] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await getMyBrandProfile();
      setProfile(res.data.brand);
      setShowSetupModal(false);
    } catch {
      setProfile(null);
      setShowSetupModal(true);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, openingsRes, savedRes] = await Promise.allSettled([
          getMyBrandProfile(),
          getMyOpenings(),
          getSavedCreators(),
        ]);

        let brandProfile = null;
        if (profileRes.status === 'fulfilled') {
          brandProfile = profileRes.value.data.brand;
          setProfile(brandProfile);
          setShowSetupModal(false);
        } else {
          setProfile(null);
          setShowSetupModal(true);
        }

        if (openingsRes.status === 'fulfilled') setOpenings(openingsRes.value.data.openings?.slice(0, 4) || []);
        if (savedRes.status === 'fulfilled') setSavedCreators(savedRes.value.data.savedCreators?.slice(0, 3) || []);

        const category = brandProfile?.category;
        const creatorsRes = await searchCreators({
          ...(category ? { category } : {}),
          isOpenForCollab: 'true',
          limit: 4,
          sortBy: 'engagement',
        });
        setSuggestedCreators(creatorsRes.data.creators?.slice(0, 4) || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const activeOpenings = openings.filter(o => o.status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 pb-20 md:pb-0">

        {/* BRAND HERO STRIP */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                {profile?.logo
                  ? <img src={profile.logo} alt={profile.brandName} className="w-full h-full object-cover" />
                  : <span className="text-2xl">🏷️</span>
                }
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">{greeting()},</div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {profile?.brandName || user?.email?.split('@')[0]}
                </h1>
                {profile?.category && (
                  <div className="text-sm text-gray-400 capitalize">{profile.category}</div>
                )}
                {profile?.location?.city && (
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} />
                    {profile.location.city}, India
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-6 md:gap-10 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{activeOpenings.length}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Active openings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{savedCreators.length}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Saved creators</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/brand/openings/create')}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              <Plus size={16} />
              Post opening
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Browse Creators', desc: 'Find the right fit', icon: '🔍', path: '/brand/browse-creators', color: 'bg-blue-50' },
            { label: 'Post Opening', desc: 'Let creators apply', icon: '📢', path: '/brand/openings/create', color: 'bg-orange-50' },
            { label: 'My Openings', desc: 'View applications', icon: '📋', path: '/brand/openings', color: 'bg-green-50' },
            { label: 'Saved Creators', desc: 'Your shortlist', icon: '🔖', path: '/brand/saved-creators', color: 'bg-purple-50' },
          ].map(({ label, desc, icon, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-xl mb-3`}>{icon}</div>
              <div className="text-sm font-semibold text-gray-900">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* ACTIVE OPENINGS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Active openings</h2>
                <div className="text-xs text-gray-400 mt-0.5">{activeOpenings.length} currently live</div>
              </div>
              <button onClick={() => navigate('/brand/openings')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                Manage <ArrowRight size={12} />
              </button>
            </div>

            {openings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📢</div>
                <div className="text-sm text-gray-500 mb-3">No openings yet. Post your first one.</div>
                <button onClick={() => navigate('/brand/openings/create')} className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors">
                  Post opening
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {openings.map((opening) => (
                  <div key={opening._id} onClick={() => navigate(`/brand/openings/${opening._id}/applicants`)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="text-sm font-semibold text-gray-900 truncate">{opening.title}</div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${contentColors[opening.contentType]}`}>
                          {opening.contentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className={`font-semibold capitalize ${statusColors[opening.status]?.split(' ')[1]}`}>{opening.status}</span>
                        {opening.budgetMax > 0 && <span>₹{opening.budgetMin?.toLocaleString('en-IN')}–₹{opening.budgetMax?.toLocaleString('en-IN')}</span>}
                        {opening.deadline && <span>Due {new Date(opening.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 bg-gray-50 px-2.5 py-1 rounded-lg">
                      <Users size={12} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600">View</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SAVED CREATORS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Saved creators</h2>
                <div className="text-xs text-gray-400 mt-0.5">Your shortlist</div>
              </div>
              <button onClick={() => navigate('/brand/saved-creators')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                See all <ArrowRight size={12} />
              </button>
            </div>

            {savedCreators.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🔖</div>
                <div className="text-sm text-gray-500 mb-3">No saved creators yet.</div>
                <button onClick={() => navigate('/brand/browse-creators')} className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors">
                  Browse creators
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedCreators.map((creator) => (
                  <div key={creator._id} onClick={() => navigate(`/creator/${creator._id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {creator.profilePhoto
                        ? <img src={creator.profilePhoto} alt={creator.name} className="w-full h-full object-cover" />
                        : creator.name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{creator.name}</div>
                      <div className="text-xs text-gray-400">
                        {creator.instagram?.handle ? `@${creator.instagram.handle}` : ''}
                        {creator.instagram?.followersCount ? ` · ${formatNumber(creator.instagram.followersCount)} followers` : ''}
                      </div>
                    </div>
                    {creator.instagram?.handle && (
                      <a href={"https://instagram.com/" + creator.instagram.handle} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SUGGESTED CREATORS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">
                Creators you might like
                {profile?.category && <span className="text-gray-400 font-normal text-sm ml-1">— {profile.category} niche</span>}
              </h2>
              <div className="text-xs text-gray-400 mt-0.5">Open for collab, sorted by engagement</div>
            </div>
            <button onClick={() => navigate('/brand/browse-creators')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              Browse all <ArrowRight size={12} />
            </button>
          </div>

          {suggestedCreators.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm text-gray-500">No creators found yet.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {suggestedCreators.map((creator) => (
                <div key={creator._id} onClick={() => navigate(`/creator/${creator._id}`)}
                  className="border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {creator.profilePhoto
                        ? <img src={creator.profilePhoto} alt={creator.name} className="w-full h-full object-cover" />
                        : creator.name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{creator.name}</div>
                      <div className="text-xs text-gray-400 truncate">{creator.instagram?.handle ? `@${creator.instagram.handle}` : '—'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 text-center">
                      <div className="text-sm font-bold text-amber-600">{formatNumber(creator.instagram?.followersCount)}</div>
                      <div className="text-xs text-gray-400">Followers</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-sm font-bold text-red-700">{creator.instagram?.engagementRate ? `${creator.instagram.engagementRate}%` : '—'}</div>
                      <div className="text-xs text-gray-400">Engage</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {creator.categories?.slice(0, 2).map((cat) => (
                      <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{cat}</span>
                    ))}
                  </div>
                  {creator.instagram?.handle && (
                    <a href={"https://instagram.com/" + creator.instagram.handle} target="_blank" rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                      </svg>
                      Instagram
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* mobile post opening button */}
        <div className="md:hidden">
          <button onClick={() => navigate('/brand/openings/create')}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Post a new opening
          </button>
        </div>

      </div>

      {/* brand profile setup modal — cannot be dismissed */}
      {showSetupModal && (
        <BrandSetupModal
          onComplete={async () => {
            try {
              const res = await getMyBrandProfile();
              setProfile(res.data.brand);
              setShowSetupModal(false);
            } catch {
              setShowSetupModal(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default BrandHome;
