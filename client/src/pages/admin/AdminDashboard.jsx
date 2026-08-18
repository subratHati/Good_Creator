import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Bell, LogOut, CheckCircle, Circle, AlertTriangle, BarChart3 } from 'lucide-react';
import { getAllCreators, getAllBrands, sendAdminMessage, getReferralStats } from '../../api/admin';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ─── COMPOSE MODAL ────────────────────────────────────────────────────────────
const ComposeModal = ({ selectedCount, onClose, onSend }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState({ email: true, inApp: true });
  const [actionPath, setActionPath] = useState('/');
  const [sending, setSending] = useState(false);

  const toggleChannel = (key) => setChannels((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSend = async () => {
    if (!subject.trim()) return toast.error('Subject is required');
    if (!message.trim()) return toast.error('Message is required');
    const selectedChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);
    if (selectedChannels.length === 0) return toast.error('Select at least one channel');

    setSending(true);
    try {
      await onSend({ subject: subject.trim(), message: message.trim(), channels: selectedChannels, actionPath });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="font-black text-lg mb-1" style={{ color: '#101828' }}>Send message</h3>
          <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>
            Sending to <strong>{selectedCount}</strong> recipient{selectedCount !== 1 ? 's' : ''}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>Channels</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => toggleChannel('email')}
                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold"
                  style={{ borderColor: channels.email ? '#155DFC' : '#E5E7EB', backgroundColor: channels.email ? '#EFF6FF' : 'white', color: channels.email ? '#155DFC' : '#6B7280' }}
                >
                  <Mail size={15} /> Email
                </button>
                <button
                  type="button"
                  onClick={() => toggleChannel('inApp')}
                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold"
                  style={{ borderColor: channels.inApp ? '#155DFC' : '#E5E7EB', backgroundColor: channels.inApp ? '#EFF6FF' : 'white', color: channels.inApp ? '#155DFC' : '#6B7280' }}
                >
                  <Bell size={15} /> In-app
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Instagram connection is back!"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Write your message..."
                className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>
                Action link <span className="font-normal" style={{ color: '#9CA3AF' }}>(where in-app notification takes them, optional)</span>
              </label>
              <input
                value={actionPath}
                onChange={(e) => setActionPath(e.target.value)}
                placeholder="/creator/profile"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border rounded-xl text-sm font-bold" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
            >
              {sending ? 'Sending...' : `Send to ${selectedCount}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('creators');
  const [creators, setCreators] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instagramFilter, setInstagramFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [referralStats, setReferralStats] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    getReferralStats()
      .then((res) => setReferralStats(res.data.counts))
      .catch(() => setReferralStats(null));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'creators') {
        const res = await getAllCreators(instagramFilter ? { instagramStatus: instagramFilter } : {});
        setCreators(res.data.creators || []);
      } else {
        const res = await getAllBrands();
        setBrands(res.data.brands || []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds([]);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, instagramFilter]);

  const currentList = tab === 'creators' ? creators : brands;

  const toggleSelect = (userId) => {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const toggleSelectAll = () => {
    const allUserIds = currentList.map((item) => item.userId?._id).filter(Boolean);
    setSelectedIds((prev) => (prev.length === allUserIds.length ? [] : allUserIds));
  };

  const handleSend = async (payload) => {
    try {
      const res = await sendAdminMessage({ userIds: selectedIds, ...payload });
      const { emailSent, emailFailed, inAppCreated } = res.data.results;
      toast.success(`Sent: ${emailSent} email${emailFailed ? `, ${emailFailed} failed` : ''}${inAppCreated ? `, ${inAppCreated} notifications` : ''}`);
      setShowCompose(false);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send messages');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* header */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="font-black text-white">
            Good<span style={{ color: '#155DFC' }}>Creator</span> <span style={{ color: 'rgba(255,255,255,0.4)' }}>Admin</span>

          </h1>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* payments + issues section links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/payments')}
            className="w-full flex items-center justify-between bg-white rounded-2xl border p-5 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="text-left">
              <div className="text-sm font-black" style={{ color: '#101828' }}>💰 Payments Dashboard</div>
              <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>View collections, commissions, and pending creator payouts</div>
            </div>
            <span style={{ color: '#155DFC', fontSize: '20px' }}>→</span>
          </button>
          <button
            onClick={() => navigate('/admin/issues')}
            className="w-full flex items-center justify-between bg-white rounded-2xl border p-5 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="text-left flex items-center gap-3">
              <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
              <div>
                <div className="text-sm font-black" style={{ color: '#101828' }}>Reported Issues</div>
                <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Review issues raised by creators and brands</div>
              </div>
            </div>
            <span style={{ color: '#155DFC', fontSize: '20px' }}>→</span>
          </button>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="w-full flex items-center justify-between bg-white rounded-2xl border p-5 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="text-left flex items-center gap-3">
              <BarChart3 size={20} color="#155DFC" style={{ flexShrink: 0 }} />
              <div>
                <div className="text-sm font-black" style={{ color: '#101828' }}>Analytics</div>
                <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Users, campaigns, and collaboration insights</div>
              </div>
            </div>
            <span style={{ color: '#155DFC', fontSize: '20px' }}>→</span>
          </button>
        </div>

        {/* referral source stats */}
        {referralStats && (
          <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#E5E7EB' }}>
            <h3 className="text-sm font-black mb-4" style={{ color: '#101828' }}>How users found us</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { key: 'instagram', label: 'Instagram', emoji: '📸' },
                { key: 'friend_referral', label: 'Friend/Referral', emoji: '👥' },
                { key: 'google_search', label: 'Google Search', emoji: '🔍' },
                { key: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
                { key: 'other', label: 'Other', emoji: '✨' },
              ].map((s) => (
                <div key={s.key} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F0F0F0' }}>
                  <div className="text-lg mb-1">{s.emoji}</div>
                  <div className="text-xl font-black" style={{ color: '#101828' }}>{referralStats[s.key] || 0}</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* tabs */}
        <div className="flex items-center gap-2 mb-6">
          {['creators', 'brands'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-xl text-sm font-black capitalize"
              style={{ backgroundColor: tab === t ? '#101828' : 'white', color: tab === t ? 'white' : '#6B7280', border: '1.5px solid #E5E7EB' }}
            >
              {t} ({t === 'creators' ? creators.length : brands.length})
            </button>
          ))}
        </div>

        {/* filters — creators only */}
        {tab === 'creators' && (
          <div className="flex items-center gap-2 mb-4">
            {[
              { key: '', label: 'All' },
              { key: 'connected', label: 'Instagram Connected' },
              { key: 'manual', label: 'Manual Stats' },
              { key: 'none', label: 'No Instagram Data' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setInstagramFilter(f.key)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border"
                style={{
                  borderColor: instagramFilter === f.key ? '#155DFC' : '#E5E7EB',
                  backgroundColor: instagramFilter === f.key ? '#EFF6FF' : 'white',
                  color: instagramFilter === f.key ? '#155DFC' : '#6B7280',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* list */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#F0F0F0', backgroundColor: '#FAFAFA' }}>
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold" style={{ color: '#6B7280' }}>
              {selectedIds.length > 0 && selectedIds.length === currentList.length ? (
                <CheckCircle size={16} color="#155DFC" />
              ) : (
                <Circle size={16} />
              )}
              Select all
            </button>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>{selectedIds.length} selected</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: '#9CA3AF' }}>No results.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
              {currentList.map((item) => {
                const userIdStr = item.userId?._id;
                const isSelected = selectedIds.includes(userIdStr);
                return (
                  <div
                    key={item._id}
                    onClick={() => userIdStr && toggleSelect(userIdStr)}
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50"
                  >
                    {isSelected ? <CheckCircle size={18} color="#155DFC" /> : <Circle size={18} color="#D1D5DB" />}

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: '#101828' }}>
                        {tab === 'creators' ? item.name : item.brandName}
                      </div>
                      <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                        {item.userId?.email || '—'}
                      </div>
                    </div>

                    {tab === 'creators' && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold" style={{ color: '#101828' }}>
                          {formatNumber(item.instagram?.followersCount)} followers
                        </div>
                        <div className="text-xs" style={{ color: item.instagram?.isConnected ? '#166534' : item.instagram?.isManuallyAdded ? '#92400E' : '#9CA3AF' }}>
                          {item.instagram?.isConnected ? 'Connected' : item.instagram?.isManuallyAdded ? 'Manual' : 'Not connected'}
                        </div>
                      </div>
                    )}

                    <div className="text-right flex-shrink-0 w-24">
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(item.userId?.createdAt)}</div>
                      <div className="text-xs font-semibold" style={{ color: item.userId?.isActive ? '#166534' : '#991B1B' }}>
                        {item.userId?.isActive ? 'Active' : 'Deactivated'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* floating action bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm text-white"
            style={{ backgroundColor: '#155DFC', boxShadow: '0 6px 0 0 #0c3eb5' }}
          >
            <Mail size={16} /> Message {selectedIds.length} selected
          </button>
        </div>
      )}

      {showCompose && (
        <ComposeModal selectedCount={selectedIds.length} onClose={() => setShowCompose(false)} onSend={handleSend} />
      )}
    </div>
  );
};

export default AdminDashboard;
