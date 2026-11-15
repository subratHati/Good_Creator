import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';
import { getAssistantChatList } from '../../api/adminAssistant';
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

const TABS = [
  { v: 'talked', l: 'Talked to the AI', hint: 'People who wrote to the AI, most recent first' },
  { v: 'silent', l: 'Never replied', hint: 'People the AI messaged who never wrote back' },
];

const AdminAIMessages = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('talked');
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  // ignores a slow, older response when filters change quickly
  const requestId = useRef(0);

  const fetchPage = async (pg) => {
    const mine = ++requestId.current;
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page: pg, limit: PAGE_SIZE, tab };
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const res = await getAssistantChatList(params);
      if (mine !== requestId.current) return;
      const items = res.data.list || [];
      setList((prev) => (pg === 1 ? items : [...prev, ...items]));
      if (res.data.stats) setStats(res.data.stats);
      setTotal(res.data.pagination?.total ?? 0);
      setHasMore(res.data.pagination?.hasMore ?? false);
      setPage(pg);
    } catch {
      if (mine === requestId.current) toast.error('Failed to load AI messages');
    } finally {
      if (mine === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchPage(1), search ? 400 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, roleFilter, search]);

  const statTiles = stats && [
    { label: 'People who talked to the AI', value: stats.talkedUsers },
    { label: 'Messages they sent (total)', value: stats.userMessagesTotal },
    { label: 'Messages they sent (7 days)', value: stats.userMessages7d },
    { label: 'AI check-ins sent (7 days)', value: stats.checkins7d },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="text-white">
            <ArrowLeft size={20} />
          </button>
          <Sparkles size={18} color="#C4B5FD" />
          <h1 className="font-black text-white">AI Messages</h1>
          <span className="ml-auto text-xs font-semibold" style={{ color: '#9CA3AF' }}>Read only</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {statTiles && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {statTiles.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border p-3 text-center" style={{ borderColor: '#E5E7EB' }}>
                <div className="text-xl font-black" style={{ color: '#101828' }}>{s.value}</div>
                <div className="text-[11px] leading-tight" style={{ color: '#9CA3AF' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {TABS.map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold border"
              style={{
                borderColor: tab === t.v ? '#7C3AED' : '#E5E7EB',
                backgroundColor: tab === t.v ? '#F5F3FF' : 'white',
                color: tab === t.v ? '#6D28D9' : '#6B7280',
              }}
            >
              {t.l}
            </button>
          ))}
        </div>
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>{TABS.find((t) => t.v === tab).hint}</p>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
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
                  borderColor: roleFilter === opt.v ? '#7C3AED' : '#E5E7EB',
                  backgroundColor: roleFilter === opt.v ? '#F5F3FF' : 'white',
                  color: roleFilter === opt.v ? '#6D28D9' : '#6B7280',
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
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EDE9FE', borderTopColor: '#7C3AED' }} />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-sm" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>
            Nothing here yet.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
                {list.map((item) => (
                  <button
                    key={item.conversationId}
                    onClick={() => navigate(`/admin/ai-messages/${item.conversationId}`)}
                    className="w-full text-left flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: '#155DFC' }}>
                      {item.photo ? <img src={item.photo} alt="" className="w-full h-full object-cover" /> : item.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: item.role === 'creator' ? '#EFF6FF' : '#FEF3C7', color: item.role === 'creator' ? '#1E3A8A' : '#92400E' }}>
                          {item.role}
                        </span>
                        <span className="text-sm font-bold truncate" style={{ color: '#101828' }}>{item.name}</span>
                      </div>
                      {tab === 'talked' ? (
                        <div className="text-xs truncate mt-0.5" style={{ color: '#4B5563' }}>
                          <span style={{ color: '#9CA3AF' }}>Last asked: </span>{item.lastUserText || '—'}
                        </div>
                      ) : (
                        <div className="text-xs truncate mt-0.5" style={{ color: '#4B5563' }}>
                          <span style={{ color: '#9CA3AF' }}>AI said: </span>{item.lastMessage || '—'}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>
                        {formatTime(tab === 'talked' ? item.lastUserAt : item.lastCheckinAt)}
                      </span>
                      {tab === 'talked' ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5F3FF', color: '#6D28D9' }}>
                          {item.userMessages} msg{item.userMessages === 1 ? '' : 's'}
                        </span>
                      ) : item.unopened > 0 ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                          {item.unopened} unopened
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                          opened
                        </span>
                      )}
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
                  style={{ borderColor: '#7C3AED', color: '#6D28D9', backgroundColor: 'white' }}
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

export default AdminAIMessages;
