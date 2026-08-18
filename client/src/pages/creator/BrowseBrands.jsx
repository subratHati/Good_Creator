import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { searchOpenings } from '../../api/openings';
import { applyToOpening } from '../../api/applications';
import useCreatorProfileGuard from '../../hooks/useCreatorProfileGuard';
import toast from 'react-hot-toast';
import OpeningListSkeleton from '../../components/OpeningListSkeleton';

const categoryColors = {
  fashion: { bg: '#FED7AA', color: '#7C2D12' },
  beauty: { bg: '#FBCFE8', color: '#831843' },
  food: { bg: '#FDE68A', color: '#78350F' },
  tech: { bg: '#DDD6FE', color: '#4C1D95' },
  fitness: { bg: '#BBF7D0', color: '#064E3B' },
  lifestyle: { bg: '#BFDBFE', color: '#1E3A8A' },
  travel: { bg: '#A7F3D0', color: '#064E3B' },
  education: { bg: '#FDE68A', color: '#78350F' },
  finance: { bg: '#BBF7D0', color: '#064E3B' },
  gaming: { bg: '#DDD6FE', color: '#4C1D95' },
  entertainment: { bg: '#FCE7F3', color: '#9D174D' },
  parenting_family: { bg: '#FEF3C7', color: '#92400E' },
  vlogging: { bg: '#E0E7FF', color: '#3730A3' },
  dance: { bg: '#FBCFE8', color: '#9D174D' },
  religious: { bg: '#FEF9C3', color: '#713F12' },
  news_politics: { bg: '#E5E7EB', color: '#1F2937' },
  video_editing: { bg: '#CFFAFE', color: '#155E75' },
  ai_content: { bg: '#EDE9FE', color: '#5B21B6' },
  pets_wildlife: { bg: '#D1FAE5', color: '#065F46' },
  other: { bg: '#E5E7EB', color: '#1F2937' },
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

// ─── OPENING CARD — horizontal single column ──────────────────────────────────
const OpeningCard = ({ opening, onApply, applied }) => {
  const navigate = useNavigate();

  const cat = opening.brandId?.category?.toLowerCase() || 'other';
  const catStyle = categoryColors[cat] || categoryColors.other;

  const d = opening.deliverables || {};
  const boxes = [
    { type: 'Reel', qty: d.reels || 0 },
    { type: 'Post', qty: d.posts || 0 },
    { type: 'Story', qty: d.stories || 0 },
    { type: 'UGC', qty: d.ugc || 0 },
  ].filter(b => b.qty > 0);
  if (boxes.length === 0 && opening.contentType) {
    boxes.push({ type: opening.contentType.charAt(0).toUpperCase() + opening.contentType.slice(1), qty: opening.quantity || 1 });
  }

  return (
    <>

      <div
        onClick={() => navigate(`/openings/${opening._id}`)}
        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '12px' }}
      >
        {/* left — image */}
        <div style={{ width: '120px', height: '130px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '14px', backgroundColor: '#F8FAFC', alignSelf: 'center' }}>
          {opening.brandId?.logo
            ? <img src={opening.brandId.logo} alt="brand" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <span style={{ fontSize: '36px' }}>🏷️</span>
          }
        </div>

        {/* right — content */}
        <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* top row: title + category badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#101828', lineHeight: 1.3, flex: 1, marginRight: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {opening.title || 'Campaign'}
            </div>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', backgroundColor: catStyle.bg, color: catStyle.color, flexShrink: 0 }}>
              {opening.brandId?.category ? getCategoryLabel(opening.brandId.category) : (opening.contentType || 'Brand')}
            </span>
          </div>

          {/* brand name */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#16A34A', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            By {opening.brandId?.brandName || 'Brand'}
          </div>

          {/* deliverable boxes */}
          {boxes.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {boxes.map((b, i) => (
                <div key={i} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '4px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{b.type}</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#101828', lineHeight: 1.2 }}>{b.qty}</div>
                </div>
              ))}
            </div>
          )}

          {/* bottom row: budget + apply button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Budget</div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#101828' }}>
                {opening.budgetMin > 0 && opening.budgetMax > 0
                  ? `₹${opening.budgetMin.toLocaleString('en-IN')} – ₹${opening.budgetMax.toLocaleString('en-IN')}`
                  : opening.budgetMax > 0
                    ? `Up to ₹${opening.budgetMax.toLocaleString('en-IN')}`
                    : opening.isBarter ? 'Barter' : 'Discuss'
                }
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); if (!applied) navigate(`/openings/${opening._id}`); }}
              disabled={applied}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: '10px',
                backgroundColor: applied ? '#F0FDF4' : '#155DFC',
                color: applied ? '#16A34A' : 'white',
                fontSize: '12px', fontWeight: 900,
                border: applied ? '1px solid #BBF7D0' : 'none',
                cursor: applied ? 'default' : 'pointer',
                boxShadow: applied ? 'none' : '0 3px 0 0 #0C3EB5',
              }}
            >
              {applied ? '✓ Applied' : 'Apply'}
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

// ─── MOBILE FILTER SHEET ──────────────────────────────────────────────────────
const FilterSheet = ({ open, onClose, filters, onFilterChange, onApply, onClear }) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white z-50 md:hidden"
        style={{ maxHeight: '80vh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)', borderRadius: '24px 24px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, backgroundColor: 'white' }}>
          <span style={{ fontWeight: 900, fontSize: '16px', color: '#101828' }}>Filters</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#9CA3AF" /></button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Content type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['', 'reel', 'post', 'story', 'ugc'].map(type => (
                <button key={type} onClick={() => onFilterChange('contentType', type)}
                  style={{ padding: '7px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, border: '1.5px solid', borderColor: filters.contentType === type ? '#101828' : '#E5E7EB', backgroundColor: filters.contentType === type ? '#101828' : 'white', color: filters.contentType === type ? 'white' : '#6B7280', cursor: 'pointer', textTransform: 'capitalize' }}>
                  {type || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Budget (₹)</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" placeholder="Min" value={filters.minBudget} onChange={e => onFilterChange('minBudget', e.target.value)}
                style={{ flex: 1, padding: '12px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
              <input type="number" placeholder="Max" value={filters.maxBudget} onChange={e => onFilterChange('maxBudget', e.target.value)}
                style={{ flex: 1, padding: '12px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Barter only</span>
            <input type="checkbox" checked={filters.isBarter === 'true'} onChange={e => onFilterChange('isBarter', e.target.checked ? 'true' : '')} style={{ width: '18px', height: '18px', accentColor: '#155DFC' }} />
          </label>
        </div>
        <div style={{ position: 'sticky', bottom: 0, backgroundColor: 'white', borderTop: '1px solid #F0F0F0', padding: '14px 20px', display: 'flex', gap: '10px' }}>
          <button onClick={onClear} style={{ flex: 1, padding: '14px', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontSize: '14px', fontWeight: 700, color: '#6B7280', background: 'white', cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { onApply(); onClose(); }} style={{ flex: 1, padding: '14px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 0 0 #0C3EB5' }}>Apply</button>
        </div>
      </div>
    </>
  );
};

// ─── DESKTOP SIDEBAR ──────────────────────────────────────────────────────────
const DesktopSidebar = ({ filters, onFilterChange, onApply, onClear }) => (
  <div className="hidden md:block w-56 flex-shrink-0">
    <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', position: 'sticky', top: '90px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900, fontSize: '14px', color: '#101828' }}>Filters</span>
        <button onClick={onClear} style={{ fontSize: '12px', fontWeight: 700, color: '#155DFC', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
      </div>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Content Type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {['', 'reel', 'post', 'story', 'ugc'].map(type => (
              <button key={type} onClick={() => onFilterChange('contentType', type)}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', backgroundColor: filters.contentType === type ? '#101828' : 'transparent', color: filters.contentType === type ? 'white' : '#6B7280', cursor: 'pointer', textTransform: 'capitalize' }}>
                {type || 'All Types'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: '#F0F0F0' }} />
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Budget (₹)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input type="number" placeholder="Min budget" value={filters.minBudget} onChange={e => onFilterChange('minBudget', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '13px', outline: 'none' }} />
            <input type="number" placeholder="Max budget" value={filters.maxBudget} onChange={e => onFilterChange('maxBudget', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '13px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: '#F0F0F0' }} />
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Availability</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={filters.isBarter === 'true'} onChange={e => onFilterChange('isBarter', e.target.checked ? 'true' : '')} style={{ width: '16px', height: '16px', accentColor: '#155DFC' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Barter only</span>
          </label>
        </div>
        <button onClick={onApply}
          style={{ width: '100%', padding: '12px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 3px 0 0 #0C3EB5' }}>
          Apply Filters
        </button>
      </div>
    </div>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const BrowseBrands = () => {
  const [openings, setOpenings] = useState([]);
  const [allOpenings, setAllOpenings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [appliedIds, setAppliedIds] = useState([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const { checking } = useCreatorProfileGuard();
  const location = useLocation();

  const [filters, setFilters] = useState({ search: '', contentType: '', isBarter: '', minBudget: '', maxBudget: '', category: '' })

  const fetchOpenings = async (f = filters, pg = 1) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page: pg, limit: 12 };
      if (f.search) params.search = f.search;
      if (f.contentType) params.contentType = f.contentType;
      if (f.isBarter) params.isBarter = f.isBarter;
      if (f.minBudget) params.minBudget = f.minBudget;
      if (f.maxBudget) params.maxBudget = f.maxBudget;
      if (f.category) params.categories = f.category;
      const res = await searchOpenings(params);
      const newOpenings = res.data.openings || [];
      if (pg === 1) setOpenings(newOpenings);
      else setOpenings(prev => [...prev, ...newOpenings]);
      setTotal(res.data.pagination.total);
      setHasMore(pg < res.data.pagination.pages);
      setPage(pg);

      // if category filter active, also fetch all campaigns (only on the
      // first page — this fallback section doesn't need its own pagination)
      if (f.category && pg === 1) {
        const allRes = await searchOpenings({});
        const shownIds = new Set(newOpenings.map(o => o._id));
        setAllOpenings(allRes.data.openings.filter(o => !shownIds.has(o._id)));
      } else if (pg === 1) {
        setAllOpenings([]);
      }
    } catch { if (pg === 1) { setOpenings([]); setAllOpenings([]); } }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('category') || '';
    const initialFilters = { contentType: '', isBarter: '', minBudget: '', maxBudget: '', category: cat };
    setFilters(initialFilters);
    fetchOpenings(initialFilters);
  }, [location.search]);

  const handleApply = async (openingId, coverNote) => {
    try {
      await applyToOpening(openingId, { coverNote });
      setAppliedIds(prev => [...prev, openingId]);
      toast.success('Application submitted!');
      setOpenings(prev => {
        const applied = prev.find(o => o._id === openingId);
        const rest = prev.filter(o => o._id !== openingId);
        return applied ? [...rest, applied] : prev;
      });
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to apply'); }
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    clearTimeout(searchTimeoutRef.current);
    if (value.length > 0 && value.length < 2) return;
    searchTimeoutRef.current = setTimeout(() => {
      fetchOpenings({ ...filters, search: value });
    }, 500);
  };

  const handleClear = () => {
    const cleared = { search: '', contentType: '', isBarter: '', minBudget: '', maxBudget: '', category: '' };
    setFilters(cleared);
    fetchOpenings(cleared);
  };

  const activeFilterCount = [filters.contentType, filters.isBarter, filters.minBudget].filter(Boolean).length;

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #F0F0F0', borderTopColor: '#155DFC' }} />
    </div>
  );

  const EmptyState = ({ category }) => (
    <div>
      <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
        <div style={{ fontWeight: 900, color: '#78350F', fontSize: '15px', marginBottom: '4px' }}>
          No campaigns in {category ? `"${category}"` : 'this category'}
        </div>
        <div style={{ fontSize: '13px', color: '#92400E' }}>Showing all other campaigns below</div>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #F0F0F0', borderTopColor: '#155DFC' }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />

      <FilterSheet open={showFilterSheet} onClose={() => setShowFilterSheet(false)}
        filters={filters} onFilterChange={handleFilterChange}
        onApply={() => fetchOpenings(filters)} onClear={handleClear} />

      {/* mobile search */}
      <div className="md:hidden" style={{ backgroundColor: 'white', padding: '10px 14px 4px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            value={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search campaigns..."
            style={{ width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>
      {/* mobile filter bar */}
      <div className="md:hidden sticky top-14 z-30" style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            {['', 'reel', 'post', 'story', 'ugc'].map(type => (
              <button key={type}
                onClick={() => { handleFilterChange('contentType', type); fetchOpenings({ ...filters, contentType: type }); }}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, border: '1px solid', borderColor: filters.contentType === type ? '#101828' : '#E5E7EB', backgroundColor: filters.contentType === type ? '#101828' : 'white', color: filters.contentType === type ? 'white' : '#6B7280', cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                {type || 'All'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowFilterSheet(true)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#6B7280', cursor: 'pointer', position: 'relative' }}>
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', backgroundColor: '#155DFC', color: 'white', fontSize: '9px', fontWeight: 900, borderRadius: '99px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 pb-24 md:pb-8">

        {/* DESKTOP */}
        <div className="hidden md:flex gap-6 items-start">
          <DesktopSidebar filters={filters} onFilterChange={handleFilterChange}
            onApply={() => fetchOpenings(filters)} onClear={handleClear} />
          <div className="flex-1 min-w-0">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search by brand name, campaign, or category..."
                  style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#101828' }}>
                    Browse Campaigns
                  </h1>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Find brands looking for creators like you</p>
                </div>
              </div>
            </div>
            {loading ? <OpeningListSkeleton /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {openings.length === 0 && filters.category && <EmptyState category={filters.category} />}
                {openings.map((opening, index) => (
                  <div key={opening._id}>
                    <OpeningCard opening={opening} onApply={handleApply} applied={appliedIds.includes(opening._id)} />
                  </div>
                ))}
                {allOpenings.length > 0 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#F0F0F0' }} />
                      <span style={{ fontSize: '11px', color: '#C4C4C4', fontWeight: 500, whiteSpace: 'nowrap' }}>Explore other campaigns</span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#F0F0F0' }} />
                    </div>
                    {allOpenings.map((opening, index) => (
                      <div key={opening._id}>
                        <OpeningCard opening={opening} onApply={handleApply} applied={appliedIds.includes(opening._id)} />
                      </div>
                    ))}
                  </>
                )}
                {openings.length === 0 && allOpenings.length === 0 && !filters.category && <EmptyState />}
                {hasMore && !filters.category && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <button onClick={() => fetchOpenings(filters, page + 1)} disabled={loadingMore}
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
          {loading ? <OpeningListSkeleton /> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {openings.length === 0 && filters.category && <EmptyState category={filters.category} />}
              {openings.map((opening, index) => (
                <div key={opening._id}>
                  <OpeningCard opening={opening} onApply={handleApply} applied={appliedIds.includes(opening._id)} />
                </div>
              ))}
              {allOpenings.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#F0F0F0' }} />
                    <span style={{ fontSize: '11px', color: '#C4C4C4', fontWeight: 500, whiteSpace: 'nowrap' }}>Explore other campaigns</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#F0F0F0' }} />
                  </div>
                  {allOpenings.map((opening, index) => (
                    <div key={opening._id}>
                      <OpeningCard opening={opening} onApply={handleApply} applied={appliedIds.includes(opening._id)} />
                    </div>
                  ))}
                </>
              )}
              {openings.length === 0 && allOpenings.length === 0 && !filters.category && <EmptyState />}
              {hasMore && !filters.category && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <button onClick={() => fetchOpenings(filters, page + 1)} disabled={loadingMore}
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

export default BrowseBrands;
