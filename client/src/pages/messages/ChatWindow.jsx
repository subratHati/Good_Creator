import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, IndianRupee, PackageCheck, Info, FileText, Calendar, CheckCircle2, Clock, Wallet,
  CalendarDays,
  ShieldCheck,
  BadgeCheck,
  Clock3,
  Clapperboard,
  Image,
  BookOpen,
  Video,
  CreditCard,
  FolderCheck, Link2, StickyNote, CheckCircle, PartyPopper, Download,
  Copy, Check,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { getMessages, sendMessage, getConversationById } from '../../api/chat';
import { createPaymentOrder, verifyPayment, releasePayment, getAvailableCollabs, rejectDelivery, submitCreatorReview } from '../../api/payment';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
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
  const pr = message.paymentRequest;
  const deliverables = [
    { label: "Reel", count: pr?.deliverables?.reels, icon: Clapperboard },
    { label: "Post", count: pr?.deliverables?.posts, icon: Image },
    { label: "Story", count: pr?.deliverables?.stories, icon: BookOpen },
    { label: "UGC", count: pr?.deliverables?.ugc, icon: Video },
  ].filter((d) => d.count > 0);

  return (
    <div className="w-[340px] rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
          <Wallet className="w-5 h-5 text-[#155DFC]" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
            Collab Proposal
          </p>
          <p className="text-sm font-semibold text-gray-900">
            Create a Collab Proposal
          </p>
        </div>
      </div>

      <div className="p-5">
        {/* Amount */}
        <div className="text-center">
          <p className="text-[13px] text-gray-500">Total Amount</p>
          <h2 className="mt-1 text-4xl font-bold tracking-tight text-gray-900">
            ₹{pr?.amount?.toLocaleString("en-IN")}
          </h2>
        </div>

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Deliverables
            </p>
            <div className="flex flex-wrap gap-2">
              {deliverables.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      {item.count} {item.label}{item.count > 1 && item.label !== "UGC" ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deadline */}
        {pr?.deadline && (
          <div className="mt-6 border-t border-gray-100 pt-4 flex items-start gap-3">
            <CalendarDays className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Deadline</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(pr.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* Security */}
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
          <ShieldCheck className="w-4 h-4 text-[#155DFC]" />
          <p className="text-xs text-[#155DFC] font-medium">
            Secure payment protected by Good Creator
          </p>
        </div>

        {/* Action */}
        {status === "pending" && !isOwn && (
          <button
            onClick={() => onPay(message)}
            className="mt-5 w-full h-11 rounded-xl bg-[#155DFC] hover:bg-[#0F4FCC] transition-all duration-200 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            Pay Securely
          </button>
        )}

        {/* Status */}
        {status === "paid" && (
          <div className="mt-5 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2">
              <BadgeCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Payment Confirmed</span>
            </div>
          </div>
        )}
        {status === "pending" && isOwn && (
          <div className="mt-5 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
              <Clock3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Awaiting Payment</span>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-[11px] text-gray-400">
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};


const DeliveryMessage = ({ message, isOwn, onApprove, onReject }) => {
  const status = message.delivery?.status;
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const mediums = [
    message.delivery?.instagramLink && { label: 'Instagram', value: message.delivery.instagramLink, link: message.delivery.instagramLink },
    message.delivery?.whatsappNumber && { label: 'WhatsApp', value: message.delivery.whatsappNumber },
    message.delivery?.email && { label: 'Email', value: message.delivery.email },
    message.delivery?.otherMedium && { label: 'Other', value: message.delivery.otherMedium },
  ].filter(Boolean);

  return (
    <div className="w-[340px] rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
          <FolderCheck className="w-5 h-5 text-[#155DFC]" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Delivery</p>
          <p className="text-sm font-semibold text-gray-900">Content Submitted</p>
        </div>
      </div>

      <div className="p-5">
        {message.collabId && (
          <div className="mb-4 rounded-lg px-3 py-2" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Collab ID</p>
            <p className="text-sm font-mono font-bold text-gray-900">{message.collabId}</p>
          </div>
        )}

        {mediums.length > 0 && (
          <div className="space-y-2">
            {mediums.map((m, i) => (
              m.link ? (
                <a key={i} href={m.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 hover:bg-gray-100 transition-colors">
                  <Link2 className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 truncate">{m.label}: {m.value}</span>
                </a>
              ) : (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                  <Link2 className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 truncate">{m.label}: {m.value}</span>
                </div>
              )
            ))}
          </div>
        )}

        {message.delivery?.note && (
          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1.5">
              <StickyNote className="w-3 h-3" /> Note
            </p>
            <p className="text-sm leading-relaxed text-gray-700">{message.delivery.note}</p>
          </div>
        )}

        {status === 'pending' && !isOwn && !showRejectBox && (
          <div className="mt-5 flex gap-2">
            <button onClick={() => setShowRejectBox(true)} className="flex-1 h-10 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Request Revision
            </button>
            <button onClick={() => onApprove(message)} className="flex-1 h-10 rounded-xl bg-[#155DFC] hover:bg-[#0F4FCC] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          </div>
        )}

        {showRejectBox && (
          <div className="mt-4">
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={2}
              placeholder="What needs to change? (optional)"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowRejectBox(false)} className="flex-1 h-9 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold">Cancel</button>
              <button onClick={() => onReject(message, rejectReason)} className="flex-1 h-9 rounded-xl bg-red-600 text-white text-xs font-semibold">Send</button>
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div className="mt-5 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2">
              <BadgeCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Delivery Approved</span>
            </div>
          </div>
        )}
        {status === 'pending' && isOwn && (
          <div className="mt-5 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
              <Clock3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Awaiting Review</span>
            </div>
          </div>
        )}
        {status === 'revision_requested' && (
          <div className="mt-5 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2">
              <Clock3 className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Revision Requested</span>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-[11px] text-gray-400">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
};

const RatingModal = ({ onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) return toast.error('Please select a rating');
    setSubmitting(true);
    await onSubmit({ rating, reviewText });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
        <h3 className="font-bold text-gray-900 text-lg mb-1">Rate this creator</h3>
        <p className="text-xs text-gray-400 mb-5">Optional — helps other brands and improves the marketplace.</p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1–10)</label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="w-9 h-9 rounded-lg text-sm font-bold border-2 transition-all"
                style={{
                  borderColor: rating === n ? '#155DFC' : '#E5E7EB',
                  backgroundColor: rating === n ? '#155DFC' : 'white',
                  color: rating === n ? 'white' : '#374151',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            rows={3}
            placeholder="How was working with this creator?"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Skip</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-[#155DFC] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentReleasedMessage = ({ message, isOwn, conversation, userRole }) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleSubmitReview = async ({ rating, reviewText }) => {
    try {
      await submitCreatorReview({
        creatorId: conversation?.creatorId?._id,
        rating,
        reviewText,
        conversationId: conversation?._id,
      });
      toast.success('Review submitted!');
      setReviewSubmitted(true);
      setShowRatingModal(false);
    } catch {
      toast.error('Failed to submit review');
    }
  };

  // ─── BRAND'S VIEW ───────────────────────────────────────────────────────
  if (userRole === 'brand') {
    return (
      <>
        <div className="w-[300px] rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
              <BadgeCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Collab Complete</p>
              <p className="text-sm font-semibold text-gray-900">Payment Completed</p>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm leading-relaxed text-gray-700 mb-4">{message.text}</p>
            {reviewSubmitted ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-2.5">
                <BadgeCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Review submitted</span>
              </div>
            ) : (
              <button
                onClick={() => setShowRatingModal(true)}
                className="w-full h-10 rounded-xl border-2 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: '#E5E7EB', color: '#374151' }}
              >
                Give Feedback
              </button>
            )}
            <p className="mt-4 text-center text-[11px] text-gray-400">{formatTime(message.createdAt)}</p>
          </div>
        </div>
        {showRatingModal && (
          <RatingModal onClose={() => setShowRatingModal(false)} onSubmit={handleSubmitReview} />
        )}
      </>
    );
  }

  // ─── CREATOR'S VIEW ─────────────────────────────────────────────────────
  return (
    <div className="w-[300px] rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
          <PartyPopper className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Payout Initiated</p>
          <p className="text-sm font-semibold text-gray-900">Payment Released</p>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-gray-700">{message.text}</p>
        <p className="mt-4 text-center text-[11px] text-gray-400">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
};

const PaymentConfirmedMessage = ({ message, conversation }) => {
  const [copied, setCopied] = useState(false);

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

      // collab reference ID — prominent, right under the header
      if (message.collabId) {
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(14, 36, 70, 10, 2, 2, 'F');
        doc.setTextColor(21, 93, 252);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Collab ID: ${message.collabId}`, 17, 42.5);
      }

      // parties
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Parties', 14, 54);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`Brand: ${brandName}`, 14, 64);
      doc.text(`Creator: ${creatorName}`, 14, 72);
      doc.setDrawColor(229, 231, 235);
      doc.line(14, 79, 196, 79);
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Deliverables', 14, 90);
      let y = 100;
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
      items.forEach(item => {
        doc.text(`• ${deliverables[item.key]}x ${item.label}`, 14, y);
        y += 8;
      });
      if (pr?.deadline) {
        doc.text(`• Deadline: ${new Date(pr.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, y);
        y += 8;
      }
      if (pr?.description) {
        doc.text(`• Notes: ${pr.description}`, 14, y);
        y += 8;
      }
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

  const handleCopy = () => {
    if (!message.collabId) return;
    navigator.clipboard.writeText(message.collabId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-[300px] rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
          <BadgeCheck className="w-5 h-5 text-[#155DFC]" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
            Payment Secured
          </p>
          <p className="text-sm font-semibold text-gray-900">
            Payment Confirmed
          </p>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-gray-700">{message.text}</p>

        {message.collabId && (
          <button
            onClick={handleCopy}
            className="mt-4 w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-100"
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}
          >
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Collab ID</p>
              <p className="text-sm font-mono font-bold text-gray-900">{message.collabId}</p>
            </div>
            {copied ? (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </button>
        )}

        <button
          onClick={generatePDF}
          className="mt-3 w-full h-10 rounded-xl bg-[#155DFC] hover:bg-[#0F4FCC] transition-all duration-200 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download Agreement PDF
        </button>
        <p className="mt-4 text-center text-[11px] text-gray-400">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
};

// ─── MODALS ───────────────────────────────────────────────────────────────────

const PaymentRequestModal = ({ onClose, onSend }) => {
  const [form, setForm] = useState({
    amount: '',
    deadline: null,
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
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg overflow-y-auto"
        style={{ maxHeight: '90vh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">Create a Collab Proposal</h3>
          <p className="text-xs text-gray-400 mb-5">This will serve as a work agreement between you and the brand.</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deliverables <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'reels', label: '🎬 Reels' },
                  { key: 'posts', label: '📷 Posts' },
                  { key: 'stories', label: '⏱ Stories' },
                  { key: 'ugc', label: '🎥 UGC' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
                    <span className="text-sm text-gray-700">{label}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleDeliverable(key, form.deliverables[key] - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold hover:bg-gray-300">−</button>
                      <span className="w-4 text-center text-sm font-semibold text-gray-900">{form.deliverables[key]}</span>
                      <button type="button" onClick={() => handleDeliverable(key, form.deliverables[key] + 1)}
                        className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold hover:bg-gray-800">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="deadline-picker-wrapper">
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery deadline <span className="text-red-500">*</span></label>
              <DatePicker
                selected={form.deadline}
                onChange={(date) => setForm({ ...form, deadline: date })}
                minDate={new Date()}
                placeholderText="Select a deadline"
                dateFormat="d MMM yyyy"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
                wrapperClassName="w-full"
              />
              <style>{`
    .deadline-picker-wrapper .react-datepicker {
      font-family: inherit;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .deadline-picker-wrapper .react-datepicker__header {
      background-color: white;
      border-bottom: 1px solid #F3F4F6;
      padding-top: 14px;
    }
    .deadline-picker-wrapper .react-datepicker__current-month {
      font-weight: 700;
      font-size: 13px;
      color: #101828;
    }
    .deadline-picker-wrapper .react-datepicker__day-name {
      color: #9CA3AF;
      font-size: 11px;
      font-weight: 600;
    }
    .deadline-picker-wrapper .react-datepicker__day {
      border-radius: 8px;
      font-size: 13px;
      color: #374151;
      cursor: pointer;
    }
    .deadline-picker-wrapper .react-datepicker__day:hover {
      background-color: #EFF6FF;
    }
    .deadline-picker-wrapper .react-datepicker__day--selected,
    .deadline-picker-wrapper .react-datepicker__day--keyboard-selected {
      background-color: #155DFC;
      color: white;
      font-weight: 700;
    }
    .deadline-picker-wrapper .react-datepicker__day--disabled {
      color: #D1D5DB;
      cursor: not-allowed;
    }
    .deadline-picker-wrapper .react-datepicker__day--disabled:hover {
      background-color: transparent;
    }
    .deadline-picker-wrapper .react-datepicker__navigation-icon::before {
      border-color: #6B7280;
    }
    .deadline-picker-wrapper .react-datepicker__triangle {
      display: none;
    }
    .deadline-picker-wrapper .react-datepicker-popper {
      z-index: 60;
    }
  `}</style>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={e => setForm({ ...form, agreedToTerms: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 mt-0.5 flex-shrink-0"
                />
                <span className="text-xs text-blue-800 leading-relaxed">
                  I agree to deliver the content as described above by the deadline. I understand that payment will be released only after the brand approves the delivery. This request serves as a binding work agreement.
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
            <button onClick={handleSend} disabled={sending} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeliveryModal = ({ conversationId, onClose, onSend }) => {
  const [collabs, setCollabs] = useState([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);
  const [form, setForm] = useState({
    collabId: '',
    instagramLink: '',
    whatsappNumber: '',
    email: '',
    otherMedium: '',
    note: '',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchCollabs = async () => {
      try {
        const res = await getAvailableCollabs(conversationId);
        setCollabs(res.data.collabs || []);
      } catch {
        toast.error('Failed to load available collabs');
      } finally {
        setLoadingCollabs(false);
      }
    };
    fetchCollabs();
  }, [conversationId]);

  const handleSend = async () => {
    if (!form.collabId) return toast.error('Please select which collab this is for');
    const hasMedium = form.instagramLink || form.whatsappNumber || form.email || form.otherMedium;
    if (!hasMedium) return toast.error('Please provide at least one way to access the content');
    setSending(true);
    await onSend(form);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md overflow-y-auto"
        style={{ maxHeight: '90vh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">Submit Delivery</h3>
          <p className="text-xs text-gray-400 mb-5">Select the collab this delivery is for, then share where the brand can find your content.</p>

          <div className="space-y-4">
            {/* collab id dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Which collab is this for? <span className="text-red-500">*</span>
              </label>
              {loadingCollabs ? (
                <div className="text-sm text-gray-400 py-2.5">Loading...</div>
              ) : collabs.length === 0 ? (
                <div className="text-sm text-amber-600 py-2.5">No paid collabs awaiting delivery right now.</div>
              ) : (
                <select
                  value={form.collabId}
                  onChange={e => setForm({ ...form, collabId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Select a collab...</option>
                  {collabs.map(c => (
                    <option key={c.collabId} value={c.collabId}>
                      {c.collabId} · ₹{c.paymentRequest?.amount?.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                How are you sharing the deliverables with the brand?
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Only fill in the fields that apply — you don't need to fill all of them. For example, if you posted on Instagram and also emailed a copy, just fill those two.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram link</label>
              <p className="text-xs text-gray-400 mb-1">If the content is already posted on Instagram, paste the link here.</p>
              <input
                type="url"
                value={form.instagramLink}
                onChange={e => setForm({ ...form, instagramLink: e.target.value })}
                placeholder="https://instagram.com/p/..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp number</label>
              <p className="text-xs text-gray-400 mb-1">If you're sharing the content via WhatsApp, provide the number you sent it from.</p>
              <input
                type="tel"
                value={form.whatsappNumber}
                onChange={e => setForm({ ...form, whatsappNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-xs text-gray-400 mb-1">If you're sharing the content via email, provide the email address you used.</p>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other medium</label>
              <p className="text-xs text-gray-400 mb-1">Using something else, like Google Drive or a shared folder? Mention it here.</p>
              <input
                type="text"
                value={form.otherMedium}
                onChange={e => setForm({ ...form, otherMedium: e.target.value })}
                placeholder="e.g. Google Drive link, shared folder..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <textarea
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                rows={2}
                placeholder="Any notes for the brand..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
            <button onClick={handleSend} disabled={sending || collabs.length === 0} className="flex-1 py-3 bg-[#155DFC] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {sending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
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
  const [showCollabInfo, setShowCollabInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const isInitialLoad = useRef(true);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [msgRes, convRes] = await Promise.all([
          getMessages(id),
          getConversationById(id),
        ]);
        setMessages(msgRes.data.messages);
        setConversation(convRes.data.conversation);
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
      // mark as read instantly if message is from other party
      if (message.senderRole !== user.role) {
        getMessages(id); // this API call marks messages as read on backend
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

  useEffect(() => {
    const handleClickOutside = () => {
      setShowCollabInfo(false);
      setShowDeliveryInfo(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialLoad.current = false;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          deliverables: form.deliverables,
          deadline: form.deadline ? form.deadline.toISOString() : null,
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
        collabId: form.collabId,
        delivery: {
          instagramLink: form.instagramLink,
          whatsappNumber: form.whatsappNumber,
          email: form.email,
          otherMedium: form.otherMedium,
          note: form.note,
          status: 'pending',
        },
      });
      setMessages(prev => {
        if (prev.find(m => m._id === res.data.message._id)) return prev;
        return [...prev, res.data.message];
      });
      setShowDeliveryModal(false);
      toast.success('Delivery submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit delivery');
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
        amount,
        currency: 'INR',
        name: 'GoodCreator',
        description,
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              messageId: message._id,
              conversationId: id,
              amount,
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

  const handleRejectDelivery = async (message, reason) => {
    try {
      await rejectDelivery({ conversationId: id, deliveryMessageId: message._id, reason });
      toast.success('Revision requested');
      const res = await getMessages(id);
      setMessages(res.data.messages);
    } catch {
      toast.error('Failed to request revision');
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
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
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
                  {message.type === 'delivery' && <DeliveryMessage message={message} isOwn={isOwn} onApprove={handleApproveDelivery} onReject={handleRejectDelivery} />}
                  {message.type === 'payment_released' && <PaymentReleasedMessage message={message} isOwn={isOwn} conversation={conversation} userRole={user.role} />}
                  {message.type === 'payment_confirmed' && <PaymentConfirmedMessage message={message} conversation={conversation} />}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex gap-2 flex-shrink-0">
        {user.role === 'creator' && (
          <>
            <div className="relative">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 pl-4 pr-2 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#155DFC' }}
              >
                <IndianRupee size={15} strokeWidth={2.5} />
                Create Collab
                <span
                  onClick={(e) => { e.stopPropagation(); setShowCollabInfo(v => !v); setShowDeliveryInfo(false); }}
                  className="flex items-center justify-center w-5 h-5 rounded-full ml-0.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Info size={12} strokeWidth={2.5} />
                </span>
              </button>
              {showCollabInfo && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-0 mb-2 w-64 p-3.5 rounded-xl text-xs leading-relaxed z-20"
                  style={{ backgroundColor: '#101828', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                >
                  Propose your rate, deliverables, and deadline to the brand. Once they pay, the amount is held securely until you deliver the content and they approve it.
                  <div className="absolute top-full left-4 w-2.5 h-2.5 -mt-1.5 rotate-45" style={{ backgroundColor: '#101828' }} />
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="flex items-center gap-2 pl-4 pr-2 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-100"
                style={{ backgroundColor: '#F8FAFC', color: '#101828', border: '1.5px solid #E5E7EB' }}
              >
                <PackageCheck size={15} strokeWidth={2.5} />
                Submit Delivery
                <span
                  onClick={(e) => { e.stopPropagation(); setShowDeliveryInfo(v => !v); setShowCollabInfo(false); }}
                  className="flex items-center justify-center w-5 h-5 rounded-full ml-0.5"
                  style={{ backgroundColor: '#EFF6FF' }}
                >
                  <Info size={12} strokeWidth={2.5} style={{ color: '#155DFC' }} />
                </span>
              </button>
              {showDeliveryInfo && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-0 mb-2 w-64 p-3.5 rounded-xl text-xs leading-relaxed z-20"
                  style={{ backgroundColor: '#101828', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                >
                  Once you've posted the content, share the link here. The brand will review it, and your payment gets released once they approve the delivery.
                  <div className="absolute top-full left-4 w-2.5 h-2.5 -mt-1.5 rotate-45" style={{ backgroundColor: '#101828' }} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3 flex-shrink-0"
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
      {showDeliveryModal && <DeliveryModal conversationId={id} onClose={() => setShowDeliveryModal(false)} onSend={handleSendDelivery} />}
    </div>
  );
};

export default ChatWindow;