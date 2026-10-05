import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, Briefcase, X, Search, IndianRupee } from 'lucide-react';
import { io } from 'socket.io-client';
import { getAdminMessages, sendAdminChatMessage } from '../../api/adminChat';
import { searchCreators } from '../../api/creator';
import { searchOpenings } from '../../api/openings';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatTime = (date) =>
  date ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const CreatorShareCard = ({ share }) => (
  <a
    href={`/creator/${share.creatorId}`}
    target="_blank"
    rel="noreferrer"
    className="block w-[260px] rounded-2xl overflow-hidden bg-white border hover:bg-gray-50 transition-colors"
    style={{ borderColor: '#E5E7EB' }}
  >
    <div className="flex items-center gap-3 p-3">
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
        {share.profilePhoto ? <img src={share.profilePhoto} alt="" className="w-full h-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <div className="font-black text-sm truncate" style={{ color: '#101828' }}>{share.name}</div>
        <div className="text-xs" style={{ color: '#9CA3AF' }}>Creator profile</div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-1 px-3 pb-3">
      <div className="rounded-lg p-2 text-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-xs font-black" style={{ color: '#155DFC' }}>{formatNumber(share.followersCount)}</div>
        <div className="text-[9px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Followers</div>
      </div>
      <div className="rounded-lg p-2 text-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-xs font-black" style={{ color: '#16A34A' }}>{share.engagementRate ? `${share.engagementRate}%` : '—'}</div>
        <div className="text-[9px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Engage</div>
      </div>
      <div className="rounded-lg p-2 text-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-xs font-black" style={{ color: '#101828' }}>{formatNumber(share.avgViews)}</div>
        <div className="text-[9px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Views</div>
      </div>
    </div>
  </a>
);

const CampaignShareCard = ({ share }) => (
  <a
    href={`/openings/${share.openingId}`}
    target="_blank"
    rel="noreferrer"
    className="block w-[260px] rounded-2xl overflow-hidden bg-white border hover:bg-gray-50 transition-colors"
    style={{ borderColor: '#E5E7EB' }}
  >
    <div className="flex items-center gap-3 p-3">
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
        {share.brandLogo ? <img src={share.brandLogo} alt="" className="w-full h-full object-cover" /> : <Briefcase size={18} color="#92400E" />}
      </div>
      <div className="min-w-0">
        <div className="font-black text-sm truncate" style={{ color: '#101828' }}>{share.title}</div>
        <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>{share.brandName}</div>
      </div>
    </div>
    <div className="px-3 pb-3">
      <div className="rounded-lg p-2.5 flex items-center justify-center gap-1" style={{ backgroundColor: '#F0FDF4' }}>
        {share.isBarter ? (
          <span className="text-xs font-black" style={{ color: '#166534' }}>Barter collab</span>
        ) : (
          <>
            <IndianRupee size={12} color="#166534" />
            <span className="text-xs font-black" style={{ color: '#166534' }}>
              {share.budgetMin?.toLocaleString('en-IN')} – {share.budgetMax?.toLocaleString('en-IN')}
            </span>
          </>
        )}
      </div>
    </div>
  </a>
);

const CreatorPickerModal = ({ onClose, onPick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timeoutRef = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(timeoutRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchCreators({ search: val, limit: 10 });
        setResults(res.data.creators || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b" style={{ borderColor: '#F0F0F0' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base" style={{ color: '#101828' }}>Share a creator profile</h3>
            <button onClick={onClose} style={{ color: '#9CA3AF' }}><X size={18} /></button>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search creator by name..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: '#9CA3AF' }}>
              {query.trim().length < 2 ? 'Type at least 2 characters to search' : 'No creators found'}
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c._id}
                onClick={() => onPick(c)}
                className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
                  {c.profilePhoto ? <img src={c.profilePhoto} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#101828' }}>{c.name}</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>{formatNumber(c.instagram?.followersCount)} followers</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const CampaignPickerModal = ({ onClose, onPick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timeoutRef = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchOpenings({ search: val, limit: 10 });
        setResults(res.data.openings || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  useEffect(() => { handleSearch(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b" style={{ borderColor: '#F0F0F0' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base" style={{ color: '#101828' }}>Share a campaign</h3>
            <button onClick={onClose} style={{ color: '#9CA3AF' }}><X size={18} /></button>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search campaign or brand..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: '#9CA3AF' }}>No campaigns found</div>
          ) : (
            results.map((o) => (
              <button
                key={o._id}
                onClick={() => onPick(o)}
                className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                  {o.brandId?.logo ? <img src={o.brandId.logo} alt="" className="w-full h-full object-cover" /> : <Briefcase size={14} color="#92400E" />}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#101828' }}>{o.title}</div>
                  <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>{o.brandId?.brandName}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AdminChatWindow = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showCreatorPicker, setShowCreatorPicker] = useState(false);
  const [showCampaignPicker, setShowCampaignPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAdminMessages(conversationId);
        setMessages(res.data.messages);
        setConversation(res.data.conversation);
      } catch {
        toast.error('Failed to load conversation');
      }
    };
    load();

    socketRef.current = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current.emit('join_admin_conversation', conversationId);
    socketRef.current.on('new_admin_message', (message) => {
      setMessages((prev) => (prev.find((m) => m._id === message._id) ? prev : [...prev, message]));
    });

    return () => {
      socketRef.current.emit('leave_admin_conversation', conversationId);
      socketRef.current.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const pushMessage = (msg) => setMessages((prev) => (prev.find((m) => m._id === msg._id) ? prev : [...prev, msg]));

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const tempText = text.trim();
    setText('');
    try {
      const res = await sendAdminChatMessage(conversationId, { text: tempText, type: 'text' });
      pushMessage(res.data.message);
    } catch {
      toast.error('Failed to send');
      setText(tempText);
    } finally {
      setSending(false);
    }
  };

  const handleShareCreator = async (creator) => {
    setShowCreatorPicker(false);
    try {
      const res = await sendAdminChatMessage(conversationId, { type: 'creator_share', creatorIdToShare: creator._id });
      pushMessage(res.data.message);
    } catch {
      toast.error('Failed to share creator');
    }
  };

  const handleShareCampaign = async (opening) => {
    setShowCampaignPicker(false);
    try {
      const res = await sendAdminChatMessage(conversationId, { type: 'campaign_share', openingIdToShare: opening._id });
      pushMessage(res.data.message);
    } catch {
      toast.error('Failed to share campaign');
    }
  };

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/admin/chat')} className="p-1 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm" style={{ color: '#101828' }}>
            {conversation?.userRole === 'creator' ? 'Creator' : 'Brand'} conversation
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const isAdmin = m.senderRole === 'admin';
          return (
            <div key={m._id} className={`flex mb-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              {m.type === 'creator_share' && m.creatorShare ? (
                <CreatorShareCard share={m.creatorShare} />
              ) : m.type === 'campaign_share' && m.campaignShare ? (
                <CampaignShareCard share={m.campaignShare} />
              ) : (
                <div className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl ${isAdmin ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'}`}>
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  <p className="text-xs mt-1 text-gray-400">{formatTime(m.createdAt)}</p>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {user?.role === 'admin' && (
        <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowCreatorPicker(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: '#F8FAFC', color: '#101828', border: '1.5px solid #E5E7EB' }}
          >
            <Users size={15} /> Share Creator
          </button>
          <button
            onClick={() => setShowCampaignPicker(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: '#F8FAFC', color: '#101828', border: '1.5px solid #E5E7EB' }}
          >
            <Briefcase size={15} /> Share Campaign
          </button>
        </div>
      )}

      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3 flex-shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none resize-none max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {showCreatorPicker && <CreatorPickerModal onClose={() => setShowCreatorPicker(false)} onPick={handleShareCreator} />}
      {showCampaignPicker && <CampaignPickerModal onClose={() => setShowCampaignPicker(false)} onPick={handleShareCampaign} />}
    </div>
  );
};

export default AdminChatWindow;
