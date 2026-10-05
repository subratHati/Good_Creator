import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MessageSquare } from 'lucide-react';
import { getAdminChatList, startAdminConversation } from '../../api/adminChat';
import toast from 'react-hot-toast';

const PAGE_SIZE = 25;

const formatTime = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const AdminChatList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [opening, setOpening] = useState(null);
  // guards against a slow, older response overwriting a newer one when
  // filters/search change quickly
  const requestId = useRef(0);

  const fetchPage = async (pg, { role = roleFilter, q = search } = {}) => {
    const myRequest = ++requestId.current;
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page: pg, limit: PAGE_SIZE };
      if (role) params.role = role;
      if (q.trim()) params.search = q.trim();
      const res = await getAdminChatList(params);
      if (myRequest !== requestId.current) return;
      const items = res.data.list || [];
      setList((prev) => (pg === 1 ? items : [...prev, ...items]));
      setTotal(res.data.pagination?.total ?? 0);
      setHasMore(res.data.pagination?.hasMore ?? false);
      setPage(pg);
    } catch {
      if (myRequest === requestId.current) toast.error('Failed to load chat list');
    } finally {
      if (myRequest === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // role filter change: refetch immediately from page 1
  // search change: debounce so we don't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => fetchPage(1, { role: roleFilter, q: search }), search ? 400 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, search]);

  const handleOpen = async (item) => {
    if (item.conversationId) {
      navigate(`/admin/chat/${item.conversationId}`);
      return;
    }
    setOpening(item.userId);
    try {
      const res = await startAdminConversation(item.userId);
      navigate(`/admin/chat/${res.data.conversation._id}`);
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black text-white">Direct Messages</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {[{ v: '', l: 'All' }, { v: 'creator', l: 'Creators' }, { v: 'brand', l: 'Brands' }].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setRoleFilter(opt.v)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border"
                style={{
                  borderColor: roleFilter === opt.v ? '#155DFC' : '#E5E7EB',
                  backgroundColor: roleFilter === opt.v ? '#EFF6FF' : 'white',
                  color: roleFilter === opt.v ? '#155DFC' : '#6B7280',
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
          {!loading && (
            <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
              Showing {list.length} of {total}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-sm" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>
            No users match these filters.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
                {list.map((item) => (
                  <button
                    key={item.userId}
                    onClick={() => handleOpen(item)}
                    disabled={opening === item.userId}
                    className="w-full text-left flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#155DFC' }}>
                        {item.photo ? <img src={item.photo} alt="" className="w-full h-full object-cover" /> : item.name?.[0]?.toUpperCase()}
                      </div>
                      {item.unreadByAdmin > 0 && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: item.role === 'creator' ? '#EFF6FF' : '#FEF3C7', color: item.role === 'creator' ? '#1E3A8A' : '#92400E' }}>
                          {item.role}
                        </span>
                        <span className={`text-sm truncate ${item.unreadByAdmin > 0 ? 'font-black' : 'font-bold'}`} style={{ color: '#101828' }}>
                          {item.name}
                        </span>
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: item.unreadByAdmin > 0 ? '#101828' : '#9CA3AF' }}>
                        {item.hasConversation ? (item.lastMessage || 'No messages yet') : 'Never messaged — tap to start'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{formatTime(item.lastMessageAt)}</span>
                      {!item.hasConversation && <MessageSquare size={14} color="#D1D5DB" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {hasMore && (
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminChatList;
