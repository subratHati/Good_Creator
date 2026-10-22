import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAssistantMessages, sendAssistantMessage } from '../../api/assistant';
import useAuth from '../../hooks/useAuth';
import { AssistantHeader, AssistantBubble, AssistantTyping, SuggestionChips, chipsForRole } from '../../components/assistant/AssistantUI';

const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const formatNumber = (num) => {
    if (!num) return '—';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
};

const CreatorResultCard = ({ card }) => {
    const navigate = useNavigate();
    const open = () => navigate(`/creator/${card.creatorId}`);
    return (
        <div
            onClick={open}
            className="w-[210px] flex-shrink-0 bg-white border rounded-2xl p-3 cursor-pointer hover:shadow-md transition-shadow"
            style={{ borderColor: '#EAECF0' }}
        >
            <div className="flex items-center gap-2.5 mb-3">
                <div
                    className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: '#155DFC' }}
                >
                    {card.profilePhoto
                        ? <img src={card.profilePhoto} alt={card.name} className="w-full h-full object-cover" />
                        : card.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: '#101828' }}>{card.name}</div>
                    <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                        {card.handle ? `@${card.handle}` : card.city || 'Creator'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1 mb-2">
                <div className="rounded-lg p-1.5 text-center" style={{ backgroundColor: '#F8FAFC' }}>
                    <div className="text-xs font-black" style={{ color: '#155DFC' }}>{formatNumber(card.followers)}</div>
                    <div className="text-[9px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Followers</div>
                </div>
                <div className="rounded-lg p-1.5 text-center" style={{ backgroundColor: '#F8FAFC' }}>
                    <div className="text-xs font-black" style={{ color: '#101828' }}>{formatNumber(card.avgViews)}</div>
                    <div className="text-[9px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Avg views</div>
                </div>
                <div className="rounded-lg p-1.5 text-center" style={{ backgroundColor: '#F8FAFC' }}>
                    <div className="text-xs font-black" style={{ color: '#16A34A' }}>{card.engagementRate ? `${card.engagementRate}%` : '—'}</div>
                    <div className="text-[9px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Engage</div>
                </div>
            </div>

            <div className="text-xs mb-3 truncate" style={{ color: '#6B7280' }}>
                {[card.city, card.reelPrice ? `Reel ₹${card.reelPrice.toLocaleString('en-IN')}` : null, card.barter ? 'Open to barter' : null]
                    .filter(Boolean)
                    .join(' · ') || 'Details on profile'}
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); open(); }}
                className="w-full py-2 rounded-xl text-xs font-bold border cursor-pointer hover:bg-blue-50"
                style={{ borderColor: '#155DFC', color: '#155DFC', backgroundColor: 'white' }}
            >
                View Profile
            </button>
        </div>
    );
};

const AssistantChatWindow = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [available, setAvailable] = useState(true);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAssistantMessages();
                if (!res.data.conversation) setAvailable(false);
                setMessages(res.data.messages || []);
            } catch {
                toast.error('Failed to load the assistant');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    const handleSend = async (override) => {
        const content = (typeof override === 'string' ? override : text).trim();
        if (!content || sending || !available) return;
        const tempId = `temp_${Date.now()}`;
        // show the user's message immediately; swap in the saved versions when the reply arrives
        setMessages((prev) => [...prev, { _id: tempId, role: 'user', text: content, createdAt: new Date().toISOString() }]);
        setText('');
        setSending(true);
        try {
            const res = await sendAssistantMessage(content);
            setMessages((prev) => [
                ...prev.filter((m) => m._id !== tempId),
                res.data.userMessage,
                res.data.assistantMessage,
            ]);
        } catch (err) {
            setMessages((prev) => prev.filter((m) => m._id !== tempId));
            setText(content);
            toast.error(err.response?.data?.message || 'Could not send. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="ai-chat-bg flex flex-col pb-[calc(60px_+_env(safe-area-inset-bottom))] md:pb-0" style={{ height: '100dvh' }}>
            <div className="flex-shrink-0">
                <AssistantHeader onBack={() => navigate('/messages')} />
            </div>
            <div className="flex-shrink-0 border-b border-violet-100 bg-white/70 px-4 py-1.5 text-center text-[11px] text-violet-700/80">
                AI-generated answers may not always be right. Please double-check important details.
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EDE9FE', borderTopColor: '#7C3AED' }} />
                    </div>
                ) : !available ? (
                    <div className="text-center text-sm py-16" style={{ color: '#9CA3AF' }}>
                        The assistant isn't available right now. Please check back soon.
                    </div>
                ) : (
                    messages.map((m) => {
                        const mine = m.role === 'user';
                        return (
                            <div key={m._id} className={`mb-3 flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                                {mine ? (
                                    <div className="max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                                        <p className="text-xs mt-1 text-white/70">{formatTime(m.createdAt)}</p>
                                    </div>
                                ) : (
                                    <AssistantBubble time={formatTime(m.createdAt)}>{m.text}</AssistantBubble>
                                )}
                                {!mine && m.cards?.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto mt-2 pb-1 pl-9 w-full">
                                        {m.cards.map((c) => <CreatorResultCard key={c.creatorId} card={c} />)}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {!loading && available && messages.length <= 1 && !sending && (
                    <div className="mt-1 mb-3">
                        <SuggestionChips chips={chipsForRole(user?.role)} onPick={(c) => handleSend(c)} />
                    </div>
                )}

                {sending && (
                    <div className="mb-3">
                        <AssistantTyping />
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <div
                className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3 flex-shrink-0"
                style={{ paddingBottom: '12px' }}
            >
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={available ? 'Ask about creators, campaigns, payouts…' : 'Assistant unavailable'}
                    disabled={!available}
                    maxLength={1000}
                    rows={1}
                    className="flex-1 px-4 py-2.5 bg-violet-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none max-h-32 disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending || !available}
                    className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0 cursor-pointer shadow-md"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

export default AssistantChatWindow;