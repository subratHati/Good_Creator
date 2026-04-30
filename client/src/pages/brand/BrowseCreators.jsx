import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, ExternalLink } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { searchCreators } from '../../api/creator';
import { saveCreator } from '../../api/brand';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'other'];

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const CreatorCard = ({ creator, onSave, saved }) => {
  const navigate = useNavigate();

  return (

    <div
      onClick={() => navigate(`/creator/${creator._id}`)}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">

      {/* top color band */}
      <div className={`h-2 ${creator.isOpenForCollab ? 'bg-green-400' : 'bg-gray-300'}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
              {creator.profilePhoto
                ? <img src={creator.profilePhoto} alt={creator.name} className="w-full h-full object-cover" />
                : creator.name?.[0]?.toUpperCase() || '?'
              }
            </div>
            <div>
              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                {creator.name}
                {creator.isAdminVerified && (
                  <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {creator.instagram?.handle ? `@${creator.instagram.handle}` : '—'}
                {creator.location?.city ? ` · ${creator.location.city}` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={() => onSave(creator._id)}
            className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
          >
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Followers</div>
            <div className="text-lg font-bold text-orange-500">
              {formatNumber(creator.instagram?.followersCount)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Engagement</div>
            <div className="text-lg font-bold text-orange-500">
              {creator.instagram?.engagementRate
                ? `${creator.instagram.engagementRate}%`
                : '—'}
            </div>
          </div>
        </div>

        {/* tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {creator.categories?.slice(0, 3).map((cat) => (
            <span key={cat} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
              {cat}
            </span>
          ))}
          {creator.barterEnabled && (
            <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
              Barter ✓
            </span>
          )}
        </div>

        {/* pricing */}
        {creator.pricing?.reel > 0 && (
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Reel from</span>
            <span className="text-sm font-bold text-gray-900">
              ₹{creator.pricing.reel.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* status + actions */}
        <div className="flex items-center gap-2 mt-3">
          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${creator.isOpenForCollab
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${creator.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            {creator.isOpenForCollab ? 'Open' : 'Closed'}
          </span>

          <div className="flex gap-1.5 ml-auto">
            {creator.instagram?.handle && (
              <a
                href={`https://instagram.com/${creator.instagram.handle}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={11} />
                Instagram
              </a>
            )}
            <button
             onClick={(e) => { e.stopPropagation(); }}
             className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Enquire
            </button>
          </div>
        </div>
      </div>
    </div>
  )
};

const BrowseCreators = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [creators, setCreators] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    minFollowers: searchParams.get('minFollowers') || '',
    maxFollowers: searchParams.get('maxFollowers') || '',
    minEngagement: searchParams.get('minEngagement') || '',
    barterEnabled: searchParams.get('barterEnabled') || '',
    isOpenForCollab: 'true',
    sortBy: 'newest',
  });

  const fetchCreators = async (f = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (f.category) params.category = f.category;
      if (f.city) params.city = f.city;
      if (f.minFollowers) params.minFollowers = f.minFollowers;
      if (f.maxFollowers) params.maxFollowers = f.maxFollowers;
      if (f.minEngagement) params.minEngagement = f.minEngagement;
      if (f.barterEnabled) params.barterEnabled = f.barterEnabled;
      if (f.isOpenForCollab) params.isOpenForCollab = f.isOpenForCollab;
      if (f.sortBy) params.sortBy = f.sortBy;

      const res = await searchCreators(params);
      setCreators(res.data.creators);
      setTotal(res.data.pagination.total);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchCreators(filters);
  };

  const handleClearFilters = () => {
    const cleared = {
      category: '',
      city: '',
      minFollowers: '',
      maxFollowers: '',
      minEngagement: '',
      barterEnabled: '',
      isOpenForCollab: 'true',
      sortBy: 'newest',
    };
    setFilters(cleared);
    fetchCreators(cleared);
  };

  const handleSave = async (creatorId) => {
    try {
      await saveCreator(creatorId);
      setSavedIds((prev) =>
        prev.includes(creatorId)
          ? prev.filter((id) => id !== creatorId)
          : [...prev, creatorId]
      );
    } catch {
      toast.error('Failed to save creator');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">

        {/* sidebar filters */}
        <div className={`flex-shrink-0 w-64 ${showFilters ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <div className="font-semibold text-gray-900">Filters</div>
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear all
              </button>
            </div>

            {/* niche */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Niche</div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!filters.category
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleFilterChange('category', cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${filters.category === cat
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* follower range */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Followers</div>
              <div className="space-y-2">
                {[
                  { label: 'Nano (1K–10K)', min: '1000', max: '10000' },
                  { label: 'Micro (10K–50K)', min: '10000', max: '50000' },
                  { label: 'Mid (50K–200K)', min: '50000', max: '200000' },
                  { label: 'Macro (200K+)', min: '200000', max: '' },
                ].map((range) => (
                  <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="followerRange"
                      checked={filters.minFollowers === range.min && filters.maxFollowers === range.max}
                      onChange={() => {
                        handleFilterChange('minFollowers', range.min);
                        handleFilterChange('maxFollowers', range.max);
                      }}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* min engagement */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Min engagement
              </div>
              <input
                type="number"
                value={filters.minEngagement}
                onChange={(e) => handleFilterChange('minEngagement', e.target.value)}
                placeholder="e.g. 3"
                min="0"
                max="100"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* city */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">City</div>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* toggles */}
            <div className="mb-5 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Open for collab</span>
                <input
                  type="checkbox"
                  checked={filters.isOpenForCollab === 'true'}
                  onChange={(e) =>
                    handleFilterChange('isOpenForCollab', e.target.checked ? 'true' : '')
                  }
                  className="w-4 h-4 accent-blue-600"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Barter available</span>
                <input
                  type="checkbox"
                  checked={filters.barterEnabled === 'true'}
                  onChange={(e) =>
                    handleFilterChange('barterEnabled', e.target.checked ? 'true' : '')
                  }
                  className="w-4 h-4 accent-blue-600"
                />
              </label>
            </div>

            <button
              onClick={handleApplyFilters}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply filters
            </button>
          </div>
        </div>

        {/* main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Discover Creators
                <span className="ml-3 text-sm font-normal text-gray-500 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                  {total} results
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Find the right creator for your next campaign
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal size={15} />
                Filters
              </button>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  handleFilterChange('sortBy', e.target.value);
                  fetchCreators({ ...filters, sortBy: e.target.value });
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="followers">Most followers</option>
                <option value="engagement">Best engagement</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : creators.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <div className="font-semibold text-gray-900 mb-2">No creators found</div>
              <div className="text-sm text-gray-500">
                Try adjusting your filters to find more creators.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((creator) => (
                <CreatorCard
                  key={creator._id}
                  creator={creator}
                  onSave={handleSave}
                  saved={savedIds.includes(creator._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCreators;