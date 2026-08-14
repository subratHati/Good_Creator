import { useState } from 'react';
import { saveReferralSource } from '../api/auth';
import toast from 'react-hot-toast';
import { usePostHog } from '@posthog/react'

const OPTIONS = [
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'friend_referral', label: 'Friend or referral', emoji: '👥' },
  { value: 'google_search', label: 'Google search', emoji: '🔍' },
  { value: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

// Shown once, right after a brand-new user completes registration + OTP
// verification. Purely for internal analytics.
//
// Deliberately centered on EVERY screen size (no mobile bottom-sheet
// behavior). A bottom-anchored sheet on mobile fights with the fixed
// BottomNav's stacking — centering avoids that class of bug entirely,
// since the card never approaches the bottom of the screen.
const ReferralSourceModal = ({ onClose }) => {

  const posthog = usePostHog();

  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  

  const handleSubmit = async () => {
    if (!selected) return toast.error('Please select an option');
    setSaving(true);
    try {
      await saveReferralSource({ referralSource: selected });
      posthog.capture('referral_source_selected', { source: selected });
      onClose();
    } catch {
      // this is internal analytics only — never block the user from
      // using the app just because this save failed
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('referralSourceSkipped', 'true');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100000 }}
    >
      <div
        className="bg-white w-full rounded-2xl overflow-y-auto"
        style={{ maxWidth: '420px', maxHeight: '85vh' }}
      >
        <div className="p-6">
          <div className="text-2xl mb-2">👋</div>
          <h3 className="font-black text-lg mb-1" style={{ color: '#101828' }}>One quick question</h3>
          <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>How did you hear about GoodCreator?</p>

          <div className="space-y-2 mb-6">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: selected === opt.value ? '#155DFC' : '#E5E7EB',
                  backgroundColor: selected === opt.value ? '#EFF6FF' : 'white',
                }}
              >
                <span className="text-lg">{opt.emoji}</span>
                <span className="font-semibold text-sm" style={{ color: selected === opt.value ? '#155DFC' : '#374151' }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ color: '#9CA3AF' }}
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralSourceModal;
