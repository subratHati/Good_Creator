import { Pencil } from 'lucide-react';

// Shared two-option choice modal: real OAuth connect (currently routed to
// an "unavailable" message by the caller) vs. manual stats entry.
// Used both from CreatorProfile.jsx's Instagram section and from the
// home-page "Instagram not connected" reminder — kept as one component
// so both places always offer the identical choice, styled identically.
const InstagramConnectChoiceModal = ({ onClose, onChooseOAuth, onChooseManual }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-6">
        <h3 className="font-black text-gray-900 text-lg mb-1">Add Instagram stats</h3>
        <p className="text-sm text-gray-500 mb-5">Choose how you'd like to add your Instagram data.</p>

        <button
          onClick={onChooseOAuth}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all mb-3"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
            </svg>
          </div>
          <div>
            <div className="font-black text-sm text-gray-900">Connect Instagram</div>
            <div className="text-xs text-gray-400">Verified, auto-synced stats</div>
          </div>
        </button>

        <button
          onClick={onChooseManual}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
            <Pencil size={16} color="#155DFC" />
          </div>
          <div>
            <div className="font-black text-sm text-gray-900">Add stats manually</div>
            <div className="text-xs text-gray-400">Enter your followers &amp; reel views yourself</div>
          </div>
        </button>

        <button onClick={onClose} className="w-full mt-4 py-2.5 text-sm font-semibold text-gray-400">
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default InstagramConnectChoiceModal;
