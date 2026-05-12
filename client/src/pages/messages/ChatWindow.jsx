import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { getMessages, sendMessage, getConversationById } from '../../api/chat';
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

// ─── MESSAGE COMPONENTS ───────────────────────────────────────────────────────

const TextMessage = ({ message, isOwn }) => (
  <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'}`}>
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
  const pr = message.paymentRequest;
  const deliverableList = [
    pr?.deliverables?.reels > 0 && `${pr.deliverables.reels} Reel${pr.deliverables.reels > 1 ? 's' : ''}`,
    pr?.deliverables?.posts > 0 && `${pr.deliverables.posts} Post${pr.deliverables.posts > 1 ? 's' : ''}`,
    pr?.deliverables?.stories > 0 && `${pr.deliverables.stories} Stor${pr.deliverables.stories > 1 ? 'ies' : 'y'}`,
    pr?.deliverables?.ugc > 0 && `${pr.deliverables.ugc} UGC`,
  ].filter(Boolean);

  return (
    <div className="max-w-xs md:max-w-sm rounded-2xl overflow-hidden border border-gray-200 bg-white">
      <div className="bg-green-50 px-4 py-2 flex items-center gap-2">
        <span className="text-sm">💰</span>
        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Payment Request</span>
      </div>
      <div className="px-4 py-3">
        <div className="text-2xl font-bold text-gray-900 mb-1">₹{pr?.amount?.toLocaleString('en-IN')}</div>
        {deliverableList.length > 0 && <div className="text-xs text-gray-600 mb-1">📦 {deliverableList.join(', ')}</div>}
        {pr?.deadline && (
          <div className="text-xs text-gray-500 mb-1">
            📅 Due {new Date(pr.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
        {pr?.description && <div className="text-xs text-gray-500 mb-2 italic">{pr.description}</div>}
        {status === 'pending' && !isOwn && (
          <button onClick={() => onPay(message)} className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors mt-2">Pay Now</button>
        )}
        {status === 'paid' && <div className="flex items-center gap-2 text-green-600 text-sm font-semibold"><span>✅</span> Payment confirmed</div>}
        {status === 'pending' && isOwn && <div className="text-xs text-gray-400 mt-1">Waiting for payment...</div>}
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
          <a href={message.delivery.contentLink} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline break-all mb-2 block">View content →</a>
        )}
        {message.delivery?.note && <p className="text-sm text-gray-600 mb-2">{message.delivery.note}</p>}
        {status === 'pending' && !isOwn && (
          <button onClick={() => onApprove(message)} className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors mt-2">Approve Delivery</button>
        )}
        {status === 'approved' && <div className="flex items-center gap-2 text-green-600 text-sm font-semibold"><span>✅</span> Delivery approved</div>}
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

const PaymentConfirmedMessage = ({ message, conversation }) => {
  const generatePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pr = message.paymentRequest;
      const platformFee = Math.round((pr?.amount || 0) * 0.15);
      const creatorAmount = (pr?.amount || 0) - platformFee;
      const brandName = conversation?.brandId?.brandName || 'Brand';
      const creatorName = conversation?.creatorId?.name || 'Creator';

      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('GoodCreator', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Work Agreement & Payment Receipt', 14, 22);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, 22);

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Parties', 14, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`Brand: ${brandName}`, 14, 52);
      doc.text(`Creator: ${creatorName}`, 14, 60);

      doc.setDrawColor(229, 231, 235);
      doc.line(14, 67, 196, 67);

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Deliverables', 14, 78);

      let y = 88;
      const deliverables = pr?.deliverables || {};
      const items = [
        { key: 'reels', label: 'Reels' },
        { key: 'posts', label: 'Posts' },
        { key: 'stories', label: 'Stories' },
        { key: 'ugc', label: 'UGC Videos' },
      ].filter(d => deliverables[d.key] > 0);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      items.forEach(item => { doc.text(`• ${deliverables[item.key]}x ${item.label}`, 14, y); y += 8; });
      if (pr?.deadline) { doc.text(`• Deadline: ${new Date(pr.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, y); y += 8; }
      if (pr?.description) { doc.text(`• Notes: ${pr.description}`, 14, y); y += 8; }

      y += 4;
      doc.setDrawColor(229, 231, 235);
      doc.line(14, y, 196, y);
      y += 10;

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Details', 14, y);
      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('Total Amount Paid:', 14, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(`Rs. ${pr?.amount?.toLocaleString('en-IN') || '0'}`, 100, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Platform Fee (15%):', 14, y);
      doc.text(`Rs. ${platformFee.toLocaleString('en-IN')}`, 100, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 163, 74);
      doc.text('Creator Payout:', 14, y);
      doc.text(`Rs. ${creatorAmount.toLocaleString('en-IN')}`, 100, y);
      y += 8;

      if (pr?.razorpayPaymentId) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('Payment ID:', 14, y);
        doc.text(pr.razorpayPaymentId, 100, y);
        y += 8;
      }
      if (pr?.paidAt) {
        doc.text('Paid On:', 14, y);
        doc.text(new Date(pr.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 100, y);
        y += 8;
      }

      y += 4;
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(14, y, 55, 10, 3, 3, 'F');
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT CONFIRMED', 17, y + 7);

      y += 18;
      doc.setDrawColor(229, 231, 235);
      doc.line(14, y, 196, y);
      y += 10;

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('The creator agreed to deliver the content as described above by the deadline.', 14, y); y += 6;
      doc.text('Payment will be released upon brand approval of the delivered content.', 14, y); y += 6;
      doc.text('This document serves as a binding work agreement between both parties.', 14, y);

      doc.setFillColor(249, 250, 251);
      doc.rect(0, 270, 210, 27, 'F');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text("GoodCreator — India's Creator Marketplace", 14, 280);
      doc.text('goodcreator.vercel.app', 14, 287);
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 120, 280);

      doc.save(`GoodCreator_Agreement_${brandName}_${creatorName}.pdf`);
      toast.success('Agreement downloaded!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="max-w-xs rounded-2xl overflow-hidden border border-blue-200 bg-blue-50">
      <div className="px-4 py-3 text-center">
        <div className="text-2xl mb-1">✅</div>
        <div className="font-bold text-blue-800 text-sm">Payment Confirmed!</div>
        <div className="text-xs text-blue-600 mt-1 leading-relaxed">{message.text}</div>
        <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
        <button onClick={generatePDF} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
          📄 Download Agreement PDF
        </button>
      </div>
    </div>
  );
};

// ─── MODALS ───────────────────────────────────────────────────────────────────

const PaymentRequestModal = ({ onClose, onSend }) => {
  const [form, setForm] = useState({
    amount: '', description: '', deadline: '',
    deliverables: { reels: 0, posts: 0, stories: 0, ugc: 0 },
    agreedToTerms: false,
  });
  const [sending, setSending] = useState(false);

  const handleDeliverable = (key, value) => {
    const num = Math.max(0, parseInt(value) || 0);
    setForm(prev => ({ ...prev, deliverables: { ...prev.deliverables, [key]: num } }));
  };

  const totalDeliverables = Object.values(form.deliverables).reduce((a, b) => a + b, 0);

  const handleSend = async () => {
    if (!form.amount) return toast.error('Please enter the amount');
    if (totalDeliverables === 0) return toast.error('Please add at least one deliverable');
    if (!form.deadline) return toast.error('Please set a deadline');
    if (!form.agreedToTerms) return toast.error('Please agree to the terms');
    setSending(true);
    await onSend(form);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg overflow-y-auto"
        style={{ maxHeight: '90vh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
        onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">Send Payment Request</h3>
          <p className="text-xs text-gray-400 mb-5">This will serve as a work agreement between you and the brand.</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deliverables <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {[{ key: 'reels', label: '🎬 Reels' }, { key: 'posts', label: '📷 Posts' }, { key: 'stories', label: '⏱ Stories' }, { key: 'ugc', label: '🎥 UGC' }].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
                    <span className="text-sm text-gray-700">{label}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleDeliverable(key, form.deliverables[key] - 1)} className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold hover:bg-gray-300">−</button>
                      <span className="w-4 text-center text-sm font-semibold text-gray-900">{form.deliverables[key]}</span>
                      <button type="button" onClick={() => handleDeliverable(key, form.deliverables[key] + 1)} className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold hover:bg-gray-800">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery deadline <span className="text-red-500">*</span></label>
              <input type="date" value={form.deadline} min={new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Any specific requirements or notes..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreedToTerms} onChange={e => setForm({ ...form, agreedToTerms: e.target.checked })} className="w-4 h-4 accent-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-blue-800 leading-relaxed">I agree to deliver the content as described above by the deadline. I understand that payment will be released only after the brand approves the delivery. This request serves as a binding work agreement.</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
            <button onClick={handleSend} disabled={sending} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{sending ? 'Sending...' : 'Send Request'}</button>
          </div>
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
            <input type="url" value={form.contentLink} onChange={e => setForm({ ...form, contentLink: e.target.value })} placeholder="https://instagram.com/p/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} placeholder="Any notes for the brand..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

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
  const messagesAreaRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const initialScrollDone = useRef(false);

  const scrollToBottom = (behavior = 'instant') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [msgRes, convRes] = await Promise.all([
          getMessages(id),
          getConversationById(id),
        ]);
        setMessages(msgRes.data.messages);
        setConversation(convRes.data.conversation);
        // scroll instantly after messages are set
        setTimeout(() => {
          scrollToBottom('instant');
          initialScrollDone.current = true;
        }, 0);
      } catch {
        toast.error('Failed to load messages');
      }
    };
    load();

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current.emit('join_user', user.id);
    socketRef.current.emit('join_conversation', id);

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => {
        if (prev.find(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
      if (message.senderRole !== user.role) {
        getMessages(id);
      }
    });

    socketRef.current.on('user_typing', ({ isTyping }) => {
      setIsTyping(isTyping);
    });

    return () => {
      socketRef.current.emit('leave_conversation', id);
      socketRef.current.disconnect();
    };
  }, [id]);

  // smooth scroll for new messages after initial load
  useEffect(() => {
    if (initialScrollDone.current) {
      scrollToBottom('smooth');
    }
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
        paymentRequest: {
          amount: Number(form.amount),
          description: form.description,
          deliverables: form.deliverables,
          deadline: form.deadline,
          agreedToTerms: form.agreedToTerms,
          status: 'pending',
        },
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
      const orderRes = await createPaymentOrder({ messageId: message._id, conversationId: id, amount: message.paymentRequest.amount });
      const { orderId, amount, keyId, description } = orderRes.data;
      const options = {
        key: keyId, amount, currency: 'INR', name: 'GoodCreator', description, order_id: orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              messageId: message._id, conversationId: id, amount,
            });
            toast.success('Payment successful! 🎉');
            const res = await getMessages(id);
            setMessages(res.data.messages);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        theme: { color: '#111827' },
        modal: { ondismiss: () => { toast('Payment cancelled'); } },
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
      await releasePayment({ conversationId: id, deliveryMessageId: message._id });
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
    // KEY FIX: position fixed on mobile so keyboard doesn't push header off screen
    <div className="fixed inset-0 flex flex-col bg-gray-50 md:relative md:inset-auto md:h-screen">

      {/* HEADER — always visible, never pushed off screen */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10">
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

      {/* MESSAGES — scrollable middle area */}
      <div ref={messagesAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
                  {message.type === 'payment_confirmed' && <PaymentConfirmedMessage message={message} conversation={conversation} />}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ACTION BUTTONS */}
      {user.role === 'creator' && (
        <div className="bg-white border-t border-gray-100 px-4 py-2 flex gap-2 flex-shrink-0">
          <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200 hover:bg-green-100 transition-colors">
            💰 Request Payment
          </button>
          <button onClick={() => setShowDeliveryModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200 hover:bg-purple-100 transition-colors">
            📦 Submit Delivery
          </button>
        </div>
      )}

      {/* INPUT — sticks above keyboard on mobile */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3 flex-shrink-0">
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
