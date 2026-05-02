import { useEffect, useState } from 'react';
import { ExternalLink, SlidersHorizontal, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { searchOpenings } from '../../api/openings';
import { applyToOpening } from '../../api/applications';
import toast from 'react-hot-toast';

const contentTypeColors = {
  reel: 'bg-blue-100 text-blue-700',
  post: 'bg-purple-100 text-purple-700',
  story: 'bg-orange-100 text-orange-700',
  ugc: 'bg-teal-100 text-teal-700',
};

const OpeningCard = ({ opening, onApply, applied }) => {
  const [showModal, setShowModal] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply(opening._id, coverNote);
      setShowModal(false);
      setCoverNote('');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all">
        {/* brand header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {opening.brandId?.logo
              ? <img src={opening.brandId.logo} alt="brand" className="w-full h-full object-cover" />
              : <span className="text-base">🏷️</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 truncate">
              {opening.brandId?.brandName || 'Brand'}
            </div>
            <div className="text-xs text-gray-400 capitalize truncate">
              {opening.brandId?.category || ''}
              {opening.brandId?.location?.city ? ` · ${opening.brandId.location.city}` : ''}
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${contentTypeColors[opening.contentType]}`}>
            {opening.contentType}
          </span>
        </div>

        {/* title */}
        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{opening.title}</h3>
        {opening.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{opening.description}</p>
        )}

        {/* tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {opening.budgetMax > 0 && (
            <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              ₹{opening.budgetMin?.toLocaleString('en-IN')}–₹{opening.budgetMax?.toLocaleString('en-IN')}
            </span>
          )}
          {opening.isBarter && (
            <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Barter</span>
          )}
          {opening.requirements?.minFollowers > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              Min {(opening.requirements.minFollowers / 1000).toFixed(0)}K followers
            </span>
          )}
        </div>

        {opening.deadline && (
          <div className="text-xs text-gray-400 mb-3">
            Due {new Date(opening.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        )}

        {/* actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {opening.brandId?.instagram?.handle && (
            <a
              href={"https://instagram.com/" + opening.brandId.instagram.handle}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ExternalLink size={11} />
              IG
            </a>
          )}
          <button
            onClick={() => applied ? null : setShowModal(true)}
            disabled={applied}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
              applied
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {applied ? 'Applied ✓' : 'Apply'}
          </button>
        </div>
      </div>

      {/* apply modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
            <h3 className="font-bold text-gray-900 text-lg mb-1">Apply to opening</h3>
            <p className="text-sm text-gray-500 mb-4">{opening.title}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                rows={3}
                placeholder="Tell the brand why you're a great fit..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                Cancel
              </button>
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

// Mobile filter sheet
const FilterSheet = ({ open, onClose, filters, onFilterChange, onApply, onClear }) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden"
        style={{ maxHeight: '80vh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="font-bold text-gray-900">Filters</div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* content type */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Content type</div>
            <div className="flex flex-wrap gap-2">
              {['', 'reel', 'post', 'story', 'ugc'].map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterChange('contentType', type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                    filters.contentType === type ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'
                  }`}
                >{type || 'All'}</button>
              ))}
            </div>
          </div>

          {/* budget */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Budget (₹)</div>
            <div className="flex gap-3">
              <input type="number" placeholder="Min" value={filters.minBudget} onChange={(e) => onFilterChange('minBudget', e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" placeholder="Max" value={filters.maxBudget} onChange={(e) => onFilterChange('maxBudget', e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* barter */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Barter only</span>
            <input type="checkbox" checked={filters.isBarter === 'true'}
              onChange={(e) => onFilterChange('isBarter', e.target.checked ? 'true' : '')}
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

const BrowseBrands = () => {
  const [openings, setOpenings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [filters, setFilters] = useState({
    contentType: '',
    isBarter: '',
    minBudget: '',
    maxBudget: '',
  });

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
    } catch {
      setOpenings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOpenings(); }, []);

 const handleApply = async (openingId, coverNote) => {
  try {
    await applyToOpening(openingId, { coverNote });
    setAppliedIds((prev) => [...prev, openingId]);
    toast.success('Application submitted!');
    // move applied opening to end of list
    setOpenings((prev) => {
      const applied = prev.find((o) => o._id === openingId);
      const rest = prev.filter((o) => o._id !== openingId);
      return applied ? [...rest, applied] : prev;
    });
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to apply');
  }
};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    const cleared = { contentType: '', isBarter: '', minBudget: '', maxBudget: '' };
    setFilters(cleared);
    fetchOpenings(cleared);
  };

  const activeFilterCount = [filters.contentType, filters.isBarter, filters.minBudget].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <FilterSheet
        open={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={() => fetchOpenings(filters)}
        onClear={handleClear}
      />

      {/* MOBILE top bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-30">
        <div className="flex items-center gap-2">
          {/* content type pills */}
          <div className="flex gap-2 overflow-x-auto flex-1 pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {['', 'reel', 'post', 'story', 'ugc'].map((type) => (
              <button
                key={type}
                onClick={() => { handleFilterChange('contentType', type); fetchOpenings({ ...filters, contentType: type }); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all ${
                  filters.contentType === type ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white'
                }`}
              >{type || 'All'}</button>
            ))}
          </div>

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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 pb-24 md:pb-8">

        {/* desktop header + filters */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Browse Openings
                <span className="ml-3 text-sm font-normal bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{total} active</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">Find brands looking for creators like you</p>
            </div>
          </div>

          {/* desktop inline filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content type</label>
              <div className="flex gap-1.5">
                {['', 'reel', 'post', 'story', 'ugc'].map((type) => (
                  <button key={type} onClick={() => handleFilterChange('contentType', type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${filters.contentType === type ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    {type || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Budget (₹)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.minBudget} onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Max" value={filters.maxBudget} onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.isBarter === 'true'} onChange={(e) => handleFilterChange('isBarter', e.target.checked ? 'true' : '')} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-gray-700">Barter only</span>
            </label>
            <button onClick={() => fetchOpenings(filters)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
              Apply
            </button>
            <button onClick={handleClear} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Clear
            </button>
          </div>
        </div>

        {/* mobile results count */}
        <div className="md:hidden flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">{total} openings</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : openings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <div className="font-semibold text-gray-900 mb-2">No openings found</div>
            <div className="text-sm text-gray-500">Try adjusting your filters or check back later.</div>
          </div>
        ) : (
          // 1 col mobile, 2 col tablet, 3 col desktop
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {openings.map((opening) => (
              <OpeningCard
                key={opening._id}
                opening={opening}
                onApply={handleApply}
                applied={appliedIds.includes(opening._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseBrands;
