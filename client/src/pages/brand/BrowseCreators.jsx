import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, MapPin, Bookmark, ChevronDown } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { searchCreators } from '../../api/creator';
import { saveCreator, getSavedCreators } from '../../api/brand';
import toast from 'react-hot-toast';

const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'other'];

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const CreatorCard = ({ creator, onSave, saved, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white border border-gray-200 rounded-2xl relative cursor-pointer hover:shadow-md transition-all"
  >
    {/* save button */}
    <button
      onClick={(e) => { e.stopPropagation(); onSave(creator._id); }}
      className={`absolute top-3 right-3 p-1 transition-all z-10 ${saved ? 'text-red-500' : 'text-gray-300 hover:text-gray-500'}`}
    >
      <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
    </button>

    {/* ── MOBILE LAYOUT ── */}
    <div className="md:hidden p-3">
      {/* avatar centered */}
      <div className="flex flex-col items-center mb-2.5">
        <div className="relative mb-1.5">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
            {creator.profilePhoto
              ? <img src={creator.profilePhoto} alt={creator.name} className="w-full h-full object-cover" />
              : creator.name?.[0]?.toUpperCase() || '?'
            }
          </div>
          {creator.isAdminVerified && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
        <p className="text-xs font-bold text-gray-900 text-center w-full truncate px-1">{creator.name}</p>
        <p className="text-xs text-gray-400 text-center w-full truncate px-1">
          {creator.instagram?.handle ? `@${creator.instagram.handle}` : '—'}
        </p>
        {creator.location?.city && (
          <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
            <MapPin size={8} className="opacity-50 flex-shrink-0" />
            <span className="truncate" style={{ fontSize: '10px' }}>{creator.location.city}</span>
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-1 mb-2.5">
        {creator.categories?.slice(0, 2).map((cat) => (
          <span key={cat} style={{ fontSize: '9px' }} className="font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{cat}</span>
        ))}
      </div>
      <div className="flex items-start mb-2.5">
        <div className="flex-1 text-center">
          <div className="font-bold text-amber-600 leading-tight" style={{ fontSize: '13px' }}>{formatNumber(creator.instagram?.followersCount)}</div>
          <div className="font-bold text-gray-400 uppercase tracking-wider mt-0.5" style={{ fontSize: '7px' }}>Followers</div>
        </div>
        <div className="flex-1 text-center">
          <div className="font-bold text-red-800 leading-tight" style={{ fontSize: '13px' }}>
            {creator.instagram?.engagementRate ? `${creator.instagram.engagementRate}%` : '—'}
          </div>
          <div className="font-bold text-gray-400 uppercase tracking-wider mt-0.5" style={{ fontSize: '7px' }}>Engage</div>
        </div>
        <div className="flex-1 text-center">
          <div className="font-bold text-blue-800 leading-tight" style={{ fontSize: '13px' }}>{formatNumber(creator.instagram?.avgViews)}</div>
          <div className="font-bold text-gray-400 uppercase tracking-wider mt-0.5" style={{ fontSize: '7px' }}>Views</div>
        </div>
      </div>
      <div className="h-px bg-gray-100 mb-2.5" />
      <div className="flex items-center justify-between mb-2.5">
        <span className={`flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-full ${creator.isOpenForCollab ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`} style={{ fontSize: '9px' }}>
          <span className={`w-1 h-1 rounded-full flex-shrink-0 ${creator.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'}`} />
          {creator.isOpenForCollab ? 'Open' : 'Closed'}
        </span>
        <span className="font-bold text-gray-900" style={{ fontSize: '11px' }}>
          {creator.pricing?.reel > 0 ? `₹${creator.pricing.reel.toLocaleString('en-IN')}` : <span className="text-gray-400 font-normal">—</span>}
        </span>
      </div>
      {creator.instagram?.handle ? (
        <a href={"https://instagram.com/" + creator.instagram.handle} target="_blank" rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-center gap-1 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          style={{ fontSize: '10px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
          Instagram
        </a>
      ) : (
        <div className="w-full py-2 bg-gray-100 text-gray-400 rounded-xl font-medium text-center" style={{ fontSize: '10px' }}>Not connected</div>
      )}
    </div>

    {/* ── DESKTOP LAYOUT ── */}
    <div className="hidden md:block p-5">
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
          <p className="text-lg font-bold text-gray-900 mb-0.5 leading-tight">{creator.name}</p>
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

      {/* categories */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {creator.categories?.slice(0, 3).map((cat) => (
          <span key={cat} className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 capitalize border border-gray-200">{cat}</span>
        ))}
      </div>

      {/* stats */}
      <div className="flex items-start mb-3">
        <div className="flex-1 text-center">
          <div className="text-xl font-bold text-amber-600 leading-tight mb-1">{formatNumber(creator.instagram?.followersCount)}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Followers</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-xl font-bold text-red-800 leading-tight mb-1">
            {creator.instagram?.engagementRate ? `${creator.instagram.engagementRate}%` : '—'}
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Engagement</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-xl font-bold text-blue-800 leading-tight mb-1">{formatNumber(creator.instagram?.avgViews)}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Views</div>
        </div>
      </div>

      <div className="h-px bg-gray-100 mb-3" />

      {/* badges right */}
      <div className="flex justify-end gap-2 mb-3 flex-wrap">
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${creator.isOpenForCollab ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${creator.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'}`} />
          {creator.isOpenForCollab ? 'Open for collab' : 'Closed'}
        </span>
        {creator.barterEnabled && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Barter</span>
        )}
      </div>

      {/* price */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">Starting from</span>
        <span className="text-base font-bold text-gray-900">
          {creator.pricing?.reel > 0
            ? <>₹{creator.pricing.reel.toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-400">/ Reel</span></>
            : <span className="text-gray-400 text-sm">Price not set</span>
          }
        </span>
      </div>

      {/* instagram button */}
      {creator.instagram?.handle ? (
        <a href={"https://instagram.com/" + creator.instagram.handle} target="_blank" rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
          Visit Instagram
        </a>
      ) : (
        <div className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium text-center">Instagram not connected</div>
      )}
    </div>
  </div>
);

// Filter Bottom Sheet for mobile
const FilterSheet = ({ open, onClose, filters, onFilterChange, onApply, onClear }) => {
  if (!open) return null;
  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
        onClick={onClose}
      />
      {/* sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden"
        style={{ maxHeight: '85vh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="font-bold text-gray-900">Filters</div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* niche */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Niche</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFilterChange('category', '')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  !filters.category ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'
                }`}
              >All</button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onFilterChange('category', cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                    filters.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'
                  }`}
                >{cat}</button>
              ))}
            </div>
          </div>

          {/* followers */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Followers</div>
            <div className="space-y-2.5">
              {[
                { label: 'Nano (1K–10K)', min: '1000', max: '10000' },
                { label: 'Micro (10K–50K)', min: '10000', max: '50000' },
                { label: 'Mid (50K–200K)', min: '50000', max: '200000' },
                { label: 'Macro (200K+)', min: '200000', max: '' },
              ].map((range) => (
                <label key={range.label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="followerRange"
                    checked={filters.minFollowers === range.min && filters.maxFollowers === range.max}
                    onChange={() => {
                      onFilterChange('minFollowers', range.min);
                      onFilterChange('maxFollowers', range.max);
                    }}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* min engagement */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Min engagement %</div>
            <input
              type="number"
              value={filters.minEngagement}
              onChange={(e) => onFilterChange('minEngagement', e.target.value)}
              placeholder="e.g. 3"
              min="0" max="100"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* city */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">City</div>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => onFilterChange('city', e.target.value)}
              placeholder="e.g. Mumbai"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* toggles */}
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Open for collab only</span>
              <input
                type="checkbox"
                checked={filters.isOpenForCollab === 'true'}
                onChange={(e) => onFilterChange('isOpenForCollab', e.target.checked ? 'true' : '')}
                className="w-5 h-5 accent-blue-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Barter available</span>
              <input
                type="checkbox"
                checked={filters.barterEnabled === 'true'}
                onChange={(e) => onFilterChange('barterEnabled', e.target.checked ? 'true' : '')}
                className="w-5 h-5 accent-blue-600"
              />
            </label>
          </div>
        </div>

        {/* sticky bottom buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          <button
            onClick={onClear}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600"
          >
            Clear all
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold"
          >
            Apply filters
          </button>
        </div>
      </div>
    </>
  );
};

const BrowseCreators = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false); // desktop sidebar toggle
  const [showFilterSheet, setShowFilterSheet] = useState(false); // mobile bottom sheet

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    minFollowers: '',
    maxFollowers: '',
    minEngagement: '',
    barterEnabled: '',
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
    const init = async () => {
      try {
        const savedRes = await getSavedCreators();
        const ids = savedRes.data.savedCreators.map((c) => c._id);
        setSavedIds(ids);
      } catch {}
      fetchCreators();
    };
    init();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    const cleared = {
      category: '', city: '', minFollowers: '', maxFollowers: '',
      minEngagement: '', barterEnabled: '', isOpenForCollab: 'true', sortBy: 'newest',
    };
    setFilters(cleared);
    fetchCreators(cleared);
  };

  const handleSave = async (creatorId) => {
    try {
      await saveCreator(creatorId);
      setSavedIds((prev) =>
        prev.includes(creatorId) ? prev.filter((id) => id !== creatorId) : [...prev, creatorId]
      );
    } catch {
      toast.error('Failed to save creator');
    }
  };

  // active filter count for badge
  const activeFilterCount = [
    filters.category, filters.city, filters.minFollowers,
    filters.minEngagement, filters.barterEnabled,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* mobile filter bottom sheet */}
      <FilterSheet
        open={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={() => fetchCreators(filters)}
        onClear={handleClearFilters}
      />

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-30">
        <div className="flex items-center gap-2">
          {/* category pills horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto flex-1 pb-0.5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => { handleFilterChange('category', ''); fetchCreators({ ...filters, category: '' }); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                !filters.category ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white'
              }`}
            >All</button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { handleFilterChange('category', cat); fetchCreators({ ...filters, category: cat }); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all ${
                  filters.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white'
                }`}
              >{cat}</button>
            ))}
          </div>

          {/* filter button */}
          <button
            onClick={() => setShowFilterSheet(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-semibold text-gray-600 bg-white relative"
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => { handleFilterChange('sortBy', e.target.value); fetchCreators({ ...filters, sortBy: e.target.value }); }}
            className="flex-shrink-0 px-2 py-1.5 border border-gray-200 rounded-full text-xs text-gray-600 bg-white focus:outline-none"
          >
            <option value="newest">New</option>
            <option value="followers">Followers</option>
            <option value="engagement">Engage</option>
          </select>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 md:flex gap-6 pb-24 md:pb-8">

        {/* desktop sidebar — hidden on mobile */}
        {showFilters && (
          <div className="hidden md:block flex-shrink-0 w-60">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <div className="font-semibold text-gray-900 text-sm">Filters</div>
                <button onClick={handleClearFilters} className="text-xs text-blue-600 hover:underline">Clear all</button>
              </div>
              <div className="mb-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Niche</div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => handleFilterChange('category', '')} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!filters.category ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>All</button>
                  {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => handleFilterChange('category', cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${filters.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Followers</div>
                <div className="space-y-2">
                  {[
                    { label: 'Nano (1K–10K)', min: '1000', max: '10000' },
                    { label: 'Micro (10K–50K)', min: '10000', max: '50000' },
                    { label: 'Mid (50K–200K)', min: '50000', max: '200000' },
                    { label: 'Macro (200K+)', min: '200000', max: '' },
                  ].map((range) => (
                    <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="followerRange" checked={filters.minFollowers === range.min && filters.maxFollowers === range.max} onChange={() => { handleFilterChange('minFollowers', range.min); handleFilterChange('maxFollowers', range.max); }} className="accent-blue-600" />
                      <span className="text-sm text-gray-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Min engagement</div>
                <input type="number" value={filters.minEngagement} onChange={(e) => handleFilterChange('minEngagement', e.target.value)} placeholder="e.g. 3" min="0" max="100" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mb-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City</div>
                <input type="text" value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} placeholder="e.g. Mumbai" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mb-5 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Open for collab</span>
                  <input type="checkbox" checked={filters.isOpenForCollab === 'true'} onChange={(e) => handleFilterChange('isOpenForCollab', e.target.checked ? 'true' : '')} className="w-4 h-4 accent-blue-600" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Barter available</span>
                  <input type="checkbox" checked={filters.barterEnabled === 'true'} onChange={(e) => handleFilterChange('barterEnabled', e.target.checked ? 'true' : '')} className="w-4 h-4 accent-blue-600" />
                </label>
              </div>
              <button onClick={() => fetchCreators(filters)} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                Apply filters
              </button>
            </div>
          </div>
        )}

        {/* main content */}
        <div className="flex-1">

          {/* desktop header */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Discover Creators
                <span className="ml-3 text-sm font-normal bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{total} results</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">Find the right creator for your next campaign</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <SlidersHorizontal size={15} />
                Filters
              </button>
              <select value={filters.sortBy} onChange={(e) => { handleFilterChange('sortBy', e.target.value); fetchCreators({ ...filters, sortBy: e.target.value }); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="newest">Newest</option>
                <option value="followers">Most followers</option>
                <option value="engagement">Best engagement</option>
              </select>
            </div>
          </div>

          {/* mobile results count */}
          <div className="md:hidden flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{total} creators</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : creators.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <div className="font-semibold text-gray-900 mb-2">No creators found</div>
              <div className="text-sm text-gray-500">Try adjusting your filters.</div>
            </div>
          ) : (
            // 2 columns on mobile, 3 on desktop
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {creators.map((creator) => (
                <CreatorCard
                  key={creator._id}
                  creator={creator}
                  onSave={handleSave}
                  saved={savedIds.includes(creator._id)}
                  onClick={() => navigate(`/creator/${creator._id}`)}
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
