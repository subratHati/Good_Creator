import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, CheckCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { getOrCreateConversation } from '../../api/chat';
import useAuth from '../../hooks/useAuth';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const CreatorPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(`/creators/${id}`);
        setCreator(res.data.creator);
      } catch {
        setCreator(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <div className="font-semibold text-gray-900">Creator not found</div>
        </div>
      </div>
    );
  }

  const ig = creator.instagram;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold text-gray-900">{creator.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* left column */}
          <div className="md:col-span-1 space-y-4">

            {/* profile card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 overflow-hidden">
                {creator.profilePhoto
                  ? <img src={creator.profilePhoto} alt={creator.name} className="w-full h-full object-cover" />
                  : creator.name?.[0]?.toUpperCase()
                }
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{creator.name}</h1>
                {creator.isAdminVerified && (
                  <CheckCircle size={18} className="text-blue-500" />
                )}
              </div>

              {ig?.handle && (
                <div className="text-sm text-gray-400 mb-1">@{ig.handle}</div>
              )}

              {creator.location?.city && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-3">
                  <MapPin size={11} />
                  {creator.location.city}
                  {creator.location.state ? `, ${creator.location.state}` : ''}
                </div>
              )}

              {/* badges */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${creator.isOpenForCollab
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${creator.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  {creator.isOpenForCollab ? 'Open for collab' : 'Closed'}
                </span>
                {creator.barterEnabled && (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full">
                    Barter ✓
                  </span>
                )}
              </div>

              {creator.bio && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4 text-left">
                  {creator.bio}
                </p>
              )}

              {/* Message button — only show for brands */}
              {user?.role === 'brand' && (
                <button
                  onClick={async () => {
                    const res = await getOrCreateConversation(creator._id);
                    navigate(`/messages/${res.data.conversation._id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors mb-3"
                >
                  💬 Message Creator
                </button>
              )}

              {/* instagram button */}
              {ig?.handle && (

                <a
                  href={"https://instagram.com/" + ig.handle}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                  Visit Instagram
                </a>
              )}
            </div>

            {/* categories */}
            {creator.categories?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Niches</div>
                <div className="flex flex-wrap gap-1.5">
                  {creator.categories.map((cat) => (
                    <span key={cat} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* languages */}
            {creator.languages?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Languages</div>
                <div className="flex flex-wrap gap-1.5">
                  {creator.languages.map((lang) => (
                    <span key={lang} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* right column */}
          <div className="md:col-span-2 space-y-4">

            {/* instagram stats */}
            {ig?.isConnected && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Instagram stats — verified
                </div>

                {/* top 3 stats — most important */}
                <div className="flex items-start mb-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-amber-600 mb-1">
                      {formatNumber(ig.followersCount)}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Followers</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-red-800 mb-1">
                      {ig.engagementRate ? `${ig.engagementRate}%` : '—'}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Engagement</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-blue-800 mb-1">
                      {formatNumber(ig.avgViews)}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Views</div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 mb-4" />

                {/* secondary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Avg Likes', value: formatNumber(ig.avgLikes) },
                    { label: 'Avg Comments', value: formatNumber(ig.avgComments) },
                    { label: 'Avg Reach', value: formatNumber(ig.avgReach) },
                    { label: 'Avg Saves', value: formatNumber(ig.avgSaved) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xs font-semibold text-gray-400 mb-1">{label}</div>
                      <div className="text-base font-bold text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-gray-400 text-right">
                  Based on last {ig.reelsAnalysed || 'recent'} reels/videos ·
                  Last synced: {ig.lastSynced
                    ? new Date(ig.lastSynced).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Never'}
                </div>
              </div>
            )}

            {/* pricing table */}
            {(creator.pricing?.reel > 0 ||
              creator.pricing?.post > 0 ||
              creator.pricing?.story > 0 ||
              creator.pricing?.ugcCollab > 0 ||
              creator.pricing?.ugcNonCollab > 0) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Pricing</div>
                  <div>
                    {[
                      { key: 'reel', label: 'Reel', desc: 'Short video content' },
                      { key: 'post', label: 'Feed post', desc: 'Photo or carousel' },
                      { key: 'story', label: 'Story', desc: '24hr story mention' },
                      { key: 'ugcCollab', label: 'UGC with collab tag', desc: 'With brand tag' },
                      { key: 'ugcNonCollab', label: 'UGC without collab tag', desc: 'Without brand tag' },
                    ]
                      .filter(({ key }) => creator.pricing?.[key] > 0)
                      .map(({ key, label, desc }, i, arr) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900">{label}</div>
                            <div className="text-xs text-gray-400">{desc}</div>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            ₹{creator.pricing[key].toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* sample content */}
            {creator.sampleContentLinks?.filter(l => l).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Sample content</div>
                <div className="space-y-2">
                  {creator.sampleContentLinks.filter(l => l).map((link, i) => (

                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Sample {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* insight screenshot if not connected */}
            {!ig?.isConnected && creator.insightScreenshot && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Instagram insights
                  <span className="ml-2 text-amber-600 normal-case font-normal">(self-reported)</span>
                </div>
                <img
                  src={creator.insightScreenshot}
                  alt="Instagram insights"
                  className="w-full rounded-xl"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorPublicProfile;