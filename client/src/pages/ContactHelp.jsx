import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, ChevronDown, Send, CheckCircle2 } from 'lucide-react';
import { submitIssue } from '../api/issue';
import toast from 'react-hot-toast';

// TODO: replace with real, official contact details once finalized
const SUPPORT_EMAIL = 'support@goodcreator.in';
const SUPPORT_WHATSAPP = '910000000000';

const FAQS = [
  {
    q: 'How do I get paid after completing a collab?',
    a: 'Once a brand approves your delivered content, the payment is released and credited to your registered bank account within 48 hours.',
  },
  {
    q: 'Is my payment safe while working on a collab?',
    a: 'Yes. When a brand pays for a collab, GoodCreator holds the payment securely until you deliver the content and the brand approves it — the brand cannot access the funds once paid.',
  },
  {
    q: 'What if a brand rejects my delivered content?',
    a: "If a brand requests a revision, you'll be notified in the chat with their feedback so you can resubmit. If you believe a rejection is unfair, use the issue form below and our team will review it.",
  },
  {
    q: 'How do I add or update my bank details?',
    a: 'Go to your Profile → Payments → Bank Details, where you can view your saved details (masked for security) and edit them anytime.',
  },
  {
    q: 'What percentage does GoodCreator take from a collab?',
    a: 'GoodCreator charges a 15% platform fee on each collab, which is deducted automatically — the amount you see in your dashboard is always your actual take-home payout.',
  },
  {
    q: 'How do I report a fraud or scam attempt?',
    a: "Please use the 'Fraud / Scam Report' category in the issue form below with as much detail as possible. Our team takes these reports seriously and reviews them promptly.",
  },
  {
    q: 'Can I cancel a collab after payment is made?',
    a: 'Cancellations after payment are handled case by case. Please reach out via the issue form or contact us directly so we can help resolve it fairly for both sides.',
  },
  {
    q: 'How long does it take to get a response to my issue?',
    a: 'We aim to respond to submitted issues within 24-48 hours. For urgent matters, reaching out via WhatsApp or email is usually faster.',
  },
];

const CATEGORY_OPTIONS = [
  { value: 'collab_issue', label: 'Collab Issue' },
  { value: 'bug', label: 'Bug / Technical Issue' },
  { value: 'fraud_scam', label: 'Fraud / Scam Report' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'other', label: 'Other' },
];

const FAQItem = ({ faq }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-bold" style={{ color: '#101828' }}>{faq.q}</span>
        <ChevronDown
          size={16}
          color="#9CA3AF"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{faq.a}</p>
        </div>
      )}
    </div>
  );
};

const ContactHelp = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!category) return toast.error('Please select a category');
    if (!message.trim()) return toast.error('Please describe your issue');

    setSubmitting(true);
    try {
      await submitIssue({ category, message });
      setSubmitted(true);
      setCategory('');
      setMessage('');
      toast.success("Issue submitted — we'll get back to you soon");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="bg-white border-b sticky top-0 z-10" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold" style={{ color: '#101828' }}>Contact Us & Help</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">

        <div className="grid grid-cols-2 gap-3 mb-8">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="bg-white rounded-2xl border p-4 flex flex-col items-center text-center gap-2"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
              <Mail size={20} color="#155DFC" />
            </div>
            <div className="text-sm font-bold" style={{ color: '#101828' }}>Email Us</div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>{SUPPORT_EMAIL}</div>
          </a>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="bg-white rounded-2xl border p-4 flex flex-col items-center text-center gap-2"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
              <MessageCircle size={20} color="#16A34A" />
            </div>
            <div className="text-sm font-bold" style={{ color: '#101828' }}>WhatsApp</div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>Chat with us</div>
          </a>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Raise an Issue</h2>

          {submitted ? (
            <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#BBF7D0' }}>
              <CheckCircle2 size={36} color="#16A34A" style={{ margin: '0 auto 12px' }} />
              <div className="font-bold text-sm mb-1" style={{ color: '#101828' }}>Issue submitted</div>
              <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>We typically respond within 24-48 hours.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold hover:underline"
                style={{ color: '#155DFC' }}
              >
                Submit another issue
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E7EB' }}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2" style={{ color: '#374151' }}>Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                      style={{
                        backgroundColor: category === opt.value ? '#101828' : 'white',
                        color: category === opt.value ? 'white' : '#6B7280',
                        borderColor: category === opt.value ? '#101828' : '#E5E7EB',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2" style={{ color: '#374151' }}>
                  Explain your issue in detail
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Please describe what happened, including any relevant Collab IDs or dates..."
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none resize-none"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
                />
                <div className="text-xs text-right mt-1" style={{ color: '#9CA3AF' }}>{message.length}/2000</div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: submitting ? '#93B4FD' : '#155DFC', boxShadow: submitting ? 'none' : '0 3px 0 0 #0C3EB5' }}
              >
                <Send size={15} />
                {submitting ? 'Submitting...' : 'Submit Issue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactHelp;
