import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getConversations } from '../../api/chat';
import useAuth from '../../hooks/useAuth';
import { io } from 'socket.io-client';
import useCreatorProfileGuard from '../../hooks/useCreatorProfileGuard';
import { getMyAdminConversation } from '../../api/adminChat';
import { getMyAssistantConversation } from '../../api/assistant';
import { AssistantLogo, AiTag, VerifiedTick } from '../../components/assistant/AssistantUI';

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

// same display-label logic used across the app's category pickers
const categoryLabels = {
  parenting_family: 'Parenting/Family',
  news_politics: 'News/Politics',
  pets_wildlife: 'Pets/Wildlife',
  ai_content: 'AI Content',
};
const getCategoryLabel = (cat) => {
  if (categoryLabels[cat]) return categoryLabels[cat];
  const spaced = cat.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { checking } = useCreatorProfileGuard();

  const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const [adminConversation, setAdminConversation] = useState(null);
  const [assistantConversation, setAssistantConversation] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [convRes, adminRes, aiRes] = await Promise.allSettled([
          getConversations(),
          getMyAdminConversation(),
          getMyAssistantConversation(),
        ]);
        if (convRes.status === 'fulfilled') setConversations(convRes.value.data.conversations);
        if (adminRes.status === 'fulfilled') setAdminConversation(adminRes.value.data.conversation);
        if (aiRes.status === 'fulfilled') setAssistantConversation(aiRes.value.data.conversation);
      } catch (e) {
        console.error('Messages load error:', e);
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

    // same pattern, for the single admin conversation — there's only
    // ever one per user, so this is simpler than the array update above
    // the server is the source of truth for the single admin conversation.
    // Re-fetching (instead of patching local state) also covers the very
    // first admin message, when there's nothing in state to patch yet.
    socket.on('admin_conversation_updated', () => {
      getMyAdminConversation()
        .then((res) => setAdminConversation(res.data.conversation))
        .catch(() => { });
    });

    return () => socket.disconnect();
  }, [user]);

  // Normalize both conversation types into one shape so they can be
  // sorted and rendered together. Admin conversations are flagged with
  // __isAdmin so the render logic below branches correctly for avatar,
  // name, and navigation target.
  const mergedList = [
    ...conversations.map((c) => ({ ...c, __isAdmin: false, __sortTime: c.lastMessageAt })),
    ...(adminConversation ? [{
      ...adminConversation,
      __isAdmin: true,
      __sortTime: adminConversation.lastMessageAt,
      unreadCount: adminConversation.unreadByUser || 0,
    }] : []),
    ...(assistantConversation ? [{
      ...assistantConversation,
      __isAssistant: true,
      __sortTime: assistantConversation.lastMessageAt,
      unreadCount: assistantConversation.unreadByUser || 0,
    }] : []),
  ].sort((a, b) => {
    // the AI assistant is always pinned to the top
    if (a.__isAssistant !== b.__isAssistant) return a.__isAssistant ? -1 : 1;
    return new Date(b.__sortTime) - new Date(a.__sortTime);
  });

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
      sub: conv.brandId?.category ? getCategoryLabel(conv.brandId.category) : '',
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
          <p className="text-sm text-gray-500 mt-1">{mergedList.length} conversation{mergedList.length !== 1 ? 's' : ''}</p>
        </div>

        {mergedList.length === 0 ? (
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
            {mergedList.map((conv, index) => {
              const other = conv.__isAssistant
                ? { name: 'GoodCreator Assistant', photo: null, sub: 'Official AI assistant' }
                : conv.__isAdmin
                  ? { name: 'GoodCreator Team', photo: null, sub: 'Official' }
                  : getOtherParty(conv);
              const unread = conv.unreadCount > 0;
              return (
                <div
                  key={conv.__isAssistant ? `assistant_${conv._id}` : conv.__isAdmin ? `admin_${conv._id}` : conv._id}
                  onClick={() => navigate(conv.__isAssistant ? '/messages/assistant' : conv.__isAdmin ? `/messages/admin/${conv._id}` : `/messages/${conv._id}`)}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${conv.__isAssistant ? 'ai-row-tint hover:bg-violet-50' : 'hover:bg-gray-50'} ${index !== mergedList.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  {/* avatar */}
                  <div className="relative flex-shrink-0">
                    {conv.__isAssistant ? (
                      <AssistantLogo size={48} glow verified />
                    ) : (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-lg" style={{ background: conv.__isAdmin ? 'linear-gradient(135deg, #155DFC, #0C3EB5)' : 'linear-gradient(135deg, #60A5FA, #2563EB)' }}>
                        {other.photo
                          ? <img src={other.photo} alt={other.name} className="w-full h-full object-cover" />
                          : conv.__isAdmin ? '✓' : other.name?.[0]?.toUpperCase()
                        }
                      </div>
                    )}
                    {unread && (
                      <div className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white ${conv.__isAssistant ? 'bg-fuchsia-500' : 'bg-blue-600'}`} />
                    )}
                  </div>

                  {/* content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`flex items-center gap-1.5 text-sm ${unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                        {other.name}
                        {conv.__isAssistant && (
                          <>
                            <VerifiedTick size={14} />
                            <AiTag />
                          </>
                        )}
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
