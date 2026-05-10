import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { getMessages, sendMessage } from '../../api/chat';
import { createPaymentOrder, verifyPayment, releasePayment } from '../../api/payment';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TextMessage = ({ message, isOwn }) => (
  <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl ${
    isOwn ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
  }`}>
    <p className="text-sm leading-relaxed">{message.text}</p>
    <p className="text-xs mt-1 text-gray-400">{formatTime(message.createdAt)}</p>
  </div>
);

const EnquiryMessage = ({ message, isOwn }) => (
  <div className={`max-w-xs md:max-w-sm rounded-2xl overflow-hidden border ${isOwn ? 'border-blue-200' : 'border-gray-200'} bg-white`}>
    <div className="bg-blue-50 px-4 py-2 flex items-center gap-2">
      <span className="text-sm">📋</span>
      <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Enquiry</span>
    </div>
    <div className="px-4 py-3">
      <div className="font-semibold text-gray-900 text-sm mb-1">{message.enquiry?.openingTitle || 'Opening'}</div>
      <p className="text-sm text-gray-600">{message.enquiry?.message}</p>
      <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
    </div>
  </div>
);

const PaymentRequestMessage = ({ message, isOwn, onPay }) => {
  const status = message.paymentRequest?.status;
  return (
    <div className="max-w-xs md:max-w-sm rounded-2xl overflow-hidden border border-gray-200 bg-white">
      <div className="bg-green-50 px-4 py-2 flex items-center gap-2">
        <span className="text-sm">💰</span>
        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Payment Request</span>
      </div>
      <div className="px-4 py-3">
        <div className="text-2xl font-bold text-gray-900 mb-1">₹{message.paymentRequest?.amount?.toLocaleString('en-IN')}</div>
        <div className="text-sm text-gray-600 mb-1">{message.paymentRequest?.description}</div>
        {message.paymentRequest?.contentType && (
          <div className="text-xs text-gray-400 mb-3 capitalize">Content: {message.paymentRequest.contentType}</div>
        )}
        {status === 'pending' && !isOwn && (
          <button onClick={() => onPay(message)} className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
            Pay Now
          </button>
        )}
        {status === 'paid' && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-semibold"><span>✅</span> Payment confirmed</div>
        )}
        {status === 'pending' && isOwn && <div className="text-xs text-gray-400">Waiting for payment...</div>}
        <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
};

const DeliveryMessage = ({ message, isOwn, onApprove }) => {
  const status = message.delivery?.status;
  return (
    <div className="max-w-xs md:max-w-sm rounded-2xl overflow-hidden border border-gray-200 bg-white">
      <div className="bg-purple-50 px-4 py-2 flex items-center gap-2">
        <span className="text-sm">📦</span>
        <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Delivery Submitted</span>
      </div>
      <div className="px-4 py-3">
        {message.delivery?.contentLink && (
          <a href={message.delivery.contentLink} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline break-all mb-2 block">
            View content →
          </a>
        )}
        {message.delivery?.note && <p className="text-sm text-gray-600 mb-2">{message.delivery.note}</p>}
        {status === 'pending' && !isOwn && (
          <button onClick={() => onApprove(message)} className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors mt-2">
            Approve Delivery
          </button>
        )}
        {status === 'approved' && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-semibold"><span>✅</span> Delivery approved</div>
        )}
        <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
};

const PaymentReleasedMessage = ({ message }) => (
  <div className="max-w-xs rounded-2xl overflow-hidden border border-green-200 bg-green-50">
    <div className="px-4 py-3 text-center">
      <div className="text-2xl mb-1">🎉</div>
      <div className="font-bold text-green-800 text-sm">Payment Released!</div>
      <div className="text-xs text-green-600 mt-1">{message.text}</div>
      <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
    </div>
  </div>
);

const PaymentConfirmedMessage = ({ message }) => (
  <div className="max-w-xs rounded-2xl overflow-hidden border border-blue-200 bg-blue-50">
    <div className="px-4 py-3 text-center">
      <div className="text-2xl mb-1">✅</div>
      <div className="font-bold text-blue-800 text-sm">Payment Confirmed!</div>
      <div className="text-xs text-blue-600 mt-1 leading-relaxed">{message.text}</div>
      <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
    </div>
  </div>
);

const PaymentRequestModal = ({ onClose, onSend }) => {
  const [form, setForm] = useState({ amount: '', description: '', contentType: 'reel' });
  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!form.amount || !form.description) return toast.error('Please fill all fields');
    setSending(true);
    await onSend(form);
    setSending(false);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
        <h3 className="font-bold text-gray-900 text-lg mb-4">Send Payment Request</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5000" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content type</label>
            <select value={form.contentType} onChange={e => setForm({ ...form, contentType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="reel">Reel</option>
              <option value="post">Post</option>
              <option value="story">Story</option>
              <option value="ugc">UGC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the deliverable..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={handleSend} disabled={sending} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{sending ? 'Sending...' : 'Send Request'}</button>
        </div>
      </div>
    </div>
  );
};

const DeliveryModal = ({ onClose, onSend }) => {
  const [form, setForm] = useState({ contentLink: '', note: '' });
  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!form.contentLink) return toast.error('Please add content link');
    setSending(true);
    await onSend(form);
    setSending(false);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
        <h3 className="font-bold text-gray-900 text-lg mb-4">Submit Delivery</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content link</label>
            <input type="url" value={form.contentLink} onChange={e => setForm({ ...form, contentLink: e.target.value })} placeholder="https://instagram.com/p/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} placeholder="Any notes for the brand..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={handleSend} disabled={sending} className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{sending ? 'Submitting...' : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
};

const ChatWindow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMessages(id);
        setMessages(res.data.messages);
      } catch {
        toast.error('Failed to load messages');
      }
    };
    load();

    socketRef.current = io(SOCKET_URL, { withCredentials: true });
    socketRef.current.emit('join_user', user.id);
    socketRef.current.emit('join_conversation', id);

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => {
        if (prev.find(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    socketRef.current.on('user_typing', ({ isTyping }) => {
      setIsTyping(isTyping);
    });

    return () => {
      socketRef.current.emit('leave_conversation', id);
      socketRef.current.disconnect();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const tempText = text.trim();
    setText('');
    try {
      const res = await sendMessage(id, { text: tempText, type: 'text' });
      setMessages(prev => {
        if (prev.find(m => m._id === res.data.message._id)) return prev;
        return [...prev, res.data.message];
      });
    } catch {
      toast.error('Failed to send message');
      setText(tempText);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socketRef.current?.emit('typing', { conversationId: id, userId: user.id, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { conversationId: id, userId: user.id, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendPaymentRequest = async (form) => {
    try {
      const res = await sendMessage(id, {
        type: 'payment_request',
        paymentRequest: { amount: Number(form.amount), description: form.description, contentType: form.contentType, status: 'pending' },
      });
      setMessages(prev => {
        if (prev.find(m => m._id === res.data.message._id)) return prev;
        return [...prev, res.data.message];
      });
      setShowPaymentModal(false);
      toast.success('Payment request sent');
    } catch {
      toast.error('Failed to send payment request');
    }
  };

  const handleSendDelivery = async (form) => {
    try {
      const res = await sendMessage(id, {
        type: 'delivery',
        delivery: { contentLink: form.contentLink, note: form.note, status: 'pending' },
      });
      setMessages(prev => {
        if (prev.find(m => m._id === res.data.message._id)) return prev;
        return [...prev, res.data.message];
      });
      setShowDeliveryModal(false);
      toast.success('Delivery submitted');
    } catch {
      toast.error('Failed to submit delivery');
    }
  };

const handlePay = async (message) => {
  try {
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }

    const orderRes = await createPaymentOrder({
      messageId: message._id,
      conversationId: id,
      amount: message.paymentRequest.amount,
    });

    const { orderId, amount, keyId, description } = orderRes.data;

    const options = {
      key: keyId,
      amount: amount,
      currency: 'INR',
      name: 'GoodCreator',
      description: description,
      order_id: orderId,
      handler: async (response) => {
        try {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            messageId: message._id,
            conversationId: id,
            amount: amount,
          });
          toast.success('Payment successful! 🎉');
          const res = await getMessages(id);
          setMessages(res.data.messages);
        } catch {
          toast.error('Payment verification failed. Contact support.');
        }
      },
      theme: { color: '#111827' },
      modal: {
        ondismiss: () => { toast('Payment cancelled'); },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    toast.error('Failed to initiate payment');
    console.error('[PAY] error:', error);
  }
};

  const handleApproveDelivery = async (message) => {
  try {
    await releasePayment({
      conversationId: id,
      deliveryMessageId: message._id,
    });
    toast.success('Delivery approved! Payment will be released within 24 hours. 🎉');
    const res = await getMessages(id);
    setMessages(res.data.messages);
  } catch {
    toast.error('Failed to approve delivery');
  }
};

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  const getOtherPartyName = () => {
    if (!conversation) return 'Chat';
    if (user.role === 'brand') return conversation.creatorId?.name || 'Creator';
    return conversation.brandId?.brandName || 'Brand';
  };

  const getOtherPartyPhoto = () => {
    if (!conversation) return null;
    if (user.role === 'brand') return conversation.creatorId?.profilePhoto;
    return conversation.brandId?.logo;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/messages')} className="p-1 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {getOtherPartyPhoto()
            ? <img src={getOtherPartyPhoto()} alt="" className="w-full h-full object-cover" />
            : getOtherPartyName()?.[0]?.toUpperCase()
          }
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-sm">{getOtherPartyName()}</div>
          {isTyping && <div className="text-xs text-gray-400">typing...</div>}
        </div>
      </div>

      {/* messages — pb-20 on mobile to clear bottom nav */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20 md:pb-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-200 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">{date}</div>
            </div>
            {msgs.map((message) => {
              const isOwn = message.senderRole === user.role;
              return (
                <div key={message._id} className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'text' && <TextMessage message={message} isOwn={isOwn} />}
                  {message.type === 'enquiry' && <EnquiryMessage message={message} isOwn={isOwn} />}
                  {message.type === 'payment_request' && <PaymentRequestMessage message={message} isOwn={isOwn} onPay={handlePay} />}
                  {message.type === 'delivery' && <DeliveryMessage message={message} isOwn={isOwn} onApprove={handleApproveDelivery} />}
                  {message.type === 'payment_released' && <PaymentReleasedMessage message={message} />}
                  {message.type === 'payment_confirmed' && <PaymentConfirmedMessage message={message} />}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* action buttons */}
      <div className="bg-white border-t border-gray-100 px-4 py-2 flex gap-2 flex-shrink-0">
        {user.role === 'creator' && (
          <>
            <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200 hover:bg-green-100 transition-colors">
              💰 Request Payment
            </button>
            <button onClick={() => setShowDeliveryModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200 hover:bg-purple-100 transition-colors">
              📦 Submit Delivery
            </button>
          </>
        )}
      </div>

      {/* input — extra bottom padding on mobile for bottom nav */}
      <div
        className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3 flex-shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
      >
        <textarea
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none resize-none max-h-32"
          style={{ overflowY: 'auto' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {showPaymentModal && <PaymentRequestModal onClose={() => setShowPaymentModal(false)} onSend={handleSendPaymentRequest} />}
      {showDeliveryModal && <DeliveryModal onClose={() => setShowDeliveryModal(false)} onSend={handleSendDelivery} />}
    </div>
  );
};

export default ChatWindow;
