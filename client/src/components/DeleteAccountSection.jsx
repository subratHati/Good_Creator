import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { checkDeleteAccount, deleteMyAccount } from '../api/account';
import { DELETE_REASONS } from '../utils/deleteReasons';

const Overlay = ({ onClose, children }) =>
  createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 100000, backgroundColor: 'rgba(16,24,40,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl overflow-y-auto"
        style={{ maxHeight: 'calc(100dvh - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );

const DeleteAccountSection = () => {
  const { logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [modal, setModal] = useState(null); // null | 'blocked' | 'confirm'
  const [blockers, setBlockers] = useState([]);
  const [reasonCategory, setReasonCategory] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setReasonCategory('');
    setReasonText('');
    setPassword('');
    setShowPassword(false);
    setTyped('');
    setError('');
  };

  const closeModal = () => {
    if (deleting) return;
    setModal(null);
    resetForm();
  };

  const handleStart = async () => {
    setChecking(true);
    try {
      const res = await checkDeleteAccount();
      if (res.data.canDelete) {
        resetForm();
        setModal('confirm');
      } else {
        setBlockers(res.data.blockers || []);
        setModal('blocked');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not check your account. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteMyAccount({ password, reasonCategory, reasonText });
      toast.success('Your account has been deleted.');
      try { if (typeof logout === 'function') await logout(); } catch { /* ignore */ }
      try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ }
      window.location.replace('/');
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409 && data?.blockers) {
        setBlockers(data.blockers);
        setModal('blocked');
        resetForm();
      } else {
        setError(data?.message || 'Something went wrong. Please try again.');
      }
      setDeleting(false);
    }
  };

  const canSubmit = password.length > 0 && typed.trim().toUpperCase() === 'DELETE' && !deleting;

  return (
    <>
      <div className="mt-8 rounded-2xl border p-5 bg-white" style={{ borderColor: '#FECACA' }}>
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <Trash2 size={18} color="#DC2626" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black" style={{ color: '#101828' }}>Delete my account</h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>
              Permanently delete your account and personal data. This cannot be undone.
            </p>
            <button
              onClick={handleStart}
              disabled={checking}
              className="mt-3 px-4 py-2 rounded-xl text-sm font-bold border transition-colors disabled:opacity-60"
              style={{ borderColor: '#DC2626', color: '#DC2626', backgroundColor: 'white' }}
            >
              {checking ? 'Checking…' : 'Delete my account'}
            </button>
          </div>
        </div>
      </div>

      {/* blocked */}
      {modal === 'blocked' && (
        <Overlay onClose={closeModal}>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#FFFBEB' }}
                >
                  <AlertTriangle size={20} color="#D97706" />
                </div>
                <h3 className="text-base font-black" style={{ color: '#101828' }}>
                  You can't delete your account yet
                </h3>
              </div>
              <button onClick={closeModal} aria-label="Close" style={{ color: '#9CA3AF' }}>
                <X size={20} />
              </button>
            </div>
            <p className="text-sm mb-3" style={{ color: '#374151' }}>
              Please sort these out first:
            </p>
            <ul className="space-y-2 mb-5">
              {blockers.map((b) => (
                <li
                  key={b.code}
                  className="text-sm rounded-xl px-3 py-2.5 leading-relaxed"
                  style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}
                >
                  {b.message}
                </li>
              ))}
            </ul>
            <p className="text-xs mb-5" style={{ color: '#6B7280' }}>
              Once these are finished, come back and try again.
            </p>
            <button
              onClick={closeModal}
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#101828' }}
            >
              Got it
            </button>
          </div>
        </Overlay>
      )}

      {/* confirm */}
      {modal === 'confirm' && (
        <Overlay onClose={closeModal}>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#FEF2F2' }}
                >
                  <Trash2 size={18} color="#DC2626" />
                </div>
                <h3 className="text-base font-black" style={{ color: '#101828' }}>Delete your account?</h3>
              </div>
              <button onClick={closeModal} aria-label="Close" style={{ color: '#9CA3AF' }}>
                <X size={20} />
              </button>
            </div>

            <div
              className="rounded-xl p-3 mb-5 text-xs leading-relaxed space-y-1.5"
              style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}
            >
              <p><b>This is permanent and happens immediately.</b></p>
              <p>
                Deleted: your login, photo, profile details, AI assistant chats, support chats,
                notifications and applications.
              </p>
              <p>
                Kept (without your personal details): payment and collaboration records. People you
                chatted with will still see those chats, with your name shown as "Deleted user".
              </p>
            </div>

            <label className="block text-sm font-bold mb-2" style={{ color: '#101828' }}>
              Why are you leaving? <span className="font-normal" style={{ color: '#9CA3AF' }}>(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DELETE_REASONS.map((r) => {
                const active = reasonCategory === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReasonCategory(active ? '' : r.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                    style={{
                      backgroundColor: active ? '#101828' : 'white',
                      color: active ? 'white' : '#6B7280',
                      borderColor: active ? '#101828' : '#E5E7EB',
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Tell us more, so we can improve (optional)"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none mb-1"
              style={{ borderColor: '#E5E7EB', color: '#101828' }}
            />
            <div className="text-right text-xs mb-4" style={{ color: '#9CA3AF' }}>{reasonText.length}/500</div>

            <label className="block text-sm font-bold mb-2" style={{ color: '#101828' }}>
              Enter your password to confirm
            </label>
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                className="w-full rounded-xl border px-3 py-2.5 pr-11 text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#101828' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9CA3AF' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="block text-sm font-bold mb-2" style={{ color: '#101828' }}>
              Type <span style={{ color: '#DC2626' }}>DELETE</span> to continue
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none mb-4"
              style={{ borderColor: '#E5E7EB', color: '#101828' }}
            />

            {error && (
              <div
                className="text-sm rounded-xl px-3 py-2.5 mb-4"
                style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-sm font-bold border"
                style={{ borderColor: '#E5E7EB', color: '#374151', backgroundColor: 'white' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canSubmit}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ backgroundColor: '#DC2626' }}
              >
                {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting…</> : 'Delete forever'}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
};

export default DeleteAccountSection;