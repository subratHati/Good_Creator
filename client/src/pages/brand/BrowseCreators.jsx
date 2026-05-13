import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, Bookmark } from 'lucide-react';
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

const avatarBgs = ['#FF6B35', '#155DFC', '#E1306C', '#16A34A', '#8B5CF6', '#F59E0B', '#0EA5E9', '#EC4899'];

// ─── CREATOR CARD — bold Zepto/Blinkit style ─────────────────────────────────
const CreatorCard = ({ creator, onSave, saved, onClick }) => {
  const bgColor = avatarBgs[creator.name?.charCodeAt(0) % avatarBgs.length] || '#155DFC';
  const engagementGood = (creator.instagram?.engagementRate || 0) >= 3;

  return (
    <div onClick={onClick}
      className="rounded-3xl overflow-hidden cursor-pointer transition-transform hover:scale-95 relative"
      style={{ backgroundColor: 'white', border: '1.5px solid #F0F0F0', boxShadow: '0 4px 0 0 #E5E5E5' }}>

      {/* save button */}
      <button onClick={e => { e.stopPropagation(); onSave(creator._id); }}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={{ backgroundColor: saved ? '#FEE2E2' : 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
        <Bookmark size={13} fill={saved ? '#EF4444' : 'none'} color={saved ? '#EF4444' : '#9CA3AF'} />
      </button>

      {/* top image / colored bg */}
      <div style={{ height: '140px', width: '100%', overflow: 'hidden', backgroundColor: bgColor, position: 'relative' }}>
        {creator.profilePhoto
          ? <img src={creator.profilePhoto} alt={creator.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : (
            <>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <div style={{ position: 'absolute', bottom: '-25px', left: '-15px', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 900, color: 'white', border: '3px solid rgba(255,255,255,0.4)' }}>
                  {creator.name?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            </>
          )
        }
        {/* open badge */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#FACC15', borderRadius: '20px', padding: '3px 8px', boxShadow: '0 2px 0 0 #B45309' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A' }}>
            {creator.isOpenForCollab ? '✓ Open' : '✗ Closed'}
          </span>
        </div>
      </div>

      {/* body */}
      <div style={{ padding: '10px' }}>
        {/* name */}
        <div style={{ fontWeight: 900, fontSize: '13px', color: '#101828', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {creator.name || 'Creator'}
          {creator.isAdminVerified && <span style={{ color: '#155DFC', marginLeft: '4px', fontSize: '11px' }}>✓</span>}
        </div>
        {/* handle */}
        <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {creator.instagram?.handle ? `@${creator.instagram.handle}` : 'No Instagram'}
        </div>

        {/* stat boxes row */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          {/* followers */}
          <div style={{ flex: 1, borderRadius: '8px', padding: '4px 3px', textAlign: 'center', backgroundColor: '#FACC15', boxShadow: '0 2px 0 0 #B45309' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{formatNumber(creator.instagram?.followersCount)}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#78350F', textTransform: 'uppercase', marginTop: '2px' }}>Followers</div>
          </div>
          {/* engagement */}
          <div style={{ flex: 1, borderRadius: '8px', padding: '4px 3px', textAlign: 'center', backgroundColor: engagementGood ? '#DCFCE7' : '#FEE2E2', boxShadow: engagementGood ? '0 2px 0 0 #86EFAC' : '0 2px 0 0 #FCA5A5' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, color: engagementGood ? '#14532D' : '#7F1D1D', lineHeight: 1 }}>
              {creator.instagram?.engagementRate ? `${creator.instagram.engagementRate}%` : '—'}
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: engagementGood ? '#166534' : '#991B1B', textTransform: 'uppercase', marginTop: '2px' }}>Engage</div>
          </div>
          {/* avg views */}
          <div style={{ flex: 1, borderRadius: '8px', padding: '4px 3px', textAlign: 'center', backgroundColor: '#EFF6FF', boxShadow: '0 2px 0 0 #BFDBFE' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E3A8A', lineHeight: 1 }}>{formatNumber(creator.instagram?.avgViews)}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', marginTop: '2px' }}>Views</div>
          </div>
        </div>

        {/* category tags */}
        {creator.categories?.length > 0 && (
          <div style={{ display: 'flex', gap: '3px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {creator.categories.slice(0, 2).map(cat => (
              <span key={cat} style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '20px', backgroundColor: '#F1F5F9', color: '#475569', textTransform: 'capitalize' }}>{cat}</span>
            ))}
          </div>
        )}

        {/* price */}
        <div style={{ backgroundColor: '#F8FAFF', borderRadius: '8px', padding: '5px 8px', marginBottom: '8px', border: '1px solid #DBEAFE' }}>
          <div style={{ fontSize: '8px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '1px' }}>Starting from</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#155DFC' }}>
            {creator.pricing?.reel > 0 ? `₹${creator.pricing.reel.toLocaleString('en-IN')}` : 'Negotiable'}
          </div>
        </div>

        {/* message button */}
        <button onClick={e => { e.stopPropagation(); onClick(); }}
          style={{ width: '100%', padding: '8px 0', borderRadius: '12px', backgroundColor: '#155DFC', color: 'white', fontSize: '11px', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 3px 0 0 #0c3eb5' }}>
          Message →
        </button>
      </div>
    </div>
  );
};

// ─── MOBILE FILTER SHEET ──────────────────────────────────────────────────────
const FilterSheet = ({ open, onClose, filters, onFilterChange, onApply, onClear }) => {
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${filters.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'}`}>{cat}</button>
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
        <button onClick={onClear} className="text-xs font-bold hover:underline" style={{ color: '#155DFC' }}>Clear all</button>
      </div>
      <div className="p-5 space-y-5">
        {/* niche */}
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Niche</div>
          <div className="space-y-1">
            <button onClick={() => onFilterChange('category', '')}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: !filters.category ? '#101828' : 'transparent', color: !filters.category ? 'white' : '#6B7280' }}>
              All Niches
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => onFilterChange('category', cat)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                style={{ backgroundColor: filters.category === cat ? '#101828' : 'transparent', color: filters.category === cat ? 'white' : '#6B7280' }}>
                {cat}
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

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
    } catch { setCreators([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const savedRes = await getSavedCreators();
        setSavedIds(savedRes.data.savedCreators.map(c => c._id));
      } catch {}
      fetchCreators();
    };
    init();
  }, []);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const handleClearFilters = () => {
    const cleared = { category: '', city: '', minFollowers: '', maxFollowers: '', minEngagement: '', barterEnabled: '', isOpenForCollab: 'true', sortBy: 'newest' };
    setFilters(cleared);
    fetchCreators(cleared);
  };

  const handleSave = async (creatorId) => {
    try {
      await saveCreator(creatorId);
      setSavedIds(prev => prev.includes(creatorId) ? prev.filter(id => id !== creatorId) : [...prev, creatorId]);
    } catch { toast.error('Failed to save creator'); }
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
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-30">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto flex-1 pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => { handleFilterChange('category', ''); fetchCreators({ ...filters, category: '' }); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${!filters.category ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white'}`}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => { handleFilterChange('category', cat); fetchCreators({ ...filters, category: cat }); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border capitalize transition-all ${filters.category === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white'}`}>{cat}</button>
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
            <option value="newest">New</option>
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
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-black" style={{ color: '#101828' }}>
                  Discover Creators
                  <span className="ml-3 text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#155DFC' }}>{total} results</span>
                </h1>
                <p className="text-sm mt-1 text-gray-400">Find the right creator for your next campaign</p>
              </div>
              <select value={filters.sortBy} onChange={e => { handleFilterChange('sortBy', e.target.value); fetchCreators({ ...filters, sortBy: e.target.value }); }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="newest">Newest</option>
                <option value="followers">Most followers</option>
                <option value="engagement">Best engagement</option>
              </select>
            </div>

            {loading ? <LoadingSpinner /> : creators.length === 0 ? <EmptyState /> : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {creators.map(creator => (
                  <CreatorCard key={creator._id} creator={creator} onSave={handleSave}
                    saved={savedIds.includes(creator._id)} onClick={() => navigate(`/creator/${creator._id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black" style={{ color: '#101828' }}>{total} creators</span>
          </div>
          {loading ? <LoadingSpinner /> : creators.length === 0 ? <EmptyState /> : (
            <div className="grid grid-cols-2 gap-3">
              {creators.map(creator => (
                <CreatorCard key={creator._id} creator={creator} onSave={handleSave}
                  saved={savedIds.includes(creator._id)} onClick={() => navigate(`/creator/${creator._id}`)} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BrowseCreators;
