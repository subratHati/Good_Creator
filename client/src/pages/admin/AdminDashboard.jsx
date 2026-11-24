import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Bell, LogOut, CheckCircle, Circle, AlertTriangle, BarChart3, Search, Smartphone, MessageSquare, Sparkles, ShieldCheck } from 'lucide-react';
import { getAllCreators, getAllBrands, sendAdminMessage, getReferralStats, getBrandVerifications } from '../../api/admin';
import { sendAdminPush } from '../../api/push';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const PAGE_SIZE = 25;

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

// "3 days ago" style. Last-active is only saved about once an hour, so anything
// under an hour is shown as "within the hour" instead of a false-precise minute.
const timeAgo = (date) => {
  if (!date) return '';
  const ms = Date.now() - new Date(date).getTime();
  if (Number.isNaN(ms)) return '';
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (ms < hour) return 'within the hour';
  if (ms < day) { const h = Math.floor(ms / hour); return h + (h === 1 ? ' hr ago' : ' hrs ago'); }
  if (ms < 30 * day) { const d = Math.floor(ms / day); return d + (d === 1 ? ' day ago' : ' days ago'); }
  return formatDate(date);
};

// colour for the "active" line: green = today, dark = this week, grey = older
const activeColor = (date) => {
  if (!date) return '#9CA3AF';
  const ms = Date.now() - new Date(date).getTime();
  if (ms < 24 * 60 * 60 * 1000) return '#166534';
  if (ms < 7 * 24 * 60 * 60 * 1000) return '#101828';
  return '#9CA3AF';
};

// what to say about the Instagram sync on one row (creator or brand)
const syncLine = (item, isCreatorTab) => {
  const ig = item.instagram || {};
  const when = ig.lastSynced ? timeAgo(ig.lastSynced) : '';
  if (isCreatorTab) {
    if (ig.isConnected) return when ? 'IG synced ' + when : 'IG sync: not recorded';
    if (ig.isManuallyAdded) return when ? 'Stats entered ' + when : 'Manual stats';
    return 'No Instagram';
  }
  if (ig.isVerified) return when ? 'IG synced ' + when : 'IG sync: not recorded yet';
  return 'No Instagram';
};

// <helper:toggleAllLoaded>
// "Select all" acts on the users currently loaded on screen, and leaves any
// selections made elsewhere (earlier pages, other searches) untouched.
const toggleAllLoaded = (selectedIds, loadedIds) => {
  if (loadedIds.length === 0) return selectedIds;
  const selected = new Set(selectedIds);
  const allSelected = loadedIds.every((id) => selected.has(id));
  if (allSelected) {
    const loadedSet = new Set(loadedIds);
    return selectedIds.filter((id) => !loadedSet.has(id));
  }
  return [...new Set([...selectedIds, ...loadedIds])];
};
// </helper:toggleAllLoaded>

// ─── COMPOSE MODAL ────────────────────────────────────────────────────────────
const ComposeModal = ({ selectedCount, onClose, onSend }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState({ email: true, inApp: true, push: true });
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
                <button
                  type="button"
                  onClick={() => toggleChannel('push')}
                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold"
                  style={{ borderColor: channels.push ? '#155DFC' : '#E5E7EB', backgroundColor: channels.push ? '#EFF6FF' : 'white', color: channels.push ? '#155DFC' : '#6B7280' }}
                >
                  <Smartphone size={15} /> Push
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
  // one list for whichever tab is active — paged from the server, 25 at a time
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0); // true total matching the current filters
  const [overall, setOverall] = useState({ creators: 0, brands: 0 }); // unfiltered totals, for the other tab's label
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [instagramFilter, setInstagramFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' signups or 'active' (recently active first)
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [referralStats, setReferralStats] = useState(null);
  const [pendingBrands, setPendingBrands] = useState(0); // brands waiting to be verified
  const [searchQuery, setSearchQuery] = useState('');
  // stops a slow, older response from overwriting a newer one when the tab,
  // filter or search changes quickly
  const requestId = useRef(0);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    getReferralStats()
      .then((res) => setReferralStats(res.data.counts))
      .catch(() => setReferralStats(null));
    getBrandVerifications({ status: 'pending', limit: 1 })
      .then((res) => setPendingBrands(res.data.counts?.pending || 0))
      .catch(() => setPendingBrands(0));
  }, []);

  const fetchPage = async (pg) => {
    const myRequest = ++requestId.current;
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page: pg, limit: PAGE_SIZE };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (sortBy === 'active') params.sort = 'active';
      let res;
      if (tab === 'creators') {
        if (instagramFilter) params.instagramStatus = instagramFilter;
        res = await getAllCreators(params);
      } else {
        res = await getAllBrands(params);
      }
      if (myRequest !== requestId.current) return;

      const items = (tab === 'creators' ? res.data.creators : res.data.brands) || [];
      setList((prev) => {
        if (pg === 1) return items;
        // de-dupe by _id: if someone registers while you're paging, rows can shift between pages
        const seen = new Set(prev.map((i) => i._id));
        return [...prev, ...items.filter((i) => !seen.has(i._id))];
      });
      setTotal(res.data.total ?? 0);
      if (res.data.overall) setOverall(res.data.overall);
      setHasMore(res.data.pagination?.hasMore ?? false);
      setPage(pg);
    } catch {
      if (myRequest === requestId.current) toast.error('Failed to load data');
    } finally {
      if (myRequest === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // switching tab or the Instagram filter clears the selection (as before);
  // changing the search or loading more does NOT, so you can pick people
  // across several searches and pages and message them all at once
  useEffect(() => {
    setSelectedIds([]);
  }, [tab, instagramFilter]);

  // refetch page 1 whenever the tab, filter or search changes (search is debounced)
  useEffect(() => {
    const t = setTimeout(() => fetchPage(1), searchQuery.trim() ? 400 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, instagramFilter, searchQuery, sortBy]);

  const handleTabChange = (t) => {
    if (t === tab) return;
    // clear first so the previous tab's rows are never rendered with this tab's layout
    setList([]);
    setLoading(true);
    setTab(t);
  };

  const loadedUserIds = list.map((item) => item.userId?._id).filter(Boolean);
  const allLoadedSelected = loadedUserIds.length > 0 && loadedUserIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (userId) => {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => toggleAllLoaded(prev, loadedUserIds));
  };

  const handleSend = async (payload) => {
    const { channels, subject, message, actionPath } = payload;
    const wantsPush = channels.includes('push');
    // sendAdminMessage only knows about email/inApp — strip push out of
    // what's sent there, and fire it as a separate call to the push endpoint
    const nonPushChannels = channels.filter((c) => c !== 'push');

    try {
      const results = { emailSent: 0, emailFailed: 0, inAppCreated: 0, pushSent: 0, pushFailed: 0 };

      if (nonPushChannels.length > 0) {
        const res = await sendAdminMessage({ userIds: selectedIds, subject, message, channels: nonPushChannels, actionPath });
        Object.assign(results, res.data.results);
      }

      if (wantsPush) {
        const pushRes = await sendAdminPush({ userIds: selectedIds, title: subject, body: message, url: actionPath });
        results.pushSent = pushRes.data.totalSent;
        results.pushFailed = pushRes.data.totalFailed;
      }

      const parts = [];
      if (results.emailSent) parts.push(`${results.emailSent} email${results.emailFailed ? `, ${results.emailFailed} failed` : ''}`);
      if (results.inAppCreated) parts.push(`${results.inAppCreated} in-app`);
      if (wantsPush) parts.push(`${results.pushSent} push${results.pushFailed ? `, ${results.pushFailed} failed` : ''}`);
      toast.success(`Sent: ${parts.join(', ') || 'nothing selected'}`);

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
            onClick={() => navigate('/admin/brand-verification')}
            className="w-full flex items-center justify-between bg-white rounded-2xl border p-5 hover:bg-gray-50 transition-colors"
            style={{ borderColor: pendingBrands > 0 ? '#FEDF89' : '#E5E7EB' }}
          >
            <div className="text-left flex items-center gap-3">
              <ShieldCheck size={20} color="#12B76A" style={{ flexShrink: 0 }} />
              <div>
                <div className="text-sm font-black" style={{ color: '#101828' }}>
                  Verify Brands
                  {pendingBrands > 0 && (
                    <span className="ml-2 text-xs font-black rounded-full px-2 py-0.5" style={{ backgroundColor: '#FEF0C7', color: '#B54708' }}>{pendingBrands} waiting</span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Call new brands, then mark them verified</div>
              </div>
            </div>
            <span style={{ color: '#155DFC', fontSize: '20px' }}>→</span>
          </button>
          <button
            onClick={() => navigate('/admin/deleted-accounts')}
            className="order-last w-full flex items-center justify-between bg-white rounded-2xl border p-5 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="text-left">
              <div className="text-sm font-black" style={{ color: '#101828' }}>Deleted Accounts</div>
              <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>See who deleted their account and why</div>
            </div>
            <span style={{ color: '#155DFC', fontSize: '20px' }}>→</span>
          </button>
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
          <button
            onClick={() => navigate('/admin/chat')}
            className="w-full flex items-center justify-between bg-white rounded-2xl border p-5 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="text-left flex items-center gap-3">
              <MessageSquare size={20} color="#155DFC" style={{ flexShrink: 0 }} />
              <div>
                <div className="text-sm font-black" style={{ color: '#101828' }}>Direct Messages</div>
                <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Message creators and brands directly</div>
              </div>
            </div>
            <span style={{ color: '#155DFC', fontSize: '20px' }}>→</span>
          </button>
          <button
            onClick={() => navigate('/admin/ai-messages')}
            className="w-full flex items-center justify-between bg-white rounded-2xl border p-5 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="text-left flex items-center gap-3">
              <Sparkles size={20} color="#7C3AED" style={{ flexShrink: 0 }} />
              <div>
                <div className="text-sm font-black" style={{ color: '#101828' }}>AI Messages</div>
                <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>See what the AI says to users and how they answer (read only)</div>
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

        {/* tabs — active tab shows the true total for the current filters,
            the other tab shows its unfiltered total */}
        <div className="flex items-center gap-2 mb-6">
          {['creators', 'brands'].map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className="px-4 py-2 rounded-xl text-sm font-black capitalize"
              style={{ backgroundColor: tab === t ? '#101828' : 'white', color: tab === t ? 'white' : '#6B7280', border: '1.5px solid #E5E7EB' }}
            >
              {t} ({t === tab ? total : overall[t]})
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

        {/* sort */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold" style={{ color: '#6B7280' }}>Sort by</span>
          {[
            { key: 'newest', label: 'Newest signups' },
            { key: 'active', label: 'Recently active' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className="px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{
                borderColor: sortBy === s.key ? '#155DFC' : '#E5E7EB',
                backgroundColor: sortBy === s.key ? '#EFF6FF' : 'white',
                color: sortBy === s.key ? '#155DFC' : '#6B7280',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, username or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>

        {/* list */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#F0F0F0', backgroundColor: '#FAFAFA' }}>
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold" style={{ color: '#6B7280' }}>
              {allLoadedSelected ? (
                <CheckCircle size={16} color="#155DFC" />
              ) : (
                <Circle size={16} />
              )}
              Select all shown
            </button>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>{selectedIds.length} selected</span>
            {!loading && (
              <span className="text-xs ml-auto" style={{ color: '#9CA3AF' }}>Showing {list.length} of {total}</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
            </div>
          ) : list.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: '#9CA3AF' }}>No results.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
              {list.map((item) => {
                const userIdStr = item.userId?._id;
                const isSelected = selectedIds.includes(userIdStr);
                return (
                  <div
                    key={item._id}
                    onClick={() => userIdStr && toggleSelect(userIdStr)}
                    className="flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-1 px-5 py-3.5 cursor-pointer hover:bg-gray-50"
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

                    <div className="hidden md:block text-right flex-shrink-0 w-36">
                      <div
                        className="text-xs font-bold"
                        style={{ color: activeColor(item.userId?.lastActiveAt) }}
                        title={item.userId?.lastActiveAt ? 'Last active: ' + formatDateTime(item.userId.lastActiveAt) : ''}
                      >
                        {item.userId?.lastActiveAt ? 'Active ' + timeAgo(item.userId.lastActiveAt) : 'Active: not recorded'}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: '#9CA3AF' }}
                        title={item.instagram?.lastSynced ? 'Last Instagram sync: ' + formatDateTime(item.instagram.lastSynced) : ''}
                      >
                        {syncLine(item, tab === 'creators')}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 w-24">
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(item.userId?.createdAt)}</div>
                      <div className="text-xs font-semibold" style={{ color: item.userId?.isActive ? '#166534' : '#991B1B' }}>
                        {item.userId?.isActive ? 'Active' : 'Deactivated'}
                      </div>
                    </div>

                    <div className="md:hidden basis-full pl-[34px] text-xs">
                      <span className="font-bold" style={{ color: activeColor(item.userId?.lastActiveAt) }}>
                        {item.userId?.lastActiveAt ? 'Active ' + timeAgo(item.userId.lastActiveAt) : 'Active: not recorded'}
                      </span>
                      <span style={{ color: '#9CA3AF' }}> · {syncLine(item, tab === 'creators')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* load more */}
        {!loading && hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-xl text-sm font-bold border disabled:opacity-60"
              style={{ borderColor: '#155DFC', color: '#155DFC', backgroundColor: 'white' }}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
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
