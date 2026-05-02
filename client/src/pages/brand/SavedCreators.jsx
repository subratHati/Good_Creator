import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bookmark, ExternalLink } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getSavedCreators, saveCreator } from '../../api/brand';
import toast from 'react-hot-toast';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const SavedCreators = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getSavedCreators();
        setCreators(res.data.savedCreators);
      } catch {
        setCreators([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleUnsave = async (creatorId) => {
    try {
      await saveCreator(creatorId);
      setCreators((prev) => prev.filter((c) => c._id !== creatorId));
      toast.success('Removed from saved');
    } catch {
      toast.error('Failed to remove');
    }
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
      <div className="max-w-7xl mx-auto px-6 py-8 pb-20 md:pb-0">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Saved Creators</h1>
          <p className="text-gray-500 mt-1">
            {creators.length} creator{creators.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {creators.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">🔖</div>
            <div className="font-semibold text-gray-900 mb-2">No saved creators yet</div>
            <div className="text-sm text-gray-500 mb-6">
              Save creators from the browse page to find them quickly later.
            </div>
            <button
              onClick={() => navigate('/brand/browse-creators')}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Browse creators
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((creator) => (
              <div
                key={creator._id}
                onClick={() => navigate(`/creator/${creator._id}`)}
                className="bg-white border border-gray-200 rounded-2xl p-5 relative cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* header */}
                <div className="flex items-start gap-4 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                      {creator.profilePhoto
                        ? <img src={creator.profilePhoto} alt={creator.name} className="w-full h-full object-cover" />
                        : creator.name?.[0]?.toUpperCase() || '?'
                      }
                    </div>
                    {creator.isAdminVerified && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-gray-900 mb-0.5">{creator.name}</p>
                    <p className="text-xs text-gray-400 mb-1">
                      {creator.instagram?.handle ? `@${creator.instagram.handle}` : '—'}
                    </p>
                    {creator.location?.city && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={11} className="opacity-50" />
                        {creator.location.city}, India
                      </p>
                    )}
                  </div>
                </div>

                {/* unsave button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleUnsave(creator._id); }}
                  className="absolute top-5 right-5 p-1 text-red-400 hover:text-red-600 transition-colors"
                  title="Remove from saved"
                >
                  <Bookmark size={18} fill="currentColor" />
                </button>

                {/* categories */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {creator.categories?.slice(0, 3).map((cat) => (
                    <span key={cat} className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 capitalize border border-gray-200">
                      {cat}
                    </span>
                  ))}
                </div>

                {/* stats */}
                <div className="flex items-start mb-3">
                  <div className="flex-1 text-center">
                    <div className="text-xl font-bold text-amber-600 leading-tight mb-1">
                      {formatNumber(creator.instagram?.followersCount)}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Followers</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xl font-bold text-red-800 leading-tight mb-1">
                      {creator.instagram?.engagementRate
                        ? `${creator.instagram.engagementRate}%`
                        : '—'}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Engagement</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xl font-bold text-blue-800 leading-tight mb-1">
                      {formatNumber(creator.instagram?.avgViews)}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Views</div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 mb-3" />

                {/* badges right */}
                <div className="flex justify-end gap-2 mb-3">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                    creator.isOpenForCollab
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      creator.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {creator.isOpenForCollab ? 'Open' : 'Closed'}
                  </span>
                  {creator.barterEnabled && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Barter
                    </span>
                  )}
                </div>

                {/* price + instagram */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Starting from</span>
                  <span className="text-base font-bold text-gray-900">
                    {creator.pricing?.reel > 0
                      ? <>₹{creator.pricing.reel.toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-400">/ Reel</span></>
                      : <span className="text-gray-400 text-sm">Price not set</span>
                    }
                  </span>
                </div>

                {creator.instagram?.handle ? (
                  
                  <a
                    href={"https://instagram.com/" + creator.instagram.handle}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                    </svg>
                    Visit Instagram
                  </a>
                ) : (
                  <div className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium text-center">
                    Instagram not connected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedCreators;