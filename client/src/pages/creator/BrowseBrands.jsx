import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
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
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:-translate-y-0.5">

        {/* brand header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {opening.brandId?.logo
              ? <img src={opening.brandId.logo} alt="brand" className="w-full h-full object-cover" />
              : <span className="text-lg">🏷️</span>
            }
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">
              {opening.brandId?.brandName || 'Brand'}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {opening.brandId?.category || ''}
              {opening.brandId?.location?.city
                ? ` · ${opening.brandId.location.city}`
                : ''}
            </div>
          </div>
          <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${contentTypeColors[opening.contentType]}`}>
            {opening.contentType}
          </span>
        </div>

        {/* title */}
        <h3 className="font-semibold text-gray-900 mb-1">{opening.title}</h3>
        {opening.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{opening.description}</p>
        )}

        {/* details */}
        <div className="flex flex-wrap gap-2 mb-3">
          {opening.budgetMax > 0 && (
            <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
              ₹{opening.budgetMin.toLocaleString('en-IN')} – ₹{opening.budgetMax.toLocaleString('en-IN')}
            </span>
          )}
          {opening.isBarter && (
            <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
              Barter available
            </span>
          )}
          {opening.isCollab && (
            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
              Collab tag
            </span>
          )}
          {opening.requirements?.minFollowers > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
              Min {(opening.requirements.minFollowers / 1000).toFixed(0)}K followers
            </span>
          )}
        </div>

        {opening.deadline && (
          <div className="text-xs text-gray-400 mb-3">
            Deadline: {new Date(opening.deadline).toLocaleDateString()}
          </div>
        )}

        {/* actions */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {opening.brandId?.instagram?.handle && (
            
            <a
              href={"https://instagram.com/" + opening.brandId.instagram.handle}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink size={11} />
              Instagram
            </a>
          )}
          <button
            onClick={() => applied ? null : setShowModal(true)}
            disabled={applied}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              applied
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {applied ? 'Applied ✓' : 'Apply / Interested'}
          </button>
        </div>
      </div>

      {/* apply modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {applying ? 'Applying...' : 'Submit application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const BrowseBrands = () => {
  const [openings, setOpenings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState([]);
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

  useEffect(() => {
    fetchOpenings();
  }, []);

  const handleApply = async (openingId, coverNote) => {
    try {
      await applyToOpening(openingId, { coverNote });
      setAppliedIds((prev) => [...prev, openingId]);
      toast.success('Application submitted!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to apply';
      toast.error(msg);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Browse Openings
            <span className="ml-3 text-sm font-normal bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
              {total} active
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Find brands looking for creators like you
          </p>
        </div>

        {/* filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Content type
            </label>
            <div className="flex gap-1.5">
              {['', 'reel', 'post', 'story', 'ugc'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('contentType', type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                    filters.contentType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {type || 'All'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Budget range (₹)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minBudget}
                onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxBudget}
                onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.isBarter === 'true'}
              onChange={(e) =>
                handleFilterChange('isBarter', e.target.checked ? 'true' : '')
              }
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">Barter only</span>
          </label>

          <button
            onClick={() => fetchOpenings(filters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Apply filters
          </button>

          <button
            onClick={() => {
              const cleared = { contentType: '', isBarter: '', minBudget: '', maxBudget: '' };
              setFilters(cleared);
              fetchOpenings(cleared);
            }}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* openings grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : openings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <div className="font-semibold text-gray-900 mb-2">No openings found</div>
            <div className="text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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