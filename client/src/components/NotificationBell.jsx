import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import useAuth from '../hooks/useAuth';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  const getLastSeenTime = () => {
    const stored = localStorage.getItem(`notif_seen_${user?.id}`);
    return stored ? new Date(stored) : new Date(0);
  };

  const markAllSeen = () => {
    localStorage.setItem(`notif_seen_${user?.id}`, new Date().toISOString());
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const lastSeen = getLastSeenTime();

    try {
      const items = [];

      if (user.role === 'creator') {
        const enquiryRes = await axiosInstance.get('/enquiries/received');
        const enquiries = enquiryRes.data.enquiries || [];
        enquiries.forEach((e) => {
          items.push({
            id: e._id,
            type: 'enquiry',
            title: `${e.brandId?.brandName || 'A brand'} sent you an enquiry`,
            preview: e.message?.slice(0, 60) + (e.message?.length > 60 ? '...' : ''),
            unread: new Date(e.createdAt) > lastSeen,
            time: e.createdAt,
            action: () => { navigate('/creator/enquiries'); setOpen(false); },
          });
        });

        const appRes = await axiosInstance.get('/applications/my');
        const apps = appRes.data.applications || [];
        apps.filter(a => a.status === 'shortlisted' || a.status === 'viewed').forEach((a) => {
          items.push({
            id: a._id + '_app',
            type: 'application',
            title: a.status === 'shortlisted'
              ? `🎉 ${a.brandId?.brandName || 'Brand'} shortlisted you`
              : `${a.brandId?.brandName || 'Brand'} viewed your application`,
            preview: a.openingId?.title || 'Opening',
            unread: new Date(a.updatedAt || a.createdAt) > lastSeen,
            time: a.updatedAt || a.createdAt,
            action: () => { navigate('/creator/applications'); setOpen(false); },
          });
        });
      }

      if (user.role === 'brand') {
        const openingsRes = await axiosInstance.get('/openings/my');
        const openings = openingsRes.data.openings || [];

        for (const opening of openings.slice(0, 5)) {
          try {
            const appRes = await axiosInstance.get(`/applications/opening/${opening._id}`);
            const apps = appRes.data.applications || [];
            const pending = apps.filter(a => a.status === 'pending');
            if (pending.length > 0) {
              const newestApp = pending[0];
              items.push({
                id: opening._id + '_apps',
                type: 'application',
                title: `${pending.length} new application${pending.length > 1 ? 's' : ''} on "${opening.title}"`,
                preview: pending.map(a => a.creatorId?.name || 'Creator').slice(0, 2).join(', '),
                unread: new Date(newestApp.createdAt) > lastSeen,
                time: newestApp.createdAt,
                action: () => { navigate(`/brand/openings/${opening._id}/applicants`); setOpen(false); },
              });
            }
          } catch {
            // skip
          }
        }
      }

      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setNotifications(items.slice(0, 10));
      setUnreadCount(items.filter(n => n.unread).length);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    if (!open) {
      fetchNotifications();
      // mark all as seen when opening the panel
      setTimeout(markAllSeen, 1500);
    }
    setOpen(!open);
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="font-semibold text-gray-900 text-sm">Notifications</div>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <div className="text-sm font-medium text-gray-600 mb-1">All caught up!</div>
                <div className="text-xs text-gray-400">New activity will appear here.</div>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={n.action}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    n.unread ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900 leading-snug">{n.title}</div>
                      {n.preview && <div className="text-xs text-gray-400 mt-0.5 truncate">{n.preview}</div>}
                      <div className="text-xs text-gray-300 mt-1">{timeAgo(n.time)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => {
                navigate(user.role === 'creator' ? '/creator/enquiries' : '/brand/openings');
                setOpen(false);
              }}
              className="text-xs font-semibold text-blue-600 hover:underline w-full text-center"
            >
              View all activity →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;