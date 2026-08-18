import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, Bookmark, Search } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { searchCreators } from '../../api/creator';
import { saveCreator, getSavedCreators } from '../../api/brand';
import CreatorCard from '../../components/CreatorCard';
import toast from 'react-hot-toast';
import useBackButtonClose from '../../hooks/useBackButtonClose';
import CreatorListSkeleton from '../../components/CreatorListSkeleton';

const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'];

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

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};



// ─── MOBILE FILTER SHEET ──────────────────────────────────────────────────────
const FilterSheet = ({ open, onClose, filters, onFilterChange, onApply, onClear }) => {
  useBackButtonClose(open, onClose);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden"
        style={{ maxHeight: '85vh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="font-bold text-gray-900">Filters</div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-6">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Niche</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onFilterChange('category', '')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!filters.category ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'}`}>All</button>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => onFilterChange('category', cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'}`}>{getCategoryLabel(cat)}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Followers</div>
            <div className="space-y-2.5">
              {[
                { label: 'Nano (1K–10K)', min: '1000', max: '10000' },
                { label: 'Micro (10K–50K)', min: '10000', max: '50000' },
                { label: 'Mid (50K–200K)', min: '50000', max: '200000' },
                { label: 'Macro (200K+)', min: '200000', max: '' },
              ].map(range => (
                <label key={range.label} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="followerRange"
                    checked={filters.minFollowers === range.min && filters.maxFollowers === range.max}
                    onChange={() => { onFilterChange('minFollowers', range.min); onFilterChange('maxFollowers', range.max); }}
                    className="accent-blue-600 w-4 h-4" />
                  <span className="text-sm text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Min engagement %</div>
            <input type="number" value={filters.minEngagement} onChange={e => onFilterChange('minEngagement', e.target.value)}
              placeholder="e.g. 3" min="0" max="100"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">City</div>
            <input type="text" value={filters.city} onChange={e => onFilterChange('city', e.target.value)}
              placeholder="e.g. Mumbai"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Open for collab only</span>
              <input type="checkbox" checked={filters.isOpenForCollab === 'true'}
                onChange={e => onFilterChange('isOpenForCollab', e.target.checked ? 'true' : '')}
                className="w-5 h-5 accent-blue-600" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Barter available</span>
              <input type="checkbox" checked={filters.barterEnabled === 'true'}
                onChange={e => onFilterChange('barterEnabled', e.target.checked ? 'true' : '')}
                className="w-5 h-5 accent-blue-600" />
            </label>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          <button onClick={onClear} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Clear all</button>
          <button onClick={() => { onApply(); onClose(); }} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold">Apply filters</button>
        </div>
      </div>
    </>
  );
};

// ─── DESKTOP LEFT SIDEBAR ─────────────────────────────────────────────────────
const DesktopSidebar = ({ filters, onFilterChange, onApply, onClear }) => (
  <div className="hidden md:block w-56 flex-shrink-0">
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-24">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-black text-sm" style={{ color: '#101828' }}>Filters</span>
        <button onClick={onClear} className="text-xs font-bold hover:underline cursor-pointer" style={{ color: '#155DFC' }}>Clear all</button>
      </div>
      <div className="px-5 pt-5">
        <button onClick={onApply}
          className="w-full py-3 rounded-2xl text-sm font-black text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: '#155DFC' }}>
          Apply Filters
        </button>
      </div>
      <div className="p-5 space-y-5">
        {/* niche */}
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Niche</div>
          <button onClick={() => onFilterChange('category', '')}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all mb-1 cursor-pointer"
            style={{ backgroundColor: !filters.category ? '#101828' : 'transparent', color: !filters.category ? 'white' : '#6B7280' }}>
            All Niches
          </button>
          <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: '260px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => onFilterChange('category', cat)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={{ backgroundColor: filters.category === cat ? '#101828' : 'transparent', color: filters.category === cat ? 'white' : '#6B7280' }}>
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-px bg-gray-100" />
        {/* followers */}
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Followers</div>
          <div className="space-y-2">
            {[
              { label: 'Nano (1K–10K)', min: '1000', max: '10000' },
              { label: 'Micro (10K–50K)', min: '10000', max: '50000' },
              { label: 'Mid (50K–200K)', min: '50000', max: '200000' },
              { label: 'Macro (200K+)', min: '200000', max: '' },
            ].map(range => (
              <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="followerRangeDesktop"
                  checked={filters.minFollowers === range.min && filters.maxFollowers === range.max}
                  onChange={() => { onFilterChange('minFollowers', range.min); onFilterChange('maxFollowers', range.max); }}
                  className="accent-blue-600" />
                <span className="text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="h-px bg-gray-100" />
        {/* engagement */}
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Min Engagement %</div>
          <input type="number" value={filters.minEngagement} onChange={e => onFilterChange('minEngagement', e.target.value)}
            placeholder="e.g. 3" min="0" max="100"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="h-px bg-gray-100" />
        {/* city */}
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">City</div>
          <input type="text" value={filters.city} onChange={e => onFilterChange('city', e.target.value)}
            placeholder="e.g. Mumbai"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="h-px bg-gray-100" />
        {/* toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold text-gray-700">Open for collab</span>
            <input type="checkbox" checked={filters.isOpenForCollab === 'true'}
              onChange={e => onFilterChange('isOpenForCollab', e.target.checked ? 'true' : '')}
              className="w-4 h-4 accent-blue-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold text-gray-700">Barter available</span>
            <input type="checkbox" checked={filters.barterEnabled === 'true'}
              onChange={e => onFilterChange('barterEnabled', e.target.checked ? 'true' : '')}
              className="w-4 h-4 accent-blue-600" />
          </label>
        </div>
        <button onClick={onApply}
          className="w-full py-3 rounded-2xl text-sm font-black text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#155DFC' }}>
          Apply Filters
        </button>
      </div>
    </div>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const BrowseCreators = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sessionSeed] = useState(() => Math.random().toString(36).slice(2));

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    minFollowers: searchParams.get('minFollowers') || '',
    maxFollowers: searchParams.get('maxFollowers') || '',
    minEngagement: searchParams.get('minEngagement') || '',
    barterEnabled: searchParams.get('barterEnabled') || '',
    isOpenForCollab: searchParams.get('isOpenForCollab') || 'true',
    sortBy: searchParams.get('sortBy') || '',
  });

  const buildParams = (f) => {
    const params = {};
    if (f.search) params.search = f.search;
    if (f.category) params.category = f.category;
    if (f.city) params.city = f.city;
    if (f.minFollowers) params.minFollowers = f.minFollowers;
    if (f.maxFollowers) params.maxFollowers = f.maxFollowers;
    if (f.minEngagement) params.minEngagement = f.minEngagement;
    if (f.barterEnabled) params.barterEnabled = f.barterEnabled;
    if (f.isOpenForCollab) params.isOpenForCollab = f.isOpenForCollab;
    if (f.sortBy) params.sortBy = f.sortBy;
    return params;
  };

  const fetchCreators = async (f = filters, pg = 1) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { ...buildParams(f), page: pg, limit: 12, seed: sessionSeed };
      const res = await searchCreators(params);
      const newCreators = res.data.creators || [];
      if (pg === 1) setCreators(newCreators);
      else setCreators(prev => [...prev, ...newCreators]);
      setTotal(res.data.pagination.total);
      setHasMore(pg < res.data.pagination.pages);
      setPage(pg);
    } catch { if (pg === 1) setCreators([]); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const savedRes = await getSavedCreators();
        setSavedIds(savedRes.data.savedCreators.map(c => c._id));
      } catch { }

      const savedStateRaw = sessionStorage.getItem('browseCreators_state');
      if (savedStateRaw) {
        const savedState = JSON.parse(savedStateRaw);
        const filtersMatch = JSON.stringify(savedState.filters) === JSON.stringify(filters);

        if (filtersMatch && savedState.page > 1) {
          // re-fetch every batch up to where they'd been, sequentially,
          // so the full loaded list is restored — not just a jump to
          // page 1 like a fresh visit
          setLoading(true);
          let allCreators = [];
          for (let p = 1; p <= savedState.page; p++) {
            const res = await searchCreators({ ...buildParams(filters), page: p, limit: 12 });
            allCreators = [...allCreators, ...(res.data.creators || [])];
            if (p === savedState.page) {
              setTotal(res.data.pagination.total);
              setHasMore(p < res.data.pagination.pages);
            }
          }
          setCreators(allCreators);
          setPage(savedState.page);
          setLoading(false);

          // wait for the restored content to actually render, then jump
          // to the saved scroll position — a small delay ensures the DOM
          // has the right height to scroll into before we try
          setTimeout(() => window.scrollTo(0, savedState.scrollY), 100);

          sessionStorage.removeItem('browseCreators_state');
          return;
        }
        sessionStorage.removeItem('browseCreators_state');
      }

      fetchCreators(filters, 1);
    };
    init();
  }, []);

  // writes the current filter state into the URL's query string, so
  // navigating away (e.g. to a creator profile) and back restores exactly
  // this state instead of resetting — the URL becomes the actual source
  // of truth, not just component memory that gets wiped on unmount
  const syncFiltersToUrl = (f) => {
    const params = {};
    if (f.search) params.search = f.search;
    if (f.category) params.category = f.category;
    if (f.city) params.city = f.city;
    if (f.minFollowers) params.minFollowers = f.minFollowers;
    if (f.maxFollowers) params.maxFollowers = f.maxFollowers;
    if (f.minEngagement) params.minEngagement = f.minEngagement;
    if (f.barterEnabled) params.barterEnabled = f.barterEnabled;
    if (f.isOpenForCollab && f.isOpenForCollab !== 'true') params.isOpenForCollab = f.isOpenForCollab;
    if (f.sortBy) params.sortBy = f.sortBy;
    setSearchParams(params, { replace: true });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      syncFiltersToUrl(updated);
      return updated;
    });
  };

  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (value) => {
    setFilters(prev => {
      const updated = { ...prev, search: value };
      syncFiltersToUrl(updated);
      return updated;
    });
    clearTimeout(searchTimeoutRef.current);

    // only search once the user has typed at least 2 characters (or cleared
    // the field entirely, to restore the unfiltered list) — a 1-character
    // search matches almost everything and isn't useful, just wasted work
    if (value.length > 0 && value.length < 2) return;

    searchTimeoutRef.current = setTimeout(() => {
      fetchCreators({ ...filters, search: value });
    }, 500);
  };

  const handleClearFilters = () => {
    const cleared = { search: '', category: '', city: '', minFollowers: '', maxFollowers: '', minEngagement: '', barterEnabled: '', isOpenForCollab: 'true', sortBy: '' };
    setFilters(cleared);
    syncFiltersToUrl(cleared);
    fetchCreators(cleared);
  };

  const handleSave = async (creatorId) => {
    try {
      await saveCreator(creatorId);
      setSavedIds(prev => prev.includes(creatorId) ? prev.filter(id => id !== creatorId) : [...prev, creatorId]);
    } catch { toast.error('Failed to save creator'); }
  };

  const saveScrollState = () => {
    sessionStorage.setItem('browseCreators_state', JSON.stringify({
      page,
      filters,
      scrollY: window.scrollY,
    }));
  };

  const activeFilterCount = [filters.category, filters.city, filters.minFollowers, filters.minEngagement, filters.barterEnabled].filter(Boolean).length;

  const EmptyState = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <div className="text-4xl mb-4">🔍</div>
      <div className="font-black text-gray-900 mb-2">No creators found</div>
      <div className="text-sm text-gray-500">Try adjusting your filters.</div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <Navbar />
      <FilterSheet open={showFilterSheet} onClose={() => setShowFilterSheet(false)}
        filters={filters} onFilterChange={handleFilterChange}
        onApply={() => fetchCreators(filters)} onClear={handleClearFilters} />
      {/* mobile top bar */}
      {/* mobile search */}
      <div className="md:hidden bg-white px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search creators..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {/* mobile top bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-30">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto flex-1 pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => { handleFilterChange('category', ''); fetchCreators({ ...filters, category: '' }); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${!filters.category ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white'}`}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => { handleFilterChange('category', cat); fetchCreators({ ...filters, category: cat }); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filters.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white'}`}>{getCategoryLabel(cat)}</button>
            ))}
          </div>
          <button onClick={() => setShowFilterSheet(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-bold text-gray-600 bg-white relative">
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">{activeFilterCount}</span>
            )}
          </button>
          <select value={filters.sortBy} onChange={e => { handleFilterChange('sortBy', e.target.value); fetchCreators({ ...filters, sortBy: e.target.value }); }}
            className="flex-shrink-0 px-2 py-1.5 border border-gray-200 rounded-full text-xs text-gray-600 bg-white focus:outline-none">
            <option value="">Recommended</option>
            <option value="followers">Followers</option>
            <option value="engagement">Engage</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 pb-24 md:pb-8">

        {/* DESKTOP — sidebar + content */}
        <div className="hidden md:flex gap-6 items-start">
          <DesktopSidebar filters={filters} onFilterChange={handleFilterChange}
            onApply={() => fetchCreators(filters)} onClear={handleClearFilters} />

          <div className="flex-1 min-w-0">
            {/* desktop header */}
            <div className="mb-5">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search by name, category, or Instagram username..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black" style={{ color: '#101828' }}>
                    Discover Creators
                  </h1>
                  <p className="text-sm mt-1 text-gray-400">Find the right creator for your next campaign</p>
                </div>
                <select value={filters.sortBy} onChange={e => { handleFilterChange('sortBy', e.target.value); fetchCreators({ ...filters, sortBy: e.target.value }); }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Recommended</option>
                  <option value="followers">Most followers</option>
                  <option value="engagement">Best engagement</option>
                </select>
              </div>
            </div>


            {loading ? <CreatorListSkeleton /> : creators.length === 0 ? <EmptyState /> : (
              <div className="flex flex-col gap-4 max-w-3xl">
                {creators.map(creator => (
                  <CreatorCard key={creator._id} creator={creator} onSave={handleSave}
                    saved={savedIds.includes(creator._id)} onViewProfile={() => { saveScrollState(); navigate(`/creator/${creator._id}`); }} />
                ))}
                {hasMore && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <button onClick={() => fetchCreators(filters, page + 1)} disabled={loadingMore}
                      style={{ padding: '12px 32px', backgroundColor: 'white', color: '#155DFC', border: '1.5px solid #155DFC', borderRadius: '14px', fontSize: '14px', fontWeight: 700, cursor: loadingMore ? 'not-allowed' : 'pointer' }}>
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE */}
        <div className="md:hidden">
          {loading ? <CreatorListSkeleton /> : creators.length === 0 ? <EmptyState /> : (
            <div className="flex flex-col gap-4 max-w-3xl">
              {creators.map(creator => (
                <CreatorCard key={creator._id} creator={creator} onSave={handleSave}
                  saved={savedIds.includes(creator._id)} onViewProfile={() => { saveScrollState(); navigate(`/creator/${creator._id}`); }} />
              ))}
              {hasMore && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <button onClick={() => fetchCreators(filters, page + 1)} disabled={loadingMore}
                    style={{ padding: '12px 32px', backgroundColor: 'white', color: '#155DFC', border: '1.5px solid #155DFC', borderRadius: '14px', fontSize: '14px', fontWeight: 700, cursor: loadingMore ? 'not-allowed' : 'pointer' }}>
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BrowseCreators;
