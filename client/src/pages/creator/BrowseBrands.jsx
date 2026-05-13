import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { searchOpenings } from '../../api/openings';
import { applyToOpening } from '../../api/applications';
import useCreatorProfileGuard from '../../hooks/useCreatorProfileGuard';
import toast from 'react-hot-toast';

const categoryColors = {
  fashion:   { bg: '#FED7AA', color: '#7C2D12' },
  beauty:    { bg: '#FBCFE8', color: '#831843' },
  food:      { bg: '#FDE68A', color: '#78350F' },
  tech:      { bg: '#DDD6FE', color: '#4C1D95' },
  fitness:   { bg: '#BBF7D0', color: '#064E3B' },
  lifestyle: { bg: '#BFDBFE', color: '#1E3A8A' },
  travel:    { bg: '#A7F3D0', color: '#064E3B' },
  education: { bg: '#FDE68A', color: '#78350F' },
  finance:   { bg: '#BBF7D0', color: '#064E3B' },
  gaming:    { bg: '#DDD6FE', color: '#4C1D95' },
  other:     { bg: '#E5E7EB', color: '#1F2937' },
};

const OpeningCard = ({ opening, onApply, applied }) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply(opening._id, coverNote);
      setShowApplyModal(false);
      setCoverNote('');
    } finally {
      setApplying(false);
    }
  };

  const cat = opening.brandId?.category?.toLowerCase() || 'other';
  const catStyle = categoryColors[cat] || categoryColors.other;

  // build deliverable boxes
  const d = opening.deliverables || {};
  const boxes = [
    { type: 'Reel',  qty: d.reels   || 0 },
    { type: 'Post',  qty: d.posts   || 0 },
    { type: 'Story', qty: d.stories || 0 },
    { type: 'UGC',   qty: d.ugc     || 0 },
  ].filter(b => b.qty > 0);
  // fallback for old openings
  if (boxes.length === 0 && opening.contentType) {
    boxes.push({ type: opening.contentType.charAt(0).toUpperCase() + opening.contentType.slice(1), qty: opening.quantity || 1 });
  }

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-95"
        style={{ backgroundColor: 'white', border: '1.5px solid #F0F0F0', boxShadow: '0 2px 0 0 #E5E5E5' }}
        onClick={() => !applied && setShowApplyModal(true)}
      >
        {/* brand image */}
        <div style={{ height: '150px', width: '100%', overflow: 'hidden', backgroundColor: '#F0F5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {opening.brandId?.logo
            ? <img src={opening.brandId.logo} alt="brand" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <span style={{ fontSize: '48px' }}>🏷️</span>
          }
        </div>

        <div style={{ padding: '12px' }}>
          {/* brand name */}
          <div style={{ fontWeight: 900, fontSize: '14px', color: '#0F172A', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '4px 8px' }}>
            {opening.brandId?.brandName || 'Brand'}
          </div>

          {/* category badge */}
          <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', backgroundColor: catStyle.bg, color: catStyle.color, marginBottom: '10px', textTransform: 'capitalize' }}>
            {opening.brandId?.category || opening.contentType || 'Brand'}
          </span>

          {/* deliverable boxes */}
          {boxes.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              {boxes.map((b, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: '#F8FAFF', border: '1.5px solid #DBEAFE', borderRadius: '10px', padding: '5px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{b.type}</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#1E3A8A', lineHeight: 1 }}>{b.qty}</div>
                </div>
              ))}
            </div>
          )}

          {/* price box */}
          <div style={{ backgroundColor: '#FACC15', borderRadius: '10px', padding: '7px 10px', marginBottom: '10px', boxShadow: '0 3px 0 0 #B45309' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Budget</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A' }}>
              {opening.budgetMin > 0 && opening.budgetMax > 0
                ? `₹${opening.budgetMin.toLocaleString('en-IN')} – ₹${opening.budgetMax.toLocaleString('en-IN')}`
                : opening.budgetMax > 0
                ? `Up to ₹${opening.budgetMax.toLocaleString('en-IN')}`
                : opening.isBarter ? 'Barter' : 'Discuss'
              }
            </div>
          </div>

          {/* apply button */}
          <button
            onClick={e => { e.stopPropagation(); applied ? null : setShowApplyModal(true); }}
            disabled={applied}
            style={{
              width: '100%', padding: '9px 0', borderRadius: '12px',
              backgroundColor: applied ? '#DCFCE7' : '#155DFC',
              color: applied ? '#166534' : 'white',
              fontSize: '11px', fontWeight: 900, border: 'none',
              cursor: applied ? 'default' : 'pointer',
              boxShadow: applied ? 'none' : '0 3px 0 0 #0C3EB5',
            }}
          >
            {applied ? 'Applied ✓' : 'Apply Now'}
          </button>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4"
          onClick={() => setShowApplyModal(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
            <h3 className="font-bold text-gray-900 text-lg mb-1">Apply to opening</h3>
            <p className="text-sm text-gray-500 mb-4">{opening.title}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea value={coverNote} onChange={e => setCoverNote(e.target.value)} rows={3}
                placeholder="Tell the brand why you're a great fit..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowApplyModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={handleApply} disabled={applying} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                {applying ? 'Applying...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const FilterSheet = ({ open, onClose, filters, onFilterChange, onApply, onClear }) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden"
        style={{ maxHeight: '80vh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="font-bold text-gray-900">Filters</div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Content type</div>
            <div className="flex flex-wrap gap-2">
              {['', 'reel', 'post', 'story', 'ugc'].map((type) => (
                <button key={type} onClick={() => onFilterChange('contentType', type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                    filters.contentType === type ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'
                  }`}>{type || 'All'}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Budget (₹)</div>
            <div className="flex gap-3">
              <input type="number" placeholder="Min" value={filters.minBudget} onChange={e => onFilterChange('minBudget', e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" placeholder="Max" value={filters.maxBudget} onChange={e => onFilterChange('maxBudget', e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Barter only</span>
            <input type="checkbox" checked={filters.isBarter === 'true'}
              onChange={e => onFilterChange('isBarter', e.target.checked ? 'true' : '')}
              className="w-5 h-5 accent-blue-600" />
          </label>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          <button onClick={onClear} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Clear</button>
          <button onClick={() => { onApply(); onClose(); }} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold">Apply</button>
        </div>
      </div>
    </>
  );
};

const DesktopSidebar = ({ filters, onFilterChange, onApply, onClear }) => (
  <div className="hidden md:block w-56 flex-shrink-0">
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-24">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-black text-sm" style={{ color: '#101828' }}>Filters</span>
        <button onClick={onClear} className="text-xs font-bold hover:underline" style={{ color: '#155DFC' }}>Clear all</button>
      </div>
      <div className="p-5 space-y-6">
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Content Type</div>
          <div className="space-y-1">
            {['', 'reel', 'post', 'story', 'ugc'].map((type) => (
              <button key={type} onClick={() => onFilterChange('contentType', type)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                style={{ backgroundColor: filters.contentType === type ? '#101828' : 'transparent', color: filters.contentType === type ? 'white' : '#6B7280' }}>
                {type || 'All Types'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-px bg-gray-100" />
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Budget (₹)</div>
          <div className="space-y-2">
            <input type="number" placeholder="Min budget" value={filters.minBudget}
              onChange={e => onFilterChange('minBudget', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="Max budget" value={filters.maxBudget}
              onChange={e => onFilterChange('maxBudget', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="h-px bg-gray-100" />
        <div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Availability</div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={filters.isBarter === 'true'}
              onChange={e => onFilterChange('isBarter', e.target.checked ? 'true' : '')}
              className="w-4 h-4 accent-blue-600 rounded" />
            <span className="text-sm font-semibold text-gray-700">Barter only</span>
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

const BrowseBrands = () => {
  const [openings, setOpenings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const { checking } = useCreatorProfileGuard();

  const [filters, setFilters] = useState({ contentType: '', isBarter: '', minBudget: '', maxBudget: '' });

  const fetchOpenings = async (f = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (f.contentType) params.contentType = f.contentType;
      if (f.isBarter) params.isBarter = f.isBarter;
      if (f.minBudget) params.minBudget = f.minBudget;
      if (f.maxBudget) params.maxBudget = f.maxBudget;
      const res = await searchOpenings(params);
      setOpenings(res.data.openings);
      setTotal(res.data.pagination.total);
    } catch { setOpenings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOpenings(); }, []);

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

  const handleClear = () => {
    const cleared = { contentType: '', isBarter: '', minBudget: '', maxBudget: '' };
    setFilters(cleared);
    fetchOpenings(cleared);
  };

  const activeFilterCount = [filters.contentType, filters.isBarter, filters.minBudget].filter(Boolean).length;

  if (checking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const EmptyState = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <div className="text-4xl mb-4">📋</div>
      <div className="font-black text-gray-900 mb-2">No openings found</div>
      <div className="text-sm text-gray-500">Try adjusting your filters or check back later.</div>
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
        onApply={() => fetchOpenings(filters)} onClear={handleClear} />

      {/* mobile top bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-30">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto flex-1 pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {['', 'reel', 'post', 'story', 'ugc'].map((type) => (
              <button key={type}
                onClick={() => { handleFilterChange('contentType', type); fetchOpenings({ ...filters, contentType: type }); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border capitalize transition-all ${
                  filters.contentType === type ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white'
                }`}>{type || 'All'}</button>
            ))}
          </div>
          <button onClick={() => setShowFilterSheet(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-bold text-gray-600 bg-white relative">
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 pb-24 md:pb-8">

        {/* DESKTOP — sidebar + content */}
        <div className="hidden md:flex gap-6 items-start">
          <DesktopSidebar filters={filters} onFilterChange={handleFilterChange}
            onApply={() => fetchOpenings(filters)} onClear={handleClear} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-black" style={{ color: '#101828' }}>
                  Browse Openings
                  <span className="ml-3 text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#155DFC' }}>{total} active</span>
                </h1>
                <p className="text-sm mt-1 text-gray-400">Find brands looking for creators like you</p>
              </div>
            </div>
            {loading ? <LoadingSpinner /> : openings.length === 0 ? <EmptyState /> : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {openings.map(opening => (
                  <OpeningCard key={opening._id} opening={opening} onApply={handleApply} applied={appliedIds.includes(opening._id)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black" style={{ color: '#101828' }}>{total} openings</span>
          </div>
          {loading ? <LoadingSpinner /> : openings.length === 0 ? <EmptyState /> : (
            <div className="grid grid-cols-2 gap-3">
              {openings.map(opening => (
                <OpeningCard key={opening._id} opening={opening} onApply={handleApply} applied={appliedIds.includes(opening._id)} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BrowseBrands;
