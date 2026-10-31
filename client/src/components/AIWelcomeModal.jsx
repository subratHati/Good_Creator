import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Search, Lightbulb, MessageCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { AssistantLogo } from './assistant/AssistantUI';

// Shown once per device, the first time someone opens the site after this release.
// To show it to everyone again (for a new announcement), change the version in this key,
// for example 'gc-ai-welcome-v2'.
const STORAGE_KEY = 'gc-ai-welcome-v1';

const POINTS = {
  creator: [
    { icon: Search, text: 'Find campaigns that match your profile' },
    { icon: Lightbulb, text: 'Get tips to improve your profile and win more brands' },
    { icon: MessageCircle, text: 'Ask anything about collaborations and payments' },
  ],
  brand: [
    { icon: Search, text: 'Find creators that fit your campaign' },
    { icon: Lightbulb, text: 'Get guidance on creating and running campaigns' },
    { icon: MessageCircle, text: 'Ask anything about collaborations and payments' },
  ],
};

const readSeen = () => {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
};
const markSeen = () => {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* storage blocked: the dialog may show again */ }
};

const AIWelcomeModal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // the assistant is for creators and brands only
  const eligible = !!user && (!user.role || user.role === 'creator' || user.role === 'brand');
  const onAssistantPage = pathname.startsWith('/messages/assistant');

  useEffect(() => {
    if (!eligible || onAssistantPage || readSeen()) return undefined;
    // small delay so the page loads first; counts as "seen" the moment it appears
    const t = setTimeout(() => { markSeen(); setOpen(true); }, 900);
    return () => clearTimeout(t);
  }, [eligible, onAssistantPage]);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open || !eligible || onAssistantPage) return null;

  const points = POINTS[user.role] || POINTS.creator;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gc-ai-welcome-title"
      onClick={close}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', maxWidth: '420px', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', padding: '6px', border: 'none', borderRadius: '999px', background: 'rgba(255,255,255,0.7)', cursor: 'pointer', color: '#667085' }}
        >
          <X size={18} />
        </button>

        <div style={{ padding: '32px 24px 22px', textAlign: 'center', borderRadius: '24px 24px 0 0', background: 'linear-gradient(160deg, #F0F9FF 0%, #EEF2FF 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <AssistantLogo size={68} glow />
          </div>
          <span style={{ display: 'inline-block', marginBottom: '8px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.6px', color: '#fff', background: 'linear-gradient(90deg, #38bdf8, #4f46e5)', borderRadius: '999px', padding: '3px 10px' }}>NEW</span>
          <h2 id="gc-ai-welcome-title" style={{ margin: 0, fontSize: '21px', fontWeight: 800, color: '#101828', lineHeight: 1.25 }}>
            GoodCreator is now AI powered
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: '13.5px', lineHeight: 1.5, color: '#475467' }}>
            Meet your new assistant. It is always one tap away from the AI button at the top.
          </p>
        </div>

        <div style={{ padding: '18px 24px 22px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {points.map(({ icon: Icon, text }) => (
              <li key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', background: '#EEF2FF', color: '#4f46e5', flexShrink: 0 }}>
                  <Icon size={17} />
                </span>
                <span style={{ fontSize: '13.5px', lineHeight: 1.4, color: '#344054', fontWeight: 500 }}>{text}</span>
              </li>
            ))}
          </ul>

          <p style={{ margin: '16px 0 0', fontSize: '11.5px', lineHeight: 1.5, color: '#667085', textAlign: 'center' }}>
            It may also message you twice a day with suggestions.
          </p>

          <button
            type="button"
            onClick={() => { close(); navigate('/messages/assistant'); }}
            style={{ marginTop: '16px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#fff', background: 'linear-gradient(90deg, #38bdf8, #4f46e5)', boxShadow: '0 6px 16px rgba(79,70,229,0.3)' }}
          >
            Try the AI assistant
          </button>
          <button
            type="button"
            onClick={close}
            style={{ marginTop: '6px', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#667085' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AIWelcomeModal;