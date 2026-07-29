import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getPaymentOverview, markPayoutCompleted } from '../../api/admin';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const formatCurrency = (num) => `₹${(num || 0).toLocaleString('en-IN')}`;

const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// Live countdown showing time remaining in the 24-hour payout window,
// or how far overdue it is if that window has already passed.
const PayoutCountdown = ({ approvedAt }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!approvedAt) return <span style={{ color: '#9CA3AF' }}>—</span>;

  const deadline = new Date(approvedAt).getTime() + 24 * 60 * 60 * 1000;
  const diffMs = deadline - now;
  const overdue = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const mins = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <span
      className="flex items-center gap-1 text-xs font-black"
      style={{ color: overdue ? '#DC2626' : hours < 4 ? '#D97706' : '#166534' }}
    >
      {overdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
      {overdue ? `${hours}h ${mins}m overdue` : `${hours}h ${mins}m left`}
    </span>
  );
};

const StatCard = ({ label, value, color, sub }) => (
  <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E7EB' }}>
    <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>{label}</div>
    <div className="text-2xl font-black" style={{ color: color || '#101828' }}>{formatCurrency(value)}</div>
    {sub && <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{sub}</div>}
  </div>
);

const AdminPayments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await getPaymentOverview();
      setOverview(res.data);
    } catch {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleMarkPaid = async (deliveryMessageId) => {
    setMarkingId(deliveryMessageId);
    try {
      await markPayoutCompleted(deliveryMessageId);
      toast.success('Marked as paid');
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setMarkingId(null);
    }
  };

  if (loading || !overview) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
      </div>
    );
  }

  const { totalCollected, commissionRealized, commissionUpcoming, activeCollaborations, payoutQueue, completedPayouts } = overview;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black text-white">Payments</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Collected" value={totalCollected} sub={`${activeCollaborations.length + payoutQueue.length + completedPayouts.length} payments`} />
          <StatCard label="Commission Earned" value={commissionRealized} color="#166534" sub="Delivered & confirmed" />
          <StatCard label="Commission Upcoming" value={commissionUpcoming} color="#D97706" sub="Awaiting delivery" />
          <StatCard label="Pending Payouts" value={payoutQueue.reduce((s, p) => s + p.creatorAmount, 0)} color="#DC2626" sub={`${payoutQueue.length} creator${payoutQueue.length !== 1 ? 's' : ''}`} />
        </div>

        {/* payout queue — the urgent section */}
        <div>
          <h2 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#101828' }}>
            <Clock size={18} color="#DC2626" /> Payout Queue ({payoutQueue.length})
          </h2>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
            {payoutQueue.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>No pending payouts.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
                {payoutQueue.map((p) => (
                  <div key={p.deliveryMessageId} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm" style={{ color: '#101828' }}>{p.creatorName}</div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>
                        {p.creatorHandle ? `@${p.creatorHandle}` : ''} {p.description ? `· ${p.description}` : ''}
                      </div>
                      {!p.hasBankDetails && (
                        <div className="text-xs font-bold mt-1" style={{ color: '#DC2626' }}>⚠ No bank details on file</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-sm" style={{ color: '#101828' }}>{formatCurrency(p.creatorAmount)}</div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>of {formatCurrency(p.amount)}</div>
                    </div>
                    <div className="flex-shrink-0 w-28 text-right">
                      <PayoutCountdown approvedAt={p.approvedAt} />
                      <div className="text-xs mt-0.5" style={{ color: '#D1D5DB' }}>{formatDateTime(p.approvedAt)}</div>
                    </div>
                    <button
                      onClick={() => handleMarkPaid(p.deliveryMessageId)}
                      disabled={markingId === p.deliveryMessageId}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-60"
                      style={{ backgroundColor: '#155DFC' }}
                    >
                      {markingId === p.deliveryMessageId ? '...' : 'Mark Paid'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* active collaborations — paid, awaiting delivery */}
        <div>
          <h2 className="text-lg font-black mb-4" style={{ color: '#101828' }}>
            Active Collaborations ({activeCollaborations.length})
          </h2>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
            {activeCollaborations.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>No active collaborations.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
                {activeCollaborations.map((a) => (
                  <div key={a.conversationId} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>{a.description || 'No description'}</div>
                      <div className="text-xs" style={{ color: '#D1D5DB' }}>Requested {formatDateTime(a.requestedAt)}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm" style={{ color: '#101828' }}>{formatCurrency(a.amount)}</div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>awaiting delivery</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* completed payouts */}
        <div>
          <h2 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#101828' }}>
            <CheckCircle2 size={18} color="#166534" /> Completed Payouts ({completedPayouts.length})
          </h2>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
            {completedPayouts.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>No completed payouts yet.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
                {completedPayouts.map((p) => (
                  <div key={p.deliveryMessageId} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm" style={{ color: '#101828' }}>{p.creatorName}</div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>{p.creatorHandle ? `@${p.creatorHandle}` : ''}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm" style={{ color: '#166534' }}>{formatCurrency(p.creatorAmount)}</div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>Paid {formatDateTime(p.payoutCompletedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPayments;
