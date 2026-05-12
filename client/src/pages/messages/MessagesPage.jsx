import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getConversations } from '../../api/chat';
import useAuth from '../../hooks/useAuth';
import { io } from 'socket.io-client';
import useCreatorProfileGuard from '../../hooks/useCreatorProfileGuard';

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { checking } = useCreatorProfileGuard();

  const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getConversations();
        setConversations(res.data.conversations);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.emit('join_user', user.id);

    socket.on('conversation_updated', async ({ conversationId, lastMessage, lastMessageAt }) => {
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversationId);

        if (!exists) {
          // conversation not in list yet — refetch all
          getConversations().then(res => {
            setConversations(res.data.conversations);
          }).catch(() => { });
          return prev;
        }

        const updated = prev.map(c => {
          if (c._id === conversationId) {
            return {
              ...c,
              lastMessage,
              lastMessageAt,
              unreadCount: (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
        return [...updated].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    });

    return () => socket.disconnect();
  }, [user]);

  const getOtherParty = (conv) => {
    if (user.role === 'brand') {
      return {
        name: conv.creatorId?.name || 'Creator',
        photo: conv.creatorId?.profilePhoto,
        sub: conv.creatorId?.instagram?.handle ? `@${conv.creatorId.instagram.handle}` : '',
      };
    }
    return {
      name: conv.brandId?.brandName || 'Brand',
      photo: conv.brandId?.logo,
      sub: conv.brandId?.category || '',
    };
  };

  if (checking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">💬</div>
            <div className="font-semibold text-gray-900 mb-2">No messages yet</div>
            <div className="text-sm text-gray-500 mb-6">
              {user.role === 'brand'
                ? 'Start a conversation by visiting a creator profile.'
                : 'Brands will message you here when they are interested in working with you.'}
            </div>
            {user.role === 'brand' && (
              <button
                onClick={() => navigate('/brand/browse-creators')}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Browse creators
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {conversations.map((conv, index) => {
              const other = getOtherParty(conv);
              const unread = conv.unreadCount > 0;
              return (
                <div
                  key={conv._id}
                  onClick={() => navigate(`/messages/${conv._id}`)}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${index !== conversations.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  {/* avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {other.photo
                        ? <img src={other.photo} alt={other.name} className="w-full h-full object-cover" />
                        : other.name?.[0]?.toUpperCase()
                      }
                    </div>
                    {unread && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm ${unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                        {other.name}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${unread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage || 'Start a conversation'}
                      </span>
                      {unread && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                    {other.sub && (
                      <div className="text-xs text-gray-400 mt-0.5">{other.sub}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
