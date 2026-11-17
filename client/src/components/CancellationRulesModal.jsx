import { createPortal } from 'react-dom';
import { X, ShieldCheck, Timer, Wallet, CalendarX2, ClipboardCheck } from 'lucide-react';

const CONTACT_EMAIL = 'team@goodcreator.in';

// The rules are the same for brands and creators, so both sides read exactly
// the same words. Keep this list in step with what the site really does.
const RULES = [
  {
    icon: Timer,
    title: 'Pay within 10 minutes',
    text: 'A payment request can be paid for 10 minutes. After that it expires and the creator needs to send a new one.',
  },
  {
    icon: Wallet,
    title: 'Your payment is held safely',
    text: 'When a brand pays, the amount is held by GoodCreator. It is not sent to the creator until the delivery is approved.',
  },
  {
    icon: CalendarX2,
    title: 'If the creator misses the deadline',
    text: 'If the creator does not deliver the content before the deadline, the money is returned to the brand. GoodCreator will contact the brand to return the amount.',
  },
  {
    icon: ClipboardCheck,
    title: 'Brand reviews within 48 hours',
    text: 'After the creator submits the delivery, the brand has 48 hours to approve it or request changes. If the brand does not respond within 48 hours, GoodCreator will mark the delivery as approved and the payout to the creator will start.',
  },
];

const CancellationRulesModal = ({ onClose }) =>
  createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#EFF6FF' }}>
              <ShieldCheck size={20} color="#155DFC" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight" style={{ color: '#101828' }}>Cancellation &amp; refund rules</h3>
              <p className="text-xs" style={{ color: '#6B7280' }}>How payments, delivery and refunds work</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: '#9CA3AF' }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-2 overflow-y-auto">
          {RULES.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <div key={rule.title} className="flex gap-3 pb-5">
                <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
                  <Icon size={16} color="#101828" />
                </div>
                <div>
                  <p className="text-sm font-black mb-1" style={{ color: '#101828' }}>{i + 1}. {rule.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{rule.text}</p>
                </div>
              </div>
            );
          })}

          <p className="text-xs pb-4" style={{ color: '#6B7280' }}>
            Questions about a refund? Write to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold" style={{ color: '#155DFC' }}>{CONTACT_EMAIL}</a>.
          </p>
        </div>

        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-black text-white"
            style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

export default CancellationRulesModal;
