import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, Eye, Star, Bookmark, ExternalLink, Bell } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getMyCreatorProfile, searchCreators } from '../../api/creator';
import { searchOpenings } from '../../api/openings';
import { getMyApplications } from '../../api/applications';
import useAuth from '../../hooks/useAuth';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const statusColors = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  viewed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  shortlisted: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
};

const CreatorHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, openingsRes, appsRes] = await Promise.allSettled([
          getMyCreatorProfile(),
          searchOpenings({ limit: 4 }),
          getMyApplications(),
        ]);

        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.creator);
        if (openingsRes.status === 'fulfilled') setOpenings(openingsRes.value.data.openings?.slice(0, 4) || []);
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data.applications?.slice(0, 3) || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const ig = profile?.instagram;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

        {/* PROFILE HERO STRIP */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">

            {/* avatar + info */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-bold text-2xl">
                  {profile?.profilePhoto
                    ? <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                    : profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()
                  }
                </div>
                {ig?.isConnected && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white" title="Instagram connected" />
                )}
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">{greeting()},</div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {profile?.name || user?.email?.split('@')[0]}
                </h1>
                {ig?.handle && (
                  <div className="text-sm text-gray-400">@{ig.handle}</div>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    profile?.isOpenForCollab ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile?.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {profile?.isOpenForCollab ? 'Open for collab' : 'Closed'}
                  </span>
                  {profile?.barterEnabled && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Barter ✓</span>
                  )}
                </div>
              </div>
            </div>

            {/* stats */}
            {ig?.isConnected ? (
              <div className="flex items-start gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-amber-600">{formatNumber(ig.followersCount)}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-red-800">{ig.engagementRate ? `${ig.engagementRate}%` : '—'}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-blue-800">{formatNumber(ig.avgViews)}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Avg Views</div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/creator/profile')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                Connect Instagram
              </button>
            )}

            {/* edit profile */}
            <button
              onClick={() => navigate('/creator/profile')}
              className="hidden md:flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              Edit profile <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* profile incomplete warning */}
        {!profile && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-blue-900 text-sm">Complete your profile</div>
              <div className="text-xs text-blue-700 mt-0.5">Set up your creator profile so brands can discover you.</div>
            </div>
            <button
              onClick={() => navigate('/creator/profile')}
              className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Set up now
            </button>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Browse Openings', desc: 'Find brands hiring', icon: '🔍', path: '/creator/browse-brands', color: 'bg-blue-50' },
            { label: 'My Applications', desc: 'Track your collabs', icon: '📋', path: '/creator/applications', color: 'bg-amber-50' },
            { label: 'Enquiries', desc: 'Brand messages', icon: '💬', path: '/creator/enquiries', color: 'bg-green-50' },
            { label: 'Edit Profile', desc: 'Update your info', icon: '✏️', path: '/creator/profile', color: 'bg-purple-50' },
          ].map(({ label, desc, icon, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-xl mb-3`}>{icon}</div>
              <div className="text-sm font-semibold text-gray-900">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* MATCHING OPENINGS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Openings for you</h2>
                <div className="text-xs text-gray-400 mt-0.5">Latest brand opportunities</div>
              </div>
              <button
                onClick={() => navigate('/creator/browse-brands')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                See all <ArrowRight size={12} />
              </button>
            </div>

            {openings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-sm text-gray-500">No openings yet. Check back soon.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {openings.map((opening) => (
                  <div
                    key={opening._id}
                    onClick={() => navigate('/creator/browse-brands')}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {opening.brandId?.logo
                        ? <img src={opening.brandId.logo} alt="brand" className="w-full h-full object-cover" />
                        : <span className="text-base">🏷️</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{opening.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {opening.brandId?.brandName || 'Brand'}
                        {opening.budgetMax > 0 ? ` · ₹${opening.budgetMin?.toLocaleString('en-IN')}–₹${opening.budgetMax?.toLocaleString('en-IN')}` : ''}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${
                      opening.contentType === 'reel' ? 'bg-blue-50 text-blue-700' :
                      opening.contentType === 'post' ? 'bg-purple-50 text-purple-700' :
                      opening.contentType === 'story' ? 'bg-orange-50 text-orange-700' :
                      'bg-teal-50 text-teal-700'
                    }`}>
                      {opening.contentType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT APPLICATIONS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Recent applications</h2>
                <div className="text-xs text-gray-400 mt-0.5">Track your collab status</div>
              </div>
              <button
                onClick={() => navigate('/creator/applications')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                See all <ArrowRight size={12} />
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-sm text-gray-500 mb-3">No applications yet.</div>
                <button
                  onClick={() => navigate('/creator/browse-brands')}
                  className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Browse openings
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => {
                  const s = statusColors[app.status] || statusColors.pending;
                  return (
                    <div key={app._id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {app.brandId?.logo
                          ? <img src={app.brandId.logo} alt="brand" className="w-full h-full object-cover" />
                          : <span className="text-base">🏷️</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {app.openingId?.title || 'Opening'}
                        </div>
                        <div className="text-xs text-gray-400">{app.brandId?.brandName || 'Brand'}</div>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 capitalize ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* INSTAGRAM STATS DETAIL */}
        {ig?.isConnected && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Instagram performance</h2>
                <div className="text-xs text-gray-400 mt-0.5">
                  Based on last {ig.reelsAnalysed || 'recent'} reels/videos ·
                  Synced {ig.lastSynced ? new Date(ig.lastSynced).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'never'}
                </div>
              </div>
              <button
                onClick={() => navigate('/creator/profile')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Sync now
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Avg Likes', value: formatNumber(ig.avgLikes), color: 'text-amber-600' },
                { label: 'Avg Comments', value: formatNumber(ig.avgComments), color: 'text-blue-600' },
                { label: 'Avg Reach', value: formatNumber(ig.avgReach), color: 'text-green-600' },
                { label: 'Avg Saves', value: formatNumber(ig.avgSaved), color: 'text-purple-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorHome;
