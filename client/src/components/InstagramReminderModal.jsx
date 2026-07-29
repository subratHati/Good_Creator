// Shown once per login session on the creator home page, only when
// instagram.handle is still empty — nudges them toward connecting
// (either real OAuth or manual entry) since an empty Instagram section
// makes their profile far less attractive to brands browsing creators.
const InstagramReminderModal = ({ onClose, onOpenChoice }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-6 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
          </svg>
        </div>
        <h3 className="font-black text-gray-900 text-lg mb-2">Your Instagram isn't connected yet</h3>
        <p className="text-sm text-gray-500 mb-6">
          Add your Instagram to get more attention from brands and make your profile stand out. It only takes a minute.
        </p>
        <button
          onClick={onOpenChoice}
          className="w-full py-3 rounded-xl text-sm font-black text-white mb-2"
          style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
        >
          Add Instagram now
        </button>
        <button onClick={onClose} className="w-full py-2.5 text-sm font-semibold text-gray-400">
          Maybe later
        </button>
      </div>
    </div>
  </div>
);

export default InstagramReminderModal;
