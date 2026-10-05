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

const BankDetailsModal = ({ creatorName, bankDetails, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="px-6 pt-6 pb-4">
        <h3 className="font-black text-lg mb-1" style={{ color: '#101828' }}>{creatorName}</h3>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>Bank account details</p>
      </div>
      <div className="px-6 pb-6">
        {bankDetails ? (
          <div className="space-y-3">
            {[
              { label: 'Account holder', value: bankDetails.accountHolderName },
              { label: 'Account number', value: bankDetails.accountNumber },
              { label: 'IFSC code', value: bankDetails.ifscCode },
              { label: 'Bank name', value: bankDetails.bankName },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#F0F0F0' }}>
                <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{label}</span>
                <span className="text-sm font-bold" style={{ color: '#101828' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-sm font-bold" style={{ color: '#DC2626' }}>⚠ No bank details on file</div>
            <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>This creator hasn't added their bank account yet.</div>
          </div>
        )}
      </div>
      <div className="px-6 pb-6">
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-black text-white"
          style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

const PayoutReceiptModal = ({ payout, onClose }) => {
  const [form, setForm] = useState({
    transactionRef: '',
    paymentMethod: 'Bank Transfer',
    paidOn: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('GoodCreator', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Payout Receipt', 14, 22);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, 22);

      doc.setFillColor(220, 252, 231);
      doc.roundedRect(14, 38, 70, 10, 2, 2, 'F');
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Collab ID: ${payout.collabId || 'N/A'}`, 17, 44.5);

      let y = 58;
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Paid To', 14, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`Creator: ${payout.creatorName}`, 14, y); y += 8;
      if (payout.creatorHandle) { doc.text(`Instagram: @${payout.creatorHandle}`, 14, y); y += 8; }
      doc.text(`Account holder: ${payout.bankDetails?.accountHolderName || '—'}`, 14, y); y += 8;
      doc.text(`Account number: ${payout.bankDetails?.accountNumber || '—'}`, 14, y); y += 8;
      doc.text(`IFSC: ${payout.bankDetails?.ifscCode || '—'}`, 14, y); y += 8;
      doc.text(`Bank: ${payout.bankDetails?.bankName || '—'}`, 14, y); y += 12;

      doc.setDrawColor(229, 231, 235);
      doc.line(14, y, 196, y); y += 10;

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Details', 14, y); y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Amount paid:', 14, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(`Rs. ${payout.creatorAmount?.toLocaleString('en-IN')}`, 100, y); y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Payment method:', 14, y);
      doc.text(form.paymentMethod, 100, y); y += 8;
      doc.text('Paid on:', 14, y);
      doc.text(new Date(form.paidOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 100, y); y += 8;
      if (form.transactionRef) {
        doc.text('Transaction ref:', 14, y);
        doc.text(form.transactionRef, 100, y); y += 8;
      }
      if (form.notes) {
        y += 4;
        doc.text('Notes:', 14, y); y += 7;
        const noteLines = doc.splitTextToSize(form.notes, 180);
        doc.text(noteLines, 14, y);
        y += noteLines.length * 6;
      }

      y += 8;
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(14, y, 55, 10, 3, 3, 'F');
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT COMPLETED', 17, y + 7);

      doc.setFillColor(249, 250, 251);
      doc.rect(0, 270, 210, 27, 'F');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text("GoodCreator — India's Creator Marketplace", 14, 280);
      doc.text('goodcreator.in', 14, 287);
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 120, 280);

      doc.save(`GoodCreator_Payout_Receipt_${payout.creatorName.replace(/\s+/g, '_')}_${payout.collabId || ''}.pdf`);
      toast.success('Receipt downloaded!');
      onClose();
    } catch (err) {
      console.error('Receipt PDF error:', err);
      toast.error('Failed to generate receipt');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="font-black text-lg mb-1" style={{ color: '#101828' }}>Generate payout receipt</h3>
          <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>For {payout.creatorName} · ₹{payout.creatorAmount?.toLocaleString('en-IN')}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>Payment method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option>Bank Transfer</option>
                <option>UPI</option>
                <option>NEFT</option>
                <option>IMPS</option>
                <option>RTGS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>Paid on</label>
              <input
                type="date"
                value={form.paidOn}
                onChange={(e) => setForm({ ...form, paidOn: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>
                Transaction reference <span className="font-normal" style={{ color: '#9CA3AF' }}>(optional)</span>
              </label>
              <input
                value={form.transactionRef}
                onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
                placeholder="UTR / transaction ID"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>
                Notes <span className="font-normal" style={{ color: '#9CA3AF' }}>(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border rounded-xl text-sm font-bold" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
            >
              {generating ? 'Generating...' : 'Generate & Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPayments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [selectedBankDetails, setSelectedBankDetails] = useState(null);
  const [receiptPayout, setReceiptPayout] = useState(null);

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
                      <button
                        onClick={() => setSelectedBankDetails({ creatorName: p.creatorName, bankDetails: p.bankDetails })}
                        className="font-bold text-sm hover:underline"
                        style={{ color: '#101828' }}
                      >
                        {p.creatorName}
                      </button>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>
                        {p.creatorHandle ? `@${p.creatorHandle}` : ''} {p.description ? `· ${p.description}` : ''}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                        Brand: <span className="font-semibold">{p.brandName}</span>
                        {p.deadline && <> · Deadline: {formatDateTime(p.deadline)}</>}
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
                      onClick={() => setReceiptPayout(p)}
                      className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold"
                      style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E5E7EB', color: '#155DFC' }}
                    >
                      Receipt
                    </button>
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
                  <div key={a.conversationId + (a.collabId || '')} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setSelectedBankDetails({ creatorName: a.creatorName, bankDetails: a.bankDetails })}
                        className="font-bold text-sm hover:underline"
                        style={{ color: '#101828' }}
                      >
                        {a.creatorName}
                      </button>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>
                        {a.creatorHandle ? `@${a.creatorHandle}` : ''} {a.description ? `· ${a.description}` : ''}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                        Brand: <span className="font-semibold">{a.brandName}</span>
                        {a.deadline && <> · Deadline: {formatDateTime(a.deadline)}</>}
                      </div>
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
                      <button
                        onClick={() => setSelectedBankDetails({ creatorName: p.creatorName, bankDetails: p.bankDetails })}
                        className="font-bold text-sm hover:underline"
                        style={{ color: '#101828' }}
                      >
                        {p.creatorName}
                      </button>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>{p.creatorHandle ? `@${p.creatorHandle}` : ''}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                        Brand: <span className="font-semibold">{p.brandName}</span>
                        {p.deadline && <> · Deadline: {formatDateTime(p.deadline)}</>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm" style={{ color: '#166534' }}>{formatCurrency(p.creatorAmount)}</div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>Paid {formatDateTime(p.payoutCompletedAt)}</div>
                    </div>
                    <button
                      onClick={() => setReceiptPayout(p)}
                      className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold"
                      style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E5E7EB', color: '#155DFC' }}
                    >
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {selectedBankDetails && (
        <BankDetailsModal
          creatorName={selectedBankDetails.creatorName}
          bankDetails={selectedBankDetails.bankDetails}
          onClose={() => setSelectedBankDetails(null)}
        />
      )}

      {receiptPayout && (
        <PayoutReceiptModal payout={receiptPayout} onClose={() => setReceiptPayout(null)} />
      )}

    </div>
  );
};

export default AdminPayments;
