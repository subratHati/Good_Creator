import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import usePushNotifications from '../hooks/usePushNotifications';

const PushPermissionBanner = () => {
  const { isSupported, permission, subscribed, loading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pushBannerDismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pushBannerDismissed', 'true');
  };

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) handleDismiss();
  };

  if (!isSupported || subscribed || dismissed || permission === 'denied') return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: '#EFF6FF', borderBottom: '1px solid #DBEAFE' }}>
      <Bell size={16} color="#155DFC" style={{ flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold" style={{ color: '#1E3A8A' }}>
          Turn on notifications to know instantly about new messages and updates.
        </span>
      </div>
      <button
        onClick={handleEnable}
        disabled={loading}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-black text-white disabled:opacity-60"
        style={{ backgroundColor: '#155DFC' }}
      >
        {loading ? 'Enabling...' : 'Enable'}
      </button>
      <button onClick={handleDismiss} className="flex-shrink-0 p-1" style={{ color: '#93B4FD' }}>
        <X size={16} />
      </button>
    </div>
  );
};

export default PushPermissionBanner;
