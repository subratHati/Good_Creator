import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getBrandCollaborations } from '../../api/collaboration';

const statusStyles = {
  pending: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', label: 'Pending' },
  delivered: { bg: '#EFF6FF', color: '#1E3A8A', dot: '#155DFC', label: 'Delivered' },
  completed: { bg: '#F0FDF4', color: '#166534', dot: '#22C55E', label: 'Completed' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
];

const RANGE_OPTIONS = [
  { value: '', label: 'All time' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'this_year', label: 'This year' },
];

const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const TransactionCard = ({ collab }) => {
  const st = statusStyles[collab.status] || statusStyles.pending;
  const d = collab.deliverables || {};
  const boxes = [
    { type: 'Reel', qty: d.reels || 0 },
    { type: 'Post', qty: d.posts || 0 },
    { type: 'Story', qty: d.stories || 0 },
    { type: 'UGC', qty: d.ugc || 0 },
  ].filter(b => b.qty > 0);

  return (
    <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
            {collab.creatorId?.profilePhoto ? (
              <img src={collab.creatorId.profilePhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: '#101828' }}>{collab.creatorId?.name || 'Creator'}</div>
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
          <div className="text-xs" style={{ color: '#9CA3AF' }}>Paid</div>
          <div className="text-base font-bold" style={{ color: '#101828' }}>{formatCurrency(collab.amount)}</div>
        </div>
        <div className="text-right text-xs" style={{ color: '#9CA3AF' }}>
          {formatDate(collab.paidAt)}
        </div>
      </div>
    </div>
  );
};

const BrandTransactionHistory = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rangeFilter, setRangeFilter] = useState('');

  const fetchCollaborations = async (status = statusFilter, range = rangeFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (range) params.range = range;
      const res = await getBrandCollaborations(params);
      setCollaborations(res.data.collaborations || []);
    } catch {
      setCollaborations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    fetchCollaborations(value, rangeFilter);
  };

  const handleRangeChange = (value) => {
    setRangeFilter(value);
    fetchCollaborations(statusFilter, value);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-10">

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#101828' }}>Transaction History</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>All your collaborations and payments</p>
        </div>

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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
          </div>
        ) : collaborations.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-3xl mb-3">💼</div>
            <div className="font-bold text-sm mb-1" style={{ color: '#101828' }}>No transactions yet</div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>Paid collabs will show up here.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {collaborations.map(c => (
              <TransactionCard key={c._id} collab={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandTransactionHistory;
