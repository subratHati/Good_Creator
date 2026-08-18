import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ExternalLink } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getOpeningById, searchOpenings } from '../../api/openings';
import { applyToOpening, getMyApplications } from '../../api/applications';
import toast from 'react-hot-toast';

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

const formatBudget = (opening) => {
  if (opening.budgetMin > 0 && opening.budgetMax > 0) {
    return `₹${opening.budgetMin.toLocaleString('en-IN')} – ₹${opening.budgetMax.toLocaleString('en-IN')}`;
  }
  if (opening.budgetMax > 0) return `Up to ₹${opening.budgetMax.toLocaleString('en-IN')}`;
  return opening.isBarter ? 'Barter' : 'Open to discuss';
};

// ─── OTHER CAMPAIGN CARD (compact, for the "more from this brand" list) ───────
const OtherCampaignCard = ({ opening, onClick }) => {
  const d = opening.deliverables || {};
  const boxes = [
    { type: 'Reel', qty: d.reels || 0 },
    { type: 'Post', qty: d.posts || 0 },
    { type: 'Story', qty: d.stories || 0 },
    { type: 'UGC', qty: d.ugc || 0 },
  ].filter(b => b.qty > 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl transition-colors hover:bg-gray-50"
      style={{ border: '1px solid #E5E7EB' }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate" style={{ color: '#101828' }}>{opening.title || 'Campaign'}</div>
        {boxes.length > 0 && (
          <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            {boxes.map(b => `${b.qty} ${b.type}${b.qty > 1 ? 's' : ''}`).join(' · ')}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-sm" style={{ color: '#155DFC' }}>{formatBudget(opening)}</div>
      </div>
    </button>
  );
};

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opening, setOpening] = useState(null);
  const [otherOpenings, setOtherOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await getOpeningById(id);
        const fetchedOpening = res.data.opening;
        setOpening(fetchedOpening);

        // check if the creator already applied to THIS specific opening
        try {
          const appsRes = await getMyApplications();
          const applied = (appsRes.data.applications || []).some(
            a => (a.openingId?._id || a.openingId) === id
          );
          setAlreadyApplied(applied);
        } catch {
          // if this check fails, just don't pre-block the apply button —
          // the backend will still reject a genuine duplicate application
        }

        // other active campaigns from this same brand, excluding this one
        const brandId = fetchedOpening.brandId?._id;
        if (brandId) {
          const otherRes = await searchOpenings({ brandId, limit: 10 });
          const others = (otherRes.data.openings || []).filter(o => o._id !== id);
          setOtherOpenings(others);
        }
      } catch {
        setOpening(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    window.scrollTo(0, 0);
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await applyToOpening(id, { coverNote });
      toast.success('Application submitted!');
      setAlreadyApplied(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      </div>
    );
  }

  if (!opening) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center h-96 text-center px-4">
          <div className="text-4xl mb-4">😕</div>
          <div className="font-black text-lg" style={{ color: '#101828' }}>Campaign not found</div>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold" style={{ color: '#155DFC' }}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const brand = opening.brandId || {};
  const cat = brand.category?.toLowerCase() || 'other';
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
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />

      {/* header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold truncate" style={{ color: '#101828' }}>{opening.title || 'Campaign'}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 space-y-5">

        {/* brand header card */}
        <button
          onClick={() => brand._id && navigate(`/brand/${brand._id}`)}
          className="w-full text-left bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 transition-colors hover:bg-gray-50"
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
            {brand.logo ? (
              <img src={brand.logo} alt={brand.brandName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🏷️</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-lg truncate" style={{ color: '#101828' }}>{brand.brandName || 'Brand'}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {brand.category && (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                >
                  {getCategoryLabel(brand.category)}
                </span>
              )}
              {brand.location?.city && (
                <span className="text-xs flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                  <MapPin size={11} /> {brand.location.city}
                </span>
              )}
            </div>
          </div>
          {brand._id && (
            <ExternalLink size={16} className="flex-shrink-0" style={{ color: '#155DFC' }} />
          )}
        </button>

        {/* campaign details card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
          <div>
            <h1 className="text-xl font-black" style={{ color: '#101828' }}>{opening.title || 'Campaign'}</h1>
            {opening.description && (
              <p className="text-sm mt-2 leading-relaxed" style={{ color: '#6B7280' }}>{opening.description}</p>
            )}
          </div>

          {opening.requirements?.categories?.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Preferred Niches</div>
              <div className="flex flex-wrap gap-2">
                {opening.requirements.categories.map(c => {
                  const cs = categoryColors[c] || categoryColors.other;
                  return (
                    <span key={c} className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: cs.bg, color: cs.color }}>
                      {getCategoryLabel(c)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {boxes.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Deliverables</div>
              <div className="flex gap-2 flex-wrap">
                {boxes.map((b, i) => (
                  <div key={i} className="rounded-xl px-4 py-2.5 text-center" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                    <div className="text-xs font-bold" style={{ color: '#9CA3AF' }}>{b.type}</div>
                    <div className="text-lg font-black" style={{ color: '#101828' }}>{b.qty}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(opening.requirements?.minFollowers > 0 || opening.requirements?.minEngagement > 0) && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Creator Requirements</div>
              <div className="flex gap-2 flex-wrap">
                {opening.requirements?.minFollowers > 0 && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F8FAFC', color: '#374151', border: '1px solid #E5E7EB' }}>
                    Min {opening.requirements.minFollowers.toLocaleString('en-IN')} followers
                  </span>
                )}
                {opening.requirements?.minEngagement > 0 && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F8FAFC', color: '#374151', border: '1px solid #E5E7EB' }}>
                    Min {opening.requirements.minEngagement}% engagement
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#78350F' }}>Budget</div>
            <div className="text-lg font-black" style={{ color: '#0F172A' }}>{formatBudget(opening)}</div>
            {opening.isBarter && opening.barterDetails && (
              <div className="text-xs mt-1" style={{ color: '#92400E' }}>Barter: {opening.barterDetails}</div>
            )}
          </div>

          {opening.deadline && (
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              Deadline: {new Date(opening.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* apply card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          {alreadyApplied ? (
            <div className="flex items-center gap-2 justify-center py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
              ✓ Application submitted
            </div>
          ) : (
            <>
              <label className="block text-sm font-bold mb-2" style={{ color: '#374151' }}>
                Cover note <span className="font-normal" style={{ color: '#9CA3AF' }}>(optional)</span>
              </label>
              <textarea
                value={coverNote}
                onChange={e => setCoverNote(e.target.value)}
                rows={4}
                placeholder="Tell the brand why you're a great fit..."
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB' }}
              />
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full mt-4 py-3.5 rounded-xl font-black text-sm text-white disabled:opacity-60"
                style={{ backgroundColor: '#155DFC', boxShadow: '0 4px 0 0 #0C3EB5' }}
              >
                {applying ? 'Submitting...' : 'Apply to this campaign'}
              </button>
            </>
          )}
        </div>

        {otherOpenings.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>
              More campaigns from {brand.brandName || 'this brand'}
            </h2>
            <div className="space-y-3">
              {otherOpenings.map(o => (
                <OtherCampaignCard key={o._id} opening={o} onClick={() => navigate(`/openings/${o._id}`)} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CampaignDetails;
