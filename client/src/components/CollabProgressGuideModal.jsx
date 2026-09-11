import { X, CheckCircle2, Circle } from 'lucide-react';

const CREATOR_STEPS = [
  { key: 'initiated', title: 'Initiated', desc: 'Collab payment received. The brand has paid and the amount is held securely.' },
  { key: 'submitted', title: 'Submitted', desc: 'After creating and posting the content, click "Submit Delivery" in the chat, then wait for the brand\'s approval.' },
  { key: 'approved', title: 'Approved', desc: "Once the brand approves your delivery, the collab is considered successful." },
  { key: 'paid_out', title: 'Paid', desc: 'Within 48 hours of approval, your payment is credited to your added bank account.' },
];

const BRAND_STEPS = [
  { key: 'initiated', title: 'Initiated', desc: "You've paid the creator. The amount is held securely until delivery is approved." },
  { key: 'submitted', title: 'Submitted', desc: 'The creator has submitted their content for your review in the chat.' },
  { key: 'approved', title: 'Approved', desc: 'Once you review and approve the delivery, the collab is considered successful.' },
  { key: 'paid_out', title: 'Paid', desc: "Within 48 hours of your approval, payment is released to the creator." },
];

const stageOrder = ['initiated', 'submitted', 'approved', 'paid_out'];
const stageIndex = (stage) => stageOrder.indexOf(stage);

const CollabProgressGuideModal = ({ currentStage, role, onClose }) => {
  const steps = role === 'brand' ? BRAND_STEPS : CREATOR_STEPS;
  const currentIdx = stageIndex(currentStage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="font-black text-lg" style={{ color: '#101828' }}>How this collab works</h3>
          <button onClick={onClose} style={{ color: '#9CA3AF' }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-4">
          {steps.map((step, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={step.key} className="flex gap-3 pb-5 relative">
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', left: '11px', top: '26px', bottom: 0, width: '2px', backgroundColor: isDone ? '#155DFC' : '#E5E7EB' }} />
                )}
                <div className="flex-shrink-0" style={{ zIndex: 1 }}>
                  {isDone || isCurrent ? (
                    <CheckCircle2 size={23} color={isCurrent ? '#155DFC' : '#16A34A'} fill={isDone ? '#DCFCE7' : 'none'} />
                  ) : (
                    <Circle size={23} color="#D1D5DB" />
                  )}
                </div>
                <div style={{ paddingTop: '1px' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black" style={{ color: isDone || isCurrent ? '#101828' : '#9CA3AF' }}>
                      Step {i + 1}: {step.title}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#155DFC' }}>Current</span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: isDone || isCurrent ? '#6B7280' : '#D1D5DB' }}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {role !== 'brand' && (
          <div className="mx-6 mb-6 rounded-xl p-3.5" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-xs font-bold leading-relaxed" style={{ color: '#92400E' }}>
              ⚠️ Important: Add your bank account before submitting your delivery for a seamless payout.
            </p>
          </div>
        )}

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-black text-white"
            style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollabProgressGuideModal;
