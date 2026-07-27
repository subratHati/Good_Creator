import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, CheckCircle, Bookmark } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { getOrCreateConversation } from '../../api/chat';
import { getSavedCreators, saveCreator } from '../../api/brand';
import { addManualInstagramStats } from '../../api/creator';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Never';

const CreatorPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingCreator, setSavingCreator] = useState(false);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const res = await axiosInstance.get(`/creators/${id}`);
        setCreator(res.data.creator);
      } catch {
        setCreator(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCreator();
  }, [id]);

  // check if this creator is already in the brand's saved list
  useEffect(() => {
    if (user?.role !== 'brand') return;
    let cancelled = false;

    const checkSaved = async () => {
      try {
        const res = await getSavedCreators();
        if (cancelled) return;
        const saved = res.data?.savedCreators || [];
        setIsSaved(saved.some((c) => c._id === id));
      } catch {
        // silently leave as not-saved if this check fails —
        // worst case the button shows "Save" when it's actually saved,
        // and the user can re-toggle
      }
    };
    checkSaved();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const handleToggleSave = async () => {
    const previousState = isSaved;
    setIsSaved(!previousState); // optimistic update
    setSavingCreator(true);
    try {
      await saveCreator(creator._id);
      toast.success(previousState ? 'Removed from saved' : 'Creator saved');
    } catch {
      setIsSaved(previousState); // rollback on failure
      toast.error('Something went wrong, please try again');
    } finally {
      setSavingCreator(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#155DFC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <div className="font-semibold text-[#101828]">Creator not found</div>
        </div>
      </div>
    );
  }

  const ig = creator.instagram;
  const hasPricing =
    creator.pricing?.reel > 0 ||
    creator.pricing?.post > 0 ||
    creator.pricing?.story > 0 ||
    creator.pricing?.ugcCollab > 0 ||
    creator.pricing?.ugcNonCollab > 0;

  const handleMessage = async () => {
    try {
      setMessaging(true);
      const res = await getOrCreateConversation(creator._id);
      navigate(`/messages/${res.data.conversation._id}`);
    } finally {
      setMessaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-[#101828] hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold text-[#101828] flex-1">{creator.name}</span>
          {user?.role === 'brand' && (
            <button
              onClick={handleToggleSave}
              disabled={savingCreator}
              className={`p-2 rounded-lg transition-colors disabled:opacity-60 ${isSaved
                  ? 'text-[#155DFC] hover:bg-blue-50'
                  : 'text-gray-400 hover:text-[#101828] hover:bg-gray-100'
                }`}
              aria-label={isSaved ? 'Remove from saved' : 'Save creator'}
              title={isSaved ? 'Remove from saved' : 'Save creator'}
            >
              <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .creator-profile-content {
            padding-bottom: calc(60px + env(safe-area-inset-bottom) + 2rem);
          }
        }
      `}</style>

      <div className="creator-profile-content max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* left column */}
          <div className="md:col-span-1 space-y-4">

            {/* profile card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#155DFC] to-[#0D3FAE] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 overflow-hidden">
                {creator.profilePhoto ? (
                  <img src={creator.profilePhoto} alt={creator.name} className="w-full h-full object-cover" />
                ) : (
                  creator.name?.[0]?.toUpperCase()
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h1 className="text-xl font-bold text-[#101828]">{creator.name}</h1>
                {creator.isAdminVerified && (
                  <CheckCircle size={18} className="text-[#155DFC]" fill="#155DFC" stroke="white" />
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
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${creator.isOpenForCollab ? 'bg-blue-50 text-[#155DFC]' : 'bg-gray-100 text-gray-500'
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${creator.isOpenForCollab ? 'bg-[#155DFC]' : 'bg-gray-400'
                      }`}
                  />
                  {creator.isOpenForCollab ? 'Open for collab' : 'Closed'}
                </span>
                {creator.barterEnabled && (
                  <span className="bg-yellow-50 text-yellow-700 border border-[#FACC15]/40 text-xs font-semibold px-3 py-1 rounded-full">
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
                  onClick={handleMessage}
                  disabled={messaging}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#155DFC] text-white rounded-xl text-sm font-semibold hover:bg-[#0D3FAE] transition-colors mb-3 disabled:opacity-60"
                >
                  {messaging ? 'Opening…' : 'Message Creator'}
                </button>
              )}

              {/* instagram button */}
              {ig?.handle && (
                <a
                  href={`https://instagram.com/${ig.handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#101828] text-white rounded-xl text-sm font-semibold hover:bg-[#1D2939] transition-colors"
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
                    <span
                      key={cat}
                      className="bg-blue-50 text-[#155DFC] text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                    >
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
                    <span
                      key={lang}
                      className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* right column */}
          <div className="md:col-span-2 space-y-4">

            {/* instagram stats — show whenever synced data exists */}
            {ig?.handle && ig?.followersCount > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Instagram stats
                  </div>
                  {ig.isConnected && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#155DFC] bg-blue-50 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} />
                      Verified
                    </span>
                  )}
                </div>

                {/* headline stat — followers, signature yellow underline */}
                <div className="flex items-start mb-4">
                  <div className="flex-1 text-center">
                    <div className="inline-block">
                      <div className="text-3xl font-extrabold text-[#101828] mb-1">
                        {formatNumber(ig.followersCount)}
                      </div>
                      <div className="h-1 bg-[#FACC15] rounded-full mb-1" />
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Followers</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-[#101828] mb-1">
                      {ig.engagementRate ? `${ig.engagementRate}%` : '—'}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Engagement</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-[#101828] mb-1">
                      {formatNumber(ig.avgViews)}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Views</div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 mb-4" />

                {/* secondary stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Avg Likes', value: formatNumber(ig.avgLikes) },
                    { label: 'Avg Comments', value: formatNumber(ig.avgComments) },
                    { label: 'Avg Reach', value: formatNumber(ig.avgReach) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#F8FAFC] rounded-xl p-3 text-center">
                      <div className="text-xs font-semibold text-gray-400 mb-1">{label}</div>
                      <div className="text-base font-bold text-[#101828]">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-gray-400 text-right">
                  Last synced: {formatDate(ig.lastSynced)}
                </div>
              </div>
            )}

            {/* insight screenshot — self-reported, shown only when no synced stats exist */}
            {!(ig?.handle && ig?.followersCount > 0) && creator.insightScreenshot && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Instagram insights
                  </div>
                  <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-[#FACC15]/40 px-2 py-0.5 rounded-full">
                    Self-reported
                  </span>
                </div>
                <img
                  src={creator.insightScreenshot}
                  alt="Instagram insights"
                  className="w-full rounded-xl"
                />
              </div>
            )}

            {/* no synced stats, no screenshot, no handle at all */}
            {!(ig?.followersCount > 0) && !creator.insightScreenshot && !ig?.handle && (
              <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-8 text-center">
                <div className="text-sm text-gray-400">No Instagram data added yet</div>
              </div>
            )}

            {/* pricing table */}
            {hasPricing && (
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
                          <div className="text-sm font-medium text-[#101828]">{label}</div>
                          <div className="text-xs text-gray-400">{desc}</div>
                        </div>
                        <div className="text-sm font-bold text-[#101828]">
                          ₹{creator.pricing[key].toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* sample content */}
            {creator.sampleContentLinks?.filter((l) => l).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Sample content</div>
                <div className="space-y-2">
                  {creator.sampleContentLinks
                    .filter((l) => l)
                    .map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-3 bg-[#F8FAFC] rounded-xl text-sm text-[#155DFC] hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Sample {i + 1}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorPublicProfile;
