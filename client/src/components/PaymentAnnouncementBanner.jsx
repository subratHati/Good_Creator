import { useState } from 'react';
import {
  X,
  FileText,
  IndianRupee,
  ShieldCheck,
  Send,
  CheckCircle2,
  Clock3,
  Wallet,
} from 'lucide-react';

// ─── TEMPORARY ANNOUNCEMENT BANNER ─────────────────────────────────────────
// Manually remove this component (and its usage in CreatorHome.jsx /
// BrandHome.jsx) after a week or two once the payment feature announcement
// has run its course. No tracking/dismissal logic by design — this is
// meant to be visible to everyone until it's manually taken out of the code.

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Create Collab',
    desc: 'Creator clicks Create Collab in the message section and adds the collaboration details.',
  },
  {
    number: '02',
    icon: IndianRupee,
    title: 'Brand Pays',
    desc: 'Brand reviews the collab details and makes the payment.',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'Payment Secured',
    desc: 'GoodCreator securely holds the payment until the delivery is approved.',
    highlight: true,
  },
  {
    number: '04',
    icon: Send,
    title: 'Send Delivery',
    desc: 'Creator completes the work, clicks Send Delivery, and selects the delivery method.',
    tag: 'Email • Drive • Direct Post • Collab',
  },
  {
    number: '05',
    icon: CheckCircle2,
    title: 'Approve & Get Paid',
    desc: 'Brand approves or rejects the delivery. After approval, payment reaches the creator within 48 hours.',
    final: true,
  },
];

const PaymentProcessModal = ({ onClose }) => (
<div
  className="fixed inset-0 flex items-end md:items-center justify-center px-0 md:px-4"
  style={{
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999,
  }}
  onClick={onClose}
>
  <div
    className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg overflow-hidden flex flex-col"
    style={{
      maxHeight: 'min(90vh, 90dvh)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    }}
    onClick={(e) => e.stopPropagation()}
  >
      {/* Mobile handle */}
      <div className="pt-3 md:hidden">
        <div
          className="w-10 h-1 rounded-full mx-auto"
          style={{ backgroundColor: '#E5E7EB' }}
        />
      </div>

     <div
  className="px-5 pt-5 pb-5 md:px-6 md:pt-6 md:pb-6 overflow-y-auto flex-1 min-h-0"
  style={{
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
  }}
>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              }}
            >
              <Wallet size={22} color="#155DFC" />
            </div>

            <div>
              <h3
                className="text-base md:text-lg font-black"
                style={{ color: '#101828' }}
              >
                How payments work
              </h3>

              <p
                className="text-xs mt-0.5"
                style={{ color: '#98A2B3' }}
              >
                Simple, secure & transparent
              </p>
            </div>

          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: '#F8FAFC',
              color: '#667085',
            }}
          >
            <X size={17} />
          </button>
        </div>


        {/* Steps */}
        <div className="relative">

          {/* Timeline */}
          <div
            className="absolute left-[20px] top-[42px] bottom-[42px] w-px"
            style={{
              background:
                'linear-gradient(to bottom, #BFDBFE, #DBEAFE, #BBF7D0)',
            }}
          />

          <div className="space-y-4">

            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="relative flex gap-3"
                >

                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: step.final
                          ? '#ECFDF3'
                          : step.highlight
                            ? '#EFF6FF'
                            : '#F8FAFC',

                        border: step.final
                          ? '1px solid #BBF7D0'
                          : step.highlight
                            ? '1px solid #BFDBFE'
                            : '1px solid #E5E7EB',
                      }}
                    >
                      <Icon
                        size={18}
                        color={
                          step.final
                            ? '#16A34A'
                            : step.highlight
                              ? '#155DFC'
                              : '#667085'
                        }
                      />
                    </div>

                  </div>


                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 rounded-2xl px-3.5 py-3"
                    style={{
                      backgroundColor: step.final
                        ? '#F0FDF4'
                        : step.highlight
                          ? '#F8FBFF'
                          : '#FFFFFF',

                      border: step.final
                        ? '1px solid #DCFCE7'
                        : step.highlight
                          ? '1px solid #E0ECFF'
                          : '1px solid #F2F4F7',
                    }}
                  >

                    {/* Title */}
                    <div className="flex items-center justify-between gap-2">

                      <div className="flex items-center gap-2">

                        <span
                          className="text-[10px] font-black tracking-wide"
                          style={{
                            color: step.final
                              ? '#16A34A'
                              : '#98A2B3',
                          }}
                        >
                          {step.number}
                        </span>

                        <h4
                          className="text-sm font-extrabold"
                          style={{ color: '#101828' }}
                        >
                          {step.title}
                        </h4>

                      </div>


                      {step.highlight && (
                        <span
                          className="text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                          style={{
                            backgroundColor: '#EFF6FF',
                            color: '#155DFC',
                          }}
                        >
                          SECURE
                        </span>
                      )}

                      {step.final && (
                        <span
                          className="text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                          style={{
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                          }}
                        >
                          PAID
                        </span>
                      )}

                    </div>


                    {/* Description */}
                    <p
                      className="text-[11px] md:text-xs leading-[1.45] mt-1.5"
                      style={{ color: '#667085' }}
                    >
                      {step.desc}
                    </p>


                    {/* Delivery methods */}
                    {step.tag && (
                      <div className="flex flex-wrap gap-1.5 mt-2">

                        {step.tag
                          .split(' • ')
                          .map((method) => (
                            <span
                              key={method}
                              className="text-[9px] font-semibold px-2 py-1 rounded-md"
                              style={{
                                backgroundColor: '#F8FAFC',
                                color: '#667085',
                                border: '1px solid #EAECF0',
                              }}
                            >
                              {method}
                            </span>
                          ))}

                      </div>
                    )}


                    {/* 48 hour payout */}
                    {step.final && (
                      <div
                        className="flex items-center gap-1.5 mt-2.5 pt-2.5"
                        style={{
                          borderTop: '1px solid #DCFCE7',
                        }}
                      >
                        <Clock3
                          size={13}
                          color="#16A34A"
                        />

                        <span
                          className="text-[10px] font-bold"
                          style={{
                            color: '#15803D',
                          }}
                        >
                          Payment credited within 48 hours of approval
                        </span>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        </div>


        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-xl text-sm font-black text-white"
          style={{
            backgroundColor: '#155DFC',
            boxShadow: '0 3px 0 0 #0C3EB5',
          }}
        >
          Got it, let's go!
        </button>

      </div>
    </div>
  </div>
);



const PaymentAnnouncementBanner = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full overflow-hidden relative group"
        style={{
          height: '36px',
          background:
            'linear-gradient(90deg, #0B1220 0%, #101828 35%, #123B8F 70%, #155DFC 100%)',
        }}
      >
        <style>{`
    @keyframes goodcreator-ticker-scroll {
      0% {
        transform: translate(100%, -50%);
      }

      100% {
        transform: translate(-100%, -50%);
      }
    }

    @keyframes goodcreator-banner-glow {
      0%, 100% {
        opacity: 0.35;
      }

      50% {
        opacity: 0.7;
      }
    }

    @keyframes goodcreator-live-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }

      50% {
        transform: scale(1.15);
        opacity: 0.7;
      }
    }
  `}</style>


        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(21,93,252,0.25) 50%, transparent 100%)',
            animation:
              'goodcreator-banner-glow 2.5s ease-in-out infinite',
          }}
        />


        {/* Running message */}
        <div
          className="absolute whitespace-nowrap flex items-center gap-2 text-xs font-bold"
          style={{
            color: '#FFFFFF',
            top: '50%',
            left: 0,
            lineHeight: '36px',
            animation:
              'goodcreator-ticker-scroll 18s linear infinite',
            textShadow:
              '0 1px 8px rgba(0,0,0,0.35)',
          }}
        >

          {/* LIVE indicator */}
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: '#155DFC',
              color: '#FFFFFF',
              lineHeight: '18px',
              boxShadow:
                '0 0 12px rgba(21,93,252,0.7)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: '#FACC15',
                animation:
                  'goodcreator-live-pulse 1.2s ease-in-out infinite',
              }}
            />

            LIVE
          </span>


          <span>
            💰 Payments are now live on GoodCreator
          </span>

          <span style={{ color: '#FACC15' }}>
            •
          </span>

          <span>
            Pay and get paid securely, right on the platform
          </span>

          <span
            style={{
              color: '#FACC15',
              fontSize: '14px',
            }}
          >
            →
          </span>

          <span style={{ color: '#BFDBFE' }}>
            Click to know more
          </span>

        </div>
      </button>
      {showModal && <PaymentProcessModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default PaymentAnnouncementBanner;
