import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { searchOpenings } from '../../api/openings';
import { applyToOpening } from '../../api/applications';
import useCreatorProfileGuard from '../../hooks/useCreatorProfileGuard';
import toast from 'react-hot-toast';
import useBackButtonClose from '../../hooks/useBackButtonClose';

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
  other: { bg: '#E5E7EB', color: '#1F2937' },
};

// ─── OPENING CARD — horizontal single column ──────────────────────────────────
const OpeningCard = ({ opening, onApply, applied }) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);

  useBackButtonClose(showApplyModal, () => setShowApplyModal(false));

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
        onClick={() => !applied && setShowApplyModal(true)}
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
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', backgroundColor: catStyle.bg, color: catStyle.color, textTransform: 'capitalize', flexShrink: 0 }}>
              {opening.brandId?.category || opening.contentType || 'Brand'}
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
              onClick={e => { e.stopPropagation(); applied ? null : setShowApplyModal(true); }}
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


      {/* apply modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4"
          onClick={() => setShowApplyModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
            onClick={e => e.stopPropagation()}>

            {/* drag handle */}
            <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', paddingTop: '12px', paddingBottom: '4px', zIndex: 1 }}>
              <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', margin: '0 auto 16px' }} />
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              {/* campaign header */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F0F0F0', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {opening.brandId?.logo
                    ? <img src={opening.brandId.logo} alt="brand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '20px' }}>🏷️</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#101828', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opening.title}</div>
                  <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>By {opening.brandId?.brandName || 'Brand'}</div>
                </div>
              </div>

              {/* preferred niches */}
              {opening.requirements?.categories?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Preferred Niches</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {opening.requirements.categories.map(cat => {
                      const cs = categoryColors[cat] || categoryColors.other;
                      return (
                        <span key={cat} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', backgroundColor: cs.bg, color: cs.color, textTransform: 'capitalize' }}>
                          {cat}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* deliverables summary */}
              {boxes.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Deliverables</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {boxes.map((b, i) => (
                      <div key={i} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '6px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>{b.type}</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#101828' }}>{b.qty}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* budget */}
              <div style={{ marginBottom: '16px', padding: '12px 14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#78350F', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Budget</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>
                  {opening.budgetMin > 0 && opening.budgetMax > 0
                    ? `₹${opening.budgetMin.toLocaleString('en-IN')} – ₹${opening.budgetMax.toLocaleString('en-IN')}`
                    : opening.budgetMax > 0
                      ? `Up to ₹${opening.budgetMax.toLocaleString('en-IN')}`
                      : opening.isBarter ? 'Barter' : 'Open to discuss'
                  }
                </div>
              </div>

              {/* cover note */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                  Cover note <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea value={coverNote} onChange={e => setCoverNote(e.target.value)} rows={3}
                  placeholder="Tell the brand why you're a great fit..."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>

              {/* buttons — sticky at bottom */}
              <div style={{ position: 'sticky', bottom: 0, backgroundColor: 'white', paddingTop: '12px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowApplyModal(false)}
                  style={{ flex: 1, padding: '14px', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontSize: '14px', fontWeight: 700, color: '#6B7280', background: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleApply} disabled={applying}
                  style={{ flex: 1, padding: '14px', backgroundColor: applying ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 900, cursor: applying ? 'not-allowed' : 'pointer', boxShadow: applying ? 'none' : '0 4px 0 0 #0C3EB5' }}>
                  {applying ? 'Applying...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  const [appliedIds, setAppliedIds] = useState([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const { checking } = useCreatorProfileGuard();
  const location = useLocation();

  const [filters, setFilters] = useState({ contentType: '', isBarter: '', minBudget: '', maxBudget: '', category: '' })

  const fetchOpenings = async (f = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (f.contentType) params.contentType = f.contentType;
      if (f.isBarter) params.isBarter = f.isBarter;
      if (f.minBudget) params.minBudget = f.minBudget;
      if (f.maxBudget) params.maxBudget = f.maxBudget;
      if (f.category) params.categories = f.category;
      const res = await searchOpenings(params);
      setOpenings(res.data.openings);
      setTotal(res.data.pagination.total);

      // if category filter active, also fetch all campaigns
      if (f.category) {
        const allRes = await searchOpenings({});
        // exclude ones already shown
        const shownIds = new Set(res.data.openings.map(o => o._id));
        setAllOpenings(allRes.data.openings.filter(o => !shownIds.has(o._id)));
      } else {
        setAllOpenings([]);
      }
    } catch { setOpenings([]); setAllOpenings([]); }
    finally { setLoading(false); }
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

  const handleClear = () => {
    const cleared = { contentType: '', isBarter: '', minBudget: '', maxBudget: '', category: '' };
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#101828', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Browse Campaigns
                  <span style={{ fontSize: '13px', fontWeight: 700, padding: '4px 12px', borderRadius: '99px', backgroundColor: '#EFF6FF', color: '#155DFC' }}>{total} active</span>
                </h1>
                <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Find brands looking for creators like you</p>
              </div>
            </div>
            {loading ? <LoadingSpinner /> : (
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
              </div>
            )}
          </div>
        </div>

        {/* MOBILE */}
        <div className="md:hidden">
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#101828', marginBottom: '12px' }}>{total} campaigns</div>
          {loading ? <LoadingSpinner /> : (
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
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BrowseBrands;
