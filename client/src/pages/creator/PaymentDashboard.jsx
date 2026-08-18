import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, ChevronRight, Wallet } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { getCreatorCollaborations } from '../../api/collaboration';
import { getMyCreatorProfile } from '../../api/creator';

const statusStyles = {
  pending: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', label: 'Pending' },
  delivered: { bg: '#EFF6FF', color: '#1E3A8A', dot: '#155DFC', label: 'Delivered' },
  completed: { bg: '#F0FDF4', color: '#166534', dot: '#22C55E', label: 'Completed' },
};

const RANGE_OPTIONS = [
  { value: '', label: 'All time' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'this_year', label: 'This year' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
];

const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const CollabCard = ({ collab }) => {
  const st = statusStyles[collab.status] || statusStyles.pending;
  const d = collab.deliverables || {};
  const boxes = [
    { type: 'Reel', qty: d.reels || 0 },
    { type: 'Post', qty: d.posts || 0 },
    { type: 'Story', qty: d.stories || 0 },
    { type: 'UGC', qty: d.ugc || 0 },
  ].filter(b => b.qty > 0);

  const creatorPayout = Math.round((collab.amount || 0) * 0.85);

  return (
    <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
            {collab.brandId?.logo ? (
              <img src={collab.brandId.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">🏷️</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: '#101828' }}>{collab.brandId?.brandName || 'Brand'}</div>
            <div className="text-xs font-mono" style={{ color: '#9CA3AF' }}>{collab.collabId}</div>
          </div>
        </div>
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: st.bg, color: st.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
          {st.label}
        </span>
      </div>

      {boxes.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {boxes.map((b, i) => (
            <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#F8FAFC', color: '#374151', border: '1px solid #E5E7EB' }}>
              {b.qty} {b.type}{b.qty > 1 ? 's' : ''}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
        <div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>{collab.status === 'completed' ? 'Credited' : "You'll receive"}</div>
          <div className="text-base font-bold" style={{ color: '#101828' }}>{formatCurrency(creatorPayout)}</div>
        </div>
        <div className="text-right text-xs" style={{ color: '#9CA3AF' }}>
          {collab.status === 'completed' ? `Paid ${formatDate(collab.completedAt)}` : `Since ${formatDate(collab.paidAt)}`}
        </div>
      </div>
    </div>
  );
};

const PaymentDashboard = () => {
  const navigate = useNavigate();
  const [collaborations, setCollaborations] = useState([]);
  const [summary, setSummary] = useState({ upcomingAmount: 0, creditedAmount: 0, totalCollaborations: 0 });
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rangeFilter, setRangeFilter] = useState('');

  const fetchCollaborations = async (status = statusFilter, range = rangeFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (range) params.range = range;
      const res = await getCreatorCollaborations(params);
      setCollaborations(res.data.collaborations || []);
      setSummary(res.data.summary || { upcomingAmount: 0, creditedAmount: 0, totalCollaborations: 0 });
    } catch {
      setCollaborations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await getMyCreatorProfile();
        setBankDetails(profileRes.data.creator?.bankDetails || null);
      } catch { }
      fetchCollaborations();
    };
    init();
  }, []);

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    fetchCollaborations(value, rangeFilter);
  };

  const handleRangeChange = (value) => {
    setRangeFilter(value);
    fetchCollaborations(statusFilter, value);
  };

  const hasBankDetails = !!(bankDetails?.accountNumber);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-10">

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#101828' }}>Payment Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Your bank details, earnings, and collaboration history</p>
        </div>

        {/* top: bank details card + dashboard summary card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* bank details — clickable, navigates to BankDetails.jsx */}
          <button
            onClick={() => navigate('/creator/bank-details')}
            className="bg-white rounded-2xl border p-5 text-left transition-colors hover:bg-gray-50"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
                  <Landmark size={20} color="#155DFC" />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#101828' }}>Bank Details</div>
                  <div className="text-xs mt-0.5" style={{ color: hasBankDetails ? '#16A34A' : '#F59E0B' }}>
                    {hasBankDetails ? 'Added ✓' : 'Not added yet'}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color="#9CA3AF" />
            </div>
          </button>

          {/* dashboard summary — not clickable, just a display */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
                <Wallet size={20} color="#16A34A" />
              </div>
              <div className="text-sm font-bold" style={{ color: '#101828' }}>Earnings</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>Upcoming</div>
                <div className="text-base font-bold" style={{ color: '#101828' }}>{formatCurrency(summary.upcomingAmount)}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>Credited</div>
                <div className="text-base font-bold" style={{ color: '#16A34A' }}>{formatCurrency(summary.creditedAmount)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              style={{
                backgroundColor: statusFilter === opt.value ? '#101828' : 'white',
                color: statusFilter === opt.value ? 'white' : '#6B7280',
                borderColor: statusFilter === opt.value ? '#101828' : '#E5E7EB',
              }}
            >
              {opt.label}
            </button>
          ))}
          <select
            value={rangeFilter}
            onChange={e => handleRangeChange(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white focus:outline-none"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            {RANGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* collaboration list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
          </div>
        ) : collaborations.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-3xl mb-3">💼</div>
            <div className="font-bold text-sm mb-1" style={{ color: '#101828' }}>No collaborations yet</div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>Paid collabs will show up here once a brand pays you.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {collaborations.map(c => (
              <CollabCard key={c._id} collab={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDashboard;
