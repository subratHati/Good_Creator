import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, MessageSquare, ExternalLink } from 'lucide-react';
import { getAssistantChatForAdmin } from '../../api/adminAssistant';
import { startAdminConversation } from '../../api/adminChat';
import toast from 'react-hot-toast';

const formatTime = (date) =>
  date ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const formatDay = (date) =>
  new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const topicLabel = (key) => (key || '').replace(/_/g, ' ');

// Read-only: there is deliberately no way to type or send anything on this screen.
const AdminAIMessageView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [opening, setOpening] = useState(false);
  const endRef = useRef(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAssistantChatForAdmin(id);
        setInfo(res.data.conversation);
        setMessages(res.data.messages || []);
        setHasMore(res.data.hasMore);
      } catch (err) {
        toast.error(err.response?.status === 404 ? 'Conversation not found' : 'Failed to load this conversation');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!loading && firstLoad.current && messages.length) {
      endRef.current?.scrollIntoView();
      firstLoad.current = false;
    }
  }, [loading, messages]);

  const loadOlder = async () => {
    if (!messages.length || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await getAssistantChatForAdmin(id, { before: messages[0].createdAt });
      setMessages((prev) => [...(res.data.messages || []), ...prev]);
      setHasMore(res.data.hasMore);
    } catch {
      toast.error('Could not load earlier messages');
    } finally {
      setLoadingOlder(false);
    }
  };

  const messageDirectly = async () => {
    if (!info || opening) return;
    setOpening(true);
    try {
      const res = await startAdminConversation(info.userId);
      navigate(`/admin/chat/${res.data.conversation._id}`);
    } catch {
      toast.error('Failed to open the direct chat');
    } finally {
      setOpening(false);
    }
  };

  let lastDay = '';

  return (
    <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#F5F5F7' }}>
      <div className="flex-shrink-0" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/admin/ai-messages')} className="text-white">
            <ArrowLeft size={20} />
          </button>
          {info && (
            <>
              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: '#155DFC' }}>
                {info.photo ? <img src={info.photo} alt="" className="w-full h-full object-cover" /> : info.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white truncate">{info.name}</div>
                <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                  <span className="capitalize">{info.role}</span> · {info.email}
                </div>
              </div>
              {info.profilePath && (
                <button onClick={() => navigate(info.profilePath)} title="View profile" className="p-2 rounded-lg text-white hover:bg-white/10">
                  <ExternalLink size={16} />
                </button>
              )}
              <button
                onClick={messageDirectly}
                disabled={opening}
                title="Open a direct chat with this user"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: '#155DFC' }}
              >
                <MessageSquare size={14} /> Message
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 border-b px-4 py-1.5 text-center text-[11px] flex items-center justify-center gap-1.5" style={{ backgroundColor: '#F5F3FF', borderColor: '#EDE9FE', color: '#6D28D9' }}>
        <Eye size={12} /> Read-only view of this user's chat with the AI. You can't reply here.
        {info && !info.checkinsEnabled ? ' · Check-ins are off for this user.' : ''}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EDE9FE', borderTopColor: '#7C3AED' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm py-16" style={{ color: '#9CA3AF' }}>No messages in this conversation.</div>
          ) : (
            <>
              {hasMore && (
                <div className="text-center mb-4">
                  <button
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-60"
                    style={{ borderColor: '#7C3AED', color: '#6D28D9', backgroundColor: 'white' }}
                  >
                    {loadingOlder ? 'Loading...' : 'Load earlier messages'}
                  </button>
                </div>
              )}
              {messages.map((m) => {
                const day = formatDay(m.createdAt);
                const showDay = day !== lastDay;
                lastDay = day;
                const fromUser = m.role === 'user';
                return (
                  <div key={m._id}>
                    {showDay && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}>{day}</span>
                      </div>
                    )}
                    <div className={`mb-3 flex flex-col ${fromUser ? 'items-end' : 'items-start'}`}>
                      {!fromUser && m.proactive && (
                        <span className="mb-1 ml-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: '#7C3AED' }}>
                          AI check-in{m.checkinTopic ? ` · ${topicLabel(m.checkinTopic)}` : ''}
                        </span>
                      )}
                      <div
                        className={`max-w-[85%] md:max-w-md px-4 py-2.5 rounded-2xl shadow-sm ${fromUser ? 'rounded-br-sm text-white' : 'rounded-bl-sm'}`}
                        style={fromUser ? { background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' } : { backgroundColor: 'white', color: '#101828', border: '1px solid #EDE9FE' }}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                        {m.cards?.length > 0 && (
                          <p className="mt-2 text-xs" style={{ color: fromUser ? 'rgba(255,255,255,0.8)' : '#6B7280' }}>
                            Showed {m.cards.length} {m.cards[0].type === 'campaign' ? 'campaign' : 'creator'}{m.cards.length > 1 ? 's' : ''}
                            {m.cards.some((c) => c.title) ? `: ${m.cards.map((c) => c.title).filter(Boolean).slice(0, 4).join(', ')}` : ''}
                          </p>
                        )}
                        <p className="text-[11px] mt-1" style={{ color: fromUser ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                          {fromUser ? 'User' : 'AI'} · {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
};

export default AdminAIMessageView;
